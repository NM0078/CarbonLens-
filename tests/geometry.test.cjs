const test = require('node:test');
const assert = require('node:assert/strict');
const { geodesicArea, areaUnits } = require('../geometry.cjs');

const smallSquare = [
  { lat: 18, lng: 98 },
  { lat: 18, lng: 98.01 },
  { lat: 18.01, lng: 98.01 },
  { lat: 18.01, lng: 98 },
];

test('calculates a geographic polygon area from coordinates', () => {
  const area = geodesicArea(smallSquare);
  assert.ok(area > 1_170_000 && area < 1_180_000, `unexpected area: ${area}`);
});

test('area does not depend on polygon winding direction', () => {
  const forward = geodesicArea(smallSquare);
  const reverse = geodesicArea([...smallSquare].reverse());
  assert.ok(Math.abs(forward - reverse) < 0.001);
});

test('accepts a GeoJSON-style repeated closing coordinate', () => {
  const closedRing = [...smallSquare, smallSquare[0]];
  assert.ok(Math.abs(geodesicArea(closedRing) - geodesicArea(smallSquare)) < 0.001);
});

test('returns zero for fewer than three vertices or malformed coordinates', () => {
  assert.equal(geodesicArea(smallSquare.slice(0, 2)), 0);
  assert.equal(geodesicArea([{ lat: 18, lng: 98 }, { lat: NaN, lng: 99 }, { lat: 19, lng: 98 }]), 0);
});

test('converts square meters to hectares and rai', () => {
  assert.deepEqual(areaUnits(16000), { squareMeters: 16000, hectares: 1.6, rai: 10 });
  assert.throws(() => areaUnits(-1), RangeError);
});
