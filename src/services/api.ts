/**
 * ตัวเรียก API ของหลังบ้าน CarbonLens (repo CarbonLens(backend))
 *
 * - ที่อยู่หลังบ้านตั้งด้วย VITE_API_BASE_URL เช่น http://127.0.0.1:8010 (ดู .env.example)
 * - หลังบ้านยืนยันตัวตนด้วย token แบบ Bearer ไม่ใช้ cookie จึงแนบ token ใน header ทุกคำขอ
 * - ข้อความ error ใช้ข้อความภาษาไทยที่หลังบ้านส่งมา (ช่อง detail) เพื่อให้ผู้ใช้รู้สาเหตุจริง
 */

export const API_ROUTES = {
  auth: { register: '/api/auth/register', login: '/api/auth/login', me: '/api/auth/me', changePassword: '/api/auth/change-password', googleStart: '/api/auth/google/start' },
  plots: {
    list: '/api/plots', create: '/api/plots',
    detail: (id: string) => `/api/plots/${encodeURIComponent(id)}`,
    imagery: (id: string, refresh = false) => `/api/plots/${encodeURIComponent(id)}/imagery${refresh ? '?refresh=true' : ''}`,
    analyze: (id: string) => `/api/plots/${encodeURIComponent(id)}/analyze`,
    runs: (id: string) => `/api/plots/${encodeURIComponent(id)}/runs`,
    report: (id: string) => `/api/plots/${encodeURIComponent(id)}/report?format=html`,
  },
  job: (runId: number) => `/api/jobs/${runId}`,
  dashboard: '/api/dashboard',
  health: '/api/health',
} as const;

const TOKEN_KEY = 'carbonlens-api-token';
const DEFAULT_TIMEOUT_MS = 30_000;

/** error ที่มีรหัสสถานะ HTTP เพื่อให้ผู้เรียกแยกได้ เช่น 401 = ต้องเข้าสู่ระบบใหม่ */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** token เก็บใน sessionStorage (หายเมื่อปิดแท็บ) หรือ localStorage เมื่อเลือก "จำฉันไว้" */
export const tokenStore = {
  get(): string | null {
    try { return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token: string, remember: boolean) {
    try {
      this.clear();
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch { /* เบราว์เซอร์ปิดที่เก็บข้อมูล ใช้งานได้จนกว่าจะรีเฟรช */ }
  },
  clear() {
    try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); } catch { /* ไม่มีอะไรให้ลบ */ }
  },
};

/** อ่านข้อความ error จาก FastAPI: detail เป็นข้อความ หรือรายการข้อผิดพลาดของช่องข้อมูล (422) */
function errorMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0] as { msg?: string; loc?: unknown[] };
    const field = Array.isArray(first.loc) ? first.loc.slice(1).join('.') : '';
    return `ข้อมูลไม่ถูกต้อง${field ? ` (${field})` : ''}: ${first.msg ?? ''}`.trim();
  }
  if (status === 0) return 'เชื่อมต่อหลังบ้านไม่ได้ กรุณาตรวจว่าระบบหลังบ้านเปิดอยู่';
  return `หลังบ้านตอบกลับผิดพลาด (${status})`;
}

export class ApiClient {
  constructor(private readonly baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')) {}

  /** หลังบ้านถูกตั้งไว้หรือยัง ถ้ายังไม่ตั้ง หน้าเว็บจะบอกผู้ใช้ตรงๆ แทนการเก็บข้อมูลไว้ในเบราว์เซอร์ */
  get configured(): boolean { return Boolean(this.baseUrl); }

  async request<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
    if (!this.configured) throw new ApiError('ยังไม่ได้ตั้งค่าที่อยู่หลังบ้าน (VITE_API_BASE_URL)', 0);
    const token = tokenStore.get();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
    } catch (caught) {
      const timedOut = caught instanceof DOMException && caught.name === 'AbortError';
      throw new ApiError(timedOut ? 'หลังบ้านตอบช้าเกินไป กรุณาลองใหม่' : errorMessage(0, null), 0);
    } finally {
      window.clearTimeout(timer);
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(errorMessage(response.status, body), response.status);
    return body as T;
  }

  get<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS) { return this.request<T>(path, { method: 'GET' }, timeoutMs); }

  /** ดาวน์โหลดไฟล์ที่ต้องเข้าสู่ระบบ (เช่น รายงาน) ลิงก์ธรรมดาแนบ token ไม่ได้ จึงโหลดเป็น blob ก่อน */
  async download(path: string, fileName: string): Promise<void> {
    if (!this.configured) throw new ApiError('ยังไม่ได้ตั้งค่าที่อยู่หลังบ้าน (VITE_API_BASE_URL)', 0);
    const token = tokenStore.get();
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch {
      throw new ApiError(errorMessage(0, null), 0);
    }
    if (!response.ok) throw new ApiError(errorMessage(response.status, await response.json().catch(() => null)), response.status);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(await response.blob());
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  post<T>(path: string, data?: unknown) { return this.request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) }); }
  patch<T>(path: string, data: unknown) { return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }); }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }
}

export const apiClient = new ApiClient();
