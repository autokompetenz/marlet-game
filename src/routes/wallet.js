import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../middleware/auth.js';
import * as mtn from '../services/mtn.js';

const router = Router();
const prisma = new PrismaClient();
const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT || '100');
const MIN_WITHDRAWAL = parseFloat(process.env.MIN_WITHDRAWAL || '500');
const HAS_MTN = !!(process.env.MTN_CONSUMER_KEY && process.env.MTN_CONSUMER_KEY.length > 10 && process.env.MTN_CONSUMER_SECRET && process.env.MTN_CONSUMER_SECRET.length > 5);

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
    const { amount } = req.body;
    if (!amount || amount < MIN_DEPOSIT)
      return res.status(400).json({ error: `Minimum ${MIN_DEPOSIT} FCFA` });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const reference = uuidv4();

    if (HAS_MTN) {
      const txn = await prisma.transaction.create({
        data: { userId: user.id, type: 'DEPOSIT', amount, status: 'PENDING', reference },
      });
      try {
        await mtn.requestPayment(user.phone, amount, reference);
      } catch {
        await prisma.transaction.update({ where: { id: txn.id }, data: { status: 'FAILED' } });
        return res.status(502).json({ error: 'Échec paiement MTN' });
      }
      res.json({ transaction: txn, reference, status: 'PENDING' });
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
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'Réference requise' });

    const result = await mtn.checkPaymentStatus(reference);
    if (result.status === 'SUCCESSFUL') {
      const txn = await prisma.transaction.findUnique({ where: { reference } });
      if (txn && txn.status === 'PENDING') {
        await prisma.$transaction([
          prisma.transaction.update({ where: { id: txn.id }, data: { status: 'COMPLETED' } }),
          prisma.user.update({ where: { id: txn.userId }, data: { balance: { increment: txn.amount } } }),
        ]);
      }
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
    const { amount } = req.body;
    if (!amount || amount < MIN_WITHDRAWAL)
      return res.status(400).json({ error: `Minimum ${MIN_WITHDRAWAL} FCFA` });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.balance < amount)
      return res.status(400).json({ error: 'Solde insuffisant' });

    const reference = uuidv4();

    if (HAS_MTN) {
      await prisma.$transaction([
        prisma.transaction.create({
          data: { userId: user.id, type: 'WITHDRAWAL', amount, status: 'PENDING', reference },
        }),
        prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: amount } } }),
      ]);
      try {
        await mtn.transfer(user.phone, amount, reference);
        await prisma.transaction.updateMany({ where: { reference }, data: { status: 'COMPLETED' } });
      } catch {
        await prisma.$transaction([
          prisma.transaction.updateMany({ where: { reference }, data: { status: 'FAILED' } }),
          prisma.user.update({ where: { id: user.id }, data: { balance: { increment: amount } } }),
        ]);
        return res.status(502).json({ error: 'Échec transfert MTN' });
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

export default router;
