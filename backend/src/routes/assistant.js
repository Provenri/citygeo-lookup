import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { askAssistant } from '../services/assistant.js';

const router = Router();
const limits = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_USERS = 10000;

router.post('/', authenticateToken, async (req, res, next) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 9 ||
      messages.length % 2 !== 1 || messages.some((message, index) =>
        !message || message.role !== (index % 2 === 0 ? 'user' : 'assistant') ||
        typeof message.content !== 'string' || !message.content.trim() || message.content.length > 2000)) {
    return res.status(400).json({ error: 'Provide up to 9 alternating user and assistant messages, ending with a user message; each must be 1-2000 characters.' });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'The AI assistant is not configured.' });
  }
  if (!Number.isInteger(req.user?.id)) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  const now = Date.now();
  for (const [userId, entry] of limits) {
    if (entry.resetAt <= now && !entry.inFlight) limits.delete(userId);
  }
  let entry = limits.get(req.user.id);
  if (!entry) {
    if (limits.size >= MAX_USERS) {
      return res.status(429).json({ error: 'The AI assistant is busy. Please try again later.' });
    }
    entry = { count: 0, resetAt: now + WINDOW_MS, inFlight: false };
    limits.set(req.user.id, entry);
  }
  if (entry.inFlight || entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many AI requests. Please wait and try again.' });
  }
  entry.count += 1;
  entry.inFlight = true;
  try {
    const safeMessages = messages.map(({ role, content }) => ({ role, content: content.trim() }));
    res.json(await askAssistant(safeMessages, process.env.OPENROUTER_API_KEY));
  } catch (error) {
    if (error.status === 429 || error.status === 502 || error.status === 503 || error.status === 504) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  } finally {
    entry.inFlight = false;
  }
});

export default router;
