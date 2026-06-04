import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { admin } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', admin, async (req, res) => {
  const [users, txns, bets, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.bet.count(),
    prisma.bet.aggregate({ _sum: { amount: true } }),
  ]);
  res.json({ users, transactions: txns, bets, totalBetAmount: revenue._sum.amount || 0 });
});

router.get('/users', admin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, phone: true, role: true, balance: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.get('/transactions', admin, async (req, res) => {
  const txns = await prisma.transaction.findMany({
    include: { user: { select: { username: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(txns);
});

router.get('/bets', admin, async (req, res) => {
  const bets = await prisma.bet.findMany({
    include: { user: { select: { username: true } }, game: { select: { label: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(bets);
});

router.patch('/users/:id/balance', admin, async (req, res) => {
  const { amount } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { balance: { increment: amount } },
  });
  res.json({ balance: user.balance });
});

export default router;
