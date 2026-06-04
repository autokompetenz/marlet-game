import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    if (!username || !phone || !password)
      return res.status(400).json({ error: 'Champs requis' });
    if (password.length < 6)
      return res.status(400).json({ error: '6 caractères minimum' });

    const exist = await prisma.user.findFirst({
      where: { OR: [{ username }, { phone }] }
    });
    if (exist) return res.status(400).json({ error: 'Nom ou téléphone déjà utilisé' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, phone, password: hashed },
      select: { id: true, username: true, phone: true, role: true, balance: true, createdAt: true },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Identifiants invalides' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safe } = user;
    res.json({ user: safe, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Token Google requis' });

    const { data } = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!data.email) return res.status(400).json({ error: 'Email Google requis' });

    const googleId = data.sub;
    const email = data.email;
    const name = data.name || email.split('@')[0];

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { username: email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: email,
          googleId,
          role: 'USER',
          balance: 0,
        },
        select: { id: true, username: true, phone: true, role: true, balance: true, createdAt: true },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
        select: { id: true, username: true, phone: true, role: true, balance: true, createdAt: true },
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, phone: true, googleId: true, role: true, balance: true, createdAt: true, updatedAt: true },
  });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(user);
});

export default router;
