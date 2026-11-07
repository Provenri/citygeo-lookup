import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const normalizedUsername = username.trim();
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(normalizedUsername)) {
      return res.status(400).json({ error: 'username must be 3-32 letters, numbers, or underscores' });
    }
    const passwordBytes = Buffer.byteLength(password, 'utf8');
    if (passwordBytes < 8 || passwordBytes > 72) {
      return res.status(400).json({ error: 'password must be between 8 and 72 bytes' });
    }
    const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existing) return res.status(409).json({ error: 'Username taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: normalizedUsername, passwordHash }
    });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) { next(e); }
});

export default router;
