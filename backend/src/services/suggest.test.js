import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapPhotonFeatures } from './suggest.js';

const feature = (name, state, country, coords) => ({
  geometry: { coordinates: coords },
  properties: { name, state, country }
});

test('maps Photon features, drops invalid and duplicate entries', () => {
  const result = mapPhotonFeatures({
    features: [
      feature('Springfield', 'Illinois', 'United States', [-89.65, 39.8]),
      feature('Springfield', 'Illinois', 'United States', [-89.6, 39.7]),
      feature('Springfield', 'Missouri', 'United States', [-93.29, 37.2]),
      { geometry: {}, properties: { name: 'Nowhere' } }
    ]
  });

  assert.deepEqual(result.map(r => r.label), [
    'Springfield, Illinois, United States',
    'Springfield, Missouri, United States'
  ]);
  assert.equal(result[0].lat, 39.8);
  assert.equal(result[0].lon, -89.65);
});

test('handles an empty response', () => {
  assert.deepEqual(mapPhotonFeatures(undefined), []);
});
