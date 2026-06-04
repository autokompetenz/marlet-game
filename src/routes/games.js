import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth.js';
import { playDicePrediction } from '../games/dice.js';
import { playSlots } from '../games/slots.js';
import { playRoulette } from '../games/roulette.js';
import { playBlackjack } from '../games/blackjack.js';

const router = Router();
const prisma = new PrismaClient();
const MIN_BET = parseFloat(process.env.MIN_BET || '20');

async function placeBet(userId, gameName, betAmount, gameFn, resultData) {
  if (betAmount < MIN_BET)
    throw new Error(`Mise minimum: ${MIN_BET} FCFA`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.balance < betAmount)
    throw new Error('Solde insuffisant');

  const game = await prisma.game.findUnique({ where: { name: gameName } });
  if (!game || !game.active)
    throw new Error('Jeu indisponible');

  const result = gameFn(betAmount, resultData);

  const payout = result.totalPayout !== undefined ? result.totalPayout : result.payout;
  const diff = payout - betAmount;

  const bet = await prisma.$transaction(async (tx) => {
    const b = await tx.bet.create({
      data: {
        userId,
        gameId: game.id,
        amount: betAmount,
        multiplier: result.multiplier ?? 0,
        payout: payout,
        result: JSON.stringify(result),
        status: diff > 0 ? 'WON' : diff === 0 ? 'PENDING' : 'LOST',
      },
    });

    if (diff !== 0) {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: diff } },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: diff > 0 ? 'WIN' : 'BET',
          amount: Math.abs(diff),
          status: 'COMPLETED',
        },
      });
    }

    return b;
  });

  return { ...result, bet };
}

router.get('/games', async (req, res) => {
  const games = await prisma.game.findMany({ where: { active: true } });
  res.json(games);
});

router.post('/dice', auth, async (req, res) => {
  try {
    const { amount, prediction } = req.body;
    const result = await placeBet(req.user.id, 'dice', amount, (a) => playDicePrediction(a, prediction || 'over7'), null);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/slots', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const result = await placeBet(req.user.id, 'slots', amount, playSlots, null);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/roulette', auth, async (req, res) => {
  try {
    const { amount, bets } = req.body;
    const result = await placeBet(req.user.id, 'roulette', amount, (a) => playRoulette(a, bets || [{ type: 'red', amount: a }]), bets);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/blackjack', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const result = await placeBet(req.user.id, 'blackjack', amount, playBlackjack, null);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/history', auth, async (req, res) => {
  const bets = await prisma.bet.findMany({
    where: { userId: req.user.id },
    include: { game: { select: { name: true, label: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(bets);
});

export default router;
