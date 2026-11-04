/* Replace these endpoint templates with the deployment's versioned API contract. */
window.CarbonLensApiRoutes = Object.freeze({
  projects: Object.freeze({
    list: '/api/projects',
    create: '/api/projects',
    detail: '/api/projects/{id}',
    update: '/api/projects/{id}',
    remove: '/api/projects/{id}',
  }),
  parcels: Object.freeze({ boundary: '/api/projects/{projectId}/parcels/{parcelId}/boundary' }),
  satellite: Object.freeze({ scenes: '/api/satellite/scenes', indices: '/api/satellite/indices' }),
  assessment: Object.freeze({ run: '/api/projects/{projectId}/assessment' }),
  carbon: Object.freeze({ assess: '/api/projects/{projectId}/carbon-assessment' }),
  reports: Object.freeze({ create: '/api/reports', export: '/api/reports/{id}/export' }),
});
