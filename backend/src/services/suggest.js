const cache = new Map();
const cacheTtlMs = 10 * 60 * 1000;
const maxCacheEntries = 500;

export function mapPhotonFeatures(collection) {
  const seen = new Set();
  const suggestions = [];
  for (const feature of collection?.features || []) {
    const [lon, lat] = feature.geometry?.coordinates || [];
    const p = feature.properties || {};
    if (!p.name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const label = [p.name, p.state, p.country].filter(Boolean).join(', ');
    if (seen.has(label)) continue;
    seen.add(label);
    suggestions.push({
      name: p.name,
      state: p.state || null,
      country: p.country || null,
      label,
      lat,
      lon
    });
  }
  return suggestions;
}

export async function suggestCities(query, signal) {
  const key = query.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.suggestions;

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');
  url.searchParams.append('layer', 'city');

  const response = await fetch(url.toString(), {
    signal,
    headers: { 'User-Agent': `CityGeoLookup/1.0 (${process.env.NOMINATIM_CONTACT})` }
  });
  if (!response.ok) {
    const error = new Error(`Suggestion request failed with ${response.status}`);
    error.status = 502;
    throw error;
  }

  const suggestions = mapPhotonFeatures(await response.json()).slice(0, 5);
  cache.set(key, { suggestions, expiresAt: Date.now() + cacheTtlMs });
  if (cache.size > maxCacheEntries) cache.delete(cache.keys().next().value);
  return suggestions;
}
