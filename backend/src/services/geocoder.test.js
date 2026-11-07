import assert from 'node:assert/strict';
import { after, test } from 'node:test';

process.env.NOMINATIM_CONTACT = 'test@example.com';

const originalFetch = globalThis.fetch;
let fetchCount = 0;
let requestUrl;
let requestHeaders;

globalThis.fetch = async (url, options) => {
  fetchCount += 1;
  requestUrl = url;
  requestHeaders = options.headers;
  return {
    ok: true,
    json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
  };
};

const { geocodeCity } = await import('./geocoder.js');

after(() => {
  globalThis.fetch = originalFetch;
});

test('identifies the app and caches repeated city queries', async () => {
  const firstResult = await geocodeCity('Test City');
  const cachedResult = await geocodeCity(' test city ');

  assert.deepEqual(cachedResult, firstResult);
  assert.equal(fetchCount, 1);
  assert.equal(new URL(requestUrl).searchParams.get('q'), 'Test City');
  assert.match(requestHeaders['User-Agent'], /test@example\.com/);
});