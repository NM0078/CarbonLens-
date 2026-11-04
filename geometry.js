/* Spherical geodesic area helper shared by the browser app and Node tests. */
(function exposeGeometry(root, factory) {
  const geometry = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = geometry;
  if (root) root.CarbonLensGeometry = geometry;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createGeometry() {
  const EARTH_RADIUS_METERS = 6371008.8;

  /**
   * Approximate spherical geodesic area for a closed or open WGS84 lat/lng ring.
   * Leaflet lat/lng objects are expected; the first point need not be repeated.
   */
  function geodesicArea(latLngs) {
    if (!Array.isArray(latLngs) || latLngs.length < 3) return 0;
    let sum = 0;
    for (let i = 0; i < latLngs.length; i += 1) {
      const current = latLngs[i];
      const next = latLngs[(i + 1) % latLngs.length];
      if (!Number.isFinite(current?.lat) || !Number.isFinite(current?.lng)
        || !Number.isFinite(next?.lat) || !Number.isFinite(next?.lng)) return 0;
      const lat1 = current.lat * Math.PI / 180;
      const lat2 = next.lat * Math.PI / 180;
      const deltaLongitude = (next.lng - current.lng) * Math.PI / 180;
      sum += deltaLongitude * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs(sum * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS / 2);
  }

  function areaUnits(squareMeters) {
    if (!Number.isFinite(squareMeters) || squareMeters < 0) {
      throw new RangeError('Area must be a finite non-negative number');
    }
    return {
      squareMeters,
      hectares: squareMeters / 10000,
      rai: squareMeters / 1600,
    };
  }

  return { geodesicArea, areaUnits };
});
