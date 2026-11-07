import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { geocodeCity } from '../services/geocoder.js';
import { suggestCities } from '../services/suggest.js';

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

router.get('/suggest', authenticateToken, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (q.length < 2 || q.length > 120) {
      return res.status(400).json({ error: 'q must be between 2 and 120 characters' });
    }
    res.json(await suggestCities(q));
  } catch (e) {
    next(e);
  }
});

router.post('/select', authenticateToken, async (req, res, next) => {
  try {
    const { name, country, label, lat, lon } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.length > 120) {
      return res.status(400).json({ error: 'valid name required' });
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'valid lat and lon required' });
    }
    const safeCountry = typeof country === 'string' ? country.slice(0, 120) : null;
    const displayName = typeof label === 'string' && label ? label.slice(0, 300) : name;

    await prisma.search.create({
      data: { city: name.trim(), country: safeCountry, lat, lon, userId: req.user.id }
    });

    res.json({ city: name.trim(), display_name: displayName, country: safeCountry, lat, lon });
  } catch (e) {
    next(e);
  }
});

export default router;
