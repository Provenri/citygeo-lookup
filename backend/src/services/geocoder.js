const cache = new Map();
const cacheTtlMs = 60 * 60 * 1000;
const configuredDelay = Number(process.env.NOMINATIM_DELAY_MS);
const requestIntervalMs = Number.isFinite(configuredDelay)
  ? Math.max(1000, configuredDelay)
  : 1000;

let nextRequestAt = 0;
let requestQueue = Promise.resolve();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.results;
}

export function geocodeCity(city) {
  const key = city.trim().toLowerCase();
  const cached = getCached(key);
  if (cached) return Promise.resolve(cached);

  const request = requestQueue.then(async () => {
    const queuedCache = getCached(key);
    if (queuedCache) return queuedCache;

    const waitMs = Math.max(0, nextRequestAt - Date.now());
    if (waitMs > 0) {
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    nextRequestAt = Date.now() + requestIntervalMs;

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', city);
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': `CityGeoLookup/1.0 (${process.env.NOMINATIM_CONTACT})`,
        'Accept-Language': 'en'
      }
    });
    if (!response.ok) {
      const error = new Error(`Geocoder request failed with ${response.status}`);
      error.status = 502;
      throw error;
    }

    const results = await response.json();
    cache.set(key, { results, expiresAt: Date.now() + cacheTtlMs });
    if (cache.size > 500) {
      cache.delete(cache.keys().next().value);
    }
    return results;
  });

  requestQueue = request.catch(() => {});
  return request;
}