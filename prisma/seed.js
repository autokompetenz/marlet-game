import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const games = [
  { name: 'dice', label: 'Lancer de dés', minBet: 20 },
  { name: 'slots', label: 'Machine à sous', minBet: 20 },
  { name: 'roulette', label: 'Roulette', minBet: 20 },
  { name: 'blackjack', label: 'Blackjack', minBet: 20 },
];

async function main() {
  for (const game of games) {
    await prisma.game.upsert({
      where: { name: game.name },
      update: game,
      create: game,
    });
  }
  console.log('Jeux créés');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      phone: '0000000000',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      balance: 100000,
    },
  });
  console.log('Admin créé:', admin.username);

  const demo = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      phone: '0000000001',
      password: await bcrypt.hash('demo123', 10),
      role: 'USER',
      balance: 5000,
    },
  });
  console.log('Demo créé:', demo.username);
}

main().catch(console.error).finally(() => prisma.$disconnect());
