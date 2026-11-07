import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const searches = await prisma.search.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        city: true,
        country: true,
        lat: true,
        lon: true,
        createdAt: true
      }
    });

    res.json(searches);
  } catch (e) {
    next(e);
  }
});

export default router;
