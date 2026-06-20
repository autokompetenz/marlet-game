import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { auth } from '../middleware/auth.js';
import * as fedapay from '../services/fedapay.js';

const router = Router();
const prisma = new PrismaClient();
const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT || '100');
const MIN_WITHDRAWAL = parseFloat(process.env.MIN_WITHDRAWAL || '500');
const HAS_FEDAPAY = !!(process.env.FEDAPAY_API_KEY && process.env.FEDAPAY_API_KEY.length > 10);
const WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET || '';

router.get('/balance', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { balance: true },
  });
  res.json({ balance: user.balance });
});

router.get('/transactions', auth, async (req, res) => {
  const txns = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(txns);
});

router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, phone, provider } = req.body;
    if (!amount || amount < MIN_DEPOSIT)
      return res.status(400).json({ error: `Minimum ${MIN_DEPOSIT} FCFA` });
    if (!phone)
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    if (!provider || !['MTN', 'MOOV'].includes(provider))
      return res.status(400).json({ error: 'Opérateur requis (MTN ou MOOV)' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const reference = uuidv4();

    if (HAS_FEDAPAY) {
      const txn = await prisma.transaction.create({
        data: { userId: user.id, type: 'DEPOSIT', amount, status: 'PENDING', reference },
      });

      try {
        const fedapayTxn = await fedapay.createTransaction({
          amount: Math.round(amount),
          description: `Dépôt Marlet Game - ${reference}`,
          customer: {
            firstname: user.username,
            lastname: user.username,
            email: `${user.username}@marletgame.com`,
            phone: phone,
          },
          mode: provider === 'MTN' ? 'mtn_open' : 'moov_open',
          callbackUrl: `${process.env.APP_URL || 'https://marlet-game.vercel.app'}/api/wallet/webhook`,
        });
        const fedapayId = fedapayTxn?.transaction?.id || fedapayTxn?.id;
        const tokenData = await fedapay.getTransactionToken(fedapayId);
        const fedapayToken = tokenData?.token || tokenData?.transaction_token;

        await prisma.transaction.update({
          where: { id: txn.id },
          data: { reference: fedapayId.toString() },
        });

        res.json({ transaction: txn, fedapay_token: fedapayToken, fedapay_id: fedapayId, status: 'PENDING' });
      } catch (err) {
        await prisma.transaction.update({ where: { id: txn.id }, data: { status: 'FAILED' } });
        return res.status(502).json({ error: 'Échec création paiement FedaPay' });
      }
    } else {
      const txn = await prisma.$transaction(async (tx) => {
        const t = await tx.transaction.create({
          data: { userId: user.id, type: 'DEPOSIT', amount, status: 'COMPLETED', reference },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { increment: amount } },
        });
        return t;
      });
      res.json({ transaction: txn, reference, status: 'COMPLETED' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/deposit/confirm', auth, async (req, res) => {
  try {
    const { fedapay_id } = req.body;
    if (!fedapay_id) return res.status(400).json({ error: 'ID FedaPay requis' });

    const txn = await prisma.transaction.findFirst({ where: { reference: fedapay_id.toString() } });
    if (!txn) return res.status(404).json({ error: 'Transaction inconnue' });
    if (txn.status !== 'PENDING') return res.json({ status: txn.status });

    const result = await fedapay.getTransaction(parseInt(fedapay_id));
    const status = result?.transaction?.status || result?.status;

    if (status === 'approved') {
      await prisma.$transaction([
        prisma.transaction.update({ where: { id: txn.id }, data: { status: 'COMPLETED' } }),
        prisma.user.update({ where: { id: txn.userId }, data: { balance: { increment: txn.amount } } }),
      ]);
      res.json({ status: 'COMPLETED' });
    } else {
      res.json({ status: 'PENDING' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, phone, provider } = req.body;
    if (!amount || amount < MIN_WITHDRAWAL)
      return res.status(400).json({ error: `Minimum ${MIN_WITHDRAWAL} FCFA` });
    if (!phone)
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    if (!provider || !['MTN', 'MOOV'].includes(provider))
      return res.status(400).json({ error: 'Opérateur requis (MTN ou MOOV)' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.balance < amount)
      return res.status(400).json({ error: 'Solde insuffisant' });

    const reference = uuidv4();

    if (HAS_FEDAPAY) {
      await prisma.$transaction([
        prisma.transaction.create({
          data: { userId: user.id, type: 'WITHDRAWAL', amount, status: 'PENDING', reference },
        }),
        prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: amount } } }),
      ]);

      try {
        await fedapay.createTransfer({
          amount: Math.round(amount),
          phone,
          provider: (provider || 'mtn').toLowerCase(),
          description: `Retrait Marlet Game - ${reference}`,
          customerName: user.username,
        });
        await prisma.transaction.updateMany({ where: { reference }, data: { status: 'COMPLETED' } });
      } catch {
        await prisma.$transaction([
          prisma.transaction.updateMany({ where: { reference }, data: { status: 'FAILED' } }),
          prisma.user.update({ where: { id: user.id }, data: { balance: { increment: amount } } }),
        ]);
        return res.status(502).json({ error: 'Échec transfert FedaPay' });
      }

      res.json({ reference, status: 'COMPLETED' });
    } else {
      const txn = await prisma.$transaction(async (tx) => {
        const t = await tx.transaction.create({
          data: { userId: user.id, type: 'WITHDRAWAL', amount, status: 'COMPLETED', reference },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { decrement: amount } },
        });
        return t;
      });
      res.json({ transaction: txn, reference, status: 'COMPLETED' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-fedapay-signature'];
    if (WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');
      if (signature !== expected) {
        return res.status(401).json({ error: 'Signature invalide' });
      }
    }
    const event = req.body;
    if (event.event === 'transaction.approved') {
      const fedapayId = event.data?.id || event.data?.transaction?.id;
      if (fedapayId) {
        const txn = await prisma.transaction.findFirst({ where: { reference: fedapayId.toString() } });
        if (txn && txn.status === 'PENDING') {
          await prisma.$transaction([
            prisma.transaction.update({ where: { id: txn.id }, data: { status: 'COMPLETED' } }),
            prisma.user.update({ where: { id: txn.userId }, data: { balance: { increment: txn.amount } } }),
          ]);
        }
      }
    }
    if (event.event === 'transfer.sent' || event.event === 'transfer.completed') {
      const fedapayId = event.data?.id || event.data?.transfer?.id;
      if (fedapayId) {
        await prisma.transaction.updateMany({
          where: { reference: fedapayId.toString() },
          data: { status: 'COMPLETED' },
        });
      }
    }
    if (event.event === 'transaction.declined' || event.event === 'transaction.canceled') {
      const fedapayId = event.data?.id || event.data?.transaction?.id;
      if (fedapayId) {
        const txn = await prisma.transaction.findFirst({ where: { reference: fedapayId.toString() } });
        if (txn && txn.status === 'PENDING') {
          await prisma.transaction.update({ where: { id: txn.id }, data: { status: 'FAILED' } });
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.json({ received: true });
  }
});

export default router;
