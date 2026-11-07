import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { geocodeCity } from '../services/geocoder.js';

const router = Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const city = (req.query.city || '').toString().trim();
    if (!city) {
      return res.status(400).json({ error: 'city query parameter required' });
    }
    if (city.length < 2) {
      return res.status(400).json({ error: 'city name too short' });
    }
    if (city.length > 120) {
      return res.status(400).json({ error: 'city name too long' });
    }

    const results = await geocodeCity(city);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const place = results[0];
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const displayName = place.display_name || '';
    const country = place.address?.country || null;

    // Store search history
    await prisma.search.create({
      data: {
        city,
        country,
        lat,
        lon,
        userId: req.user.id
      }
    });

    res.json({
      city,
      display_name: displayName,
      country,
      lat,
      lon
    });
  } catch (e) {
    next(e);
  }
});

export default router;
