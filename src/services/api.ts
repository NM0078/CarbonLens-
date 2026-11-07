export const API_ROUTES = {
  auth: { register: '/api/auth/register', login: '/api/auth/login', googleStart: '/api/auth/google/start' },
  projects: { list: '/api/projects', create: '/api/projects', detail: '/api/projects/{id}', update: '/api/projects/{id}', remove: '/api/projects/{id}' },
  parcels: { boundary: '/api/projects/{projectId}/parcels/{parcelId}/boundary' },
  satellite: { scenes: '/api/satellite/scenes', indices: '/api/satellite/indices' },
  reports: { create: '/api/reports', export: '/api/reports/{id}/export' },
} as const;

export class ApiClient {
  constructor(private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? '') {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
