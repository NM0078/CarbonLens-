/**
 * บัญชีผู้ใช้ผ่านหลังบ้าน (เดิมเก็บบัญชีไว้ใน localStorage ของเบราว์เซอร์)
 *
 * หลังบ้านเก็บรหัสผ่านแบบ bcrypt, จำกัดการเดารหัส และออก token อายุ 12 ชั่วโมง
 * หน้าบ้านเก็บแค่ token ไม่เก็บรหัสผ่าน
 */
import { API_ROUTES, ApiError, apiClient, tokenStore } from './api';

export type AuthUser = { id: string; name: string; firstName: string; lastName: string; email: string; role: 'member' | 'verifier' };

/** รูปแบบผู้ใช้ที่หลังบ้านส่งมา */
type ApiUser = { id: number; email: string; first_name: string; last_name: string; role: 'member' | 'verifier' };
type AuthResponse = { access_token: string; user: ApiUser };

function toAuthUser(user: ApiUser): AuthUser {
  return {
    id: String(user.id), email: user.email, role: user.role,
    firstName: user.first_name, lastName: user.last_name, name: `${user.first_name} ${user.last_name}`.trim(),
  };
}

/** มี token ค้างอยู่ไหม ใช้ตัดสินว่าต้องถามหลังบ้านหรือแสดงหน้าเข้าสู่ระบบเลย */
export function hasSavedSession(): boolean {
  return Boolean(tokenStore.get());
}

/** ตรวจ token ที่ค้างไว้กับหลังบ้าน ถ้าหมดอายุหรือใช้ไม่ได้จะลบทิ้งและคืน null */
export async function restoreSession(): Promise<AuthUser | null> {
  if (!tokenStore.get()) return null;
  try {
    return toAuthUser(await apiClient.get<ApiUser>(API_ROUTES.auth.me));
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) tokenStore.clear();
    throw caught;
  }
}

export async function registerAccount(firstName: string, lastName: string, email: string, password: string): Promise<AuthUser> {
  // ตรวจเบื้องต้นให้ผู้ใช้เห็นทันที หลังบ้านตรวจซ้ำอีกชั้น
  if (password.length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  if (!firstName.trim() || !lastName.trim()) throw new Error('กรุณากรอกชื่อและนามสกุล');
  const result = await apiClient.post<AuthResponse>(API_ROUTES.auth.register, {
    email: email.trim(), password, first_name: firstName.trim(), last_name: lastName.trim(),
  });
  tokenStore.set(result.access_token, false);
  return toAuthUser(result.user);
}

export async function signInAccount(email: string, password: string, remember: boolean): Promise<AuthUser> {
  const result = await apiClient.post<AuthResponse>(API_ROUTES.auth.login, { email: email.trim(), password });
  tokenStore.set(result.access_token, remember);
  return toAuthUser(result.user);
}

export function signOut(): void {
  tokenStore.clear();
}
