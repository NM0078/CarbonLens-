const EARTH_RADIUS_METERS = 6_371_008.8;

/** Spherical geodesic area for an open or closed latitude/longitude ring. */
export function geodesicArea(points: Array<{ lat: number; lng: number }>): number {
  if (!Array.isArray(points) || points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    if (!Number.isFinite(current?.lat) || !Number.isFinite(current?.lng)
      || !Number.isFinite(next?.lat) || !Number.isFinite(next?.lng)) return 0;
    const lat1 = current.lat * Math.PI / 180;
    const lat2 = next.lat * Math.PI / 180;
    const deltaLongitude = (next.lng - current.lng) * Math.PI / 180;
    sum += deltaLongitude * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(sum * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS / 2);
}

export function areaUnits(squareMeters: number) {
  if (!Number.isFinite(squareMeters) || squareMeters < 0) {
    throw new RangeError('Area must be a finite non-negative number');
  }
  return { squareMeters, hectares: squareMeters / 10_000, rai: squareMeters / 1_600 };
}
