const USERS_KEY = 'carbonlens-demo-users-v1';
const ITERATIONS = 210_000;

export type AuthUser = { id: string; name: string; firstName: string; lastName: string; email: string };
type StoredUser = AuthUser & { salt: string; passwordHash: string };

function toAuthUser(user: StoredUser): AuthUser {
  const parts = user.name.trim().split(/\s+/);
  return {
    id: user.id, name: user.name, email: user.email,
    firstName: user.firstName || parts.shift() || '',
    lastName: user.lastName || parts.join(' '),
  };
}

function readUsers(): StoredUser[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
    return Array.isArray(value) ? value as StoredUser[] : [];
  } catch { return []; }
}

export function getCurrentAuthUser(): AuthUser | null {
  const userId = sessionStorage.getItem('carbonlens-auth-session') || localStorage.getItem('carbonlens-auth-remember');
  if (!userId) return null;
  const user = readUsers().find((item) => item.id === userId);
  return user ? toAuthUser(user) : null;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  if (!crypto.subtle) throw new Error('เบราว์เซอร์นี้ไม่รองรับการจัดเก็บบัญชีสาธิตอย่างปลอดภัย');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toBase64(new Uint8Array(bits));
}

export async function registerLocalAccount(firstName: string, lastName: string, email: string, password: string): Promise<AuthUser> {
  if (password.length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  if (!firstName.trim() || !lastName.trim()) throw new Error('กรุณากรอกชื่อและนามสกุล');
  const users = readUsers();
  const normalizedEmail = email.trim().toLocaleLowerCase('en');
  if (users.some((user) => user.email === normalizedEmail)) throw new Error('อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const user: StoredUser = {
    id: crypto.randomUUID(), name: `${firstName.trim()} ${lastName.trim()}`, firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail,
    salt: toBase64(salt), passwordHash: await hashPassword(password, salt),
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  return toAuthUser(user);
}

export async function signInLocalAccount(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLocaleLowerCase('en');
  const user = readUsers().find((item) => item.email === normalizedEmail);
  if (!user || await hashPassword(password, fromBase64(user.salt)) !== user.passwordHash) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }
  return toAuthUser(user);
}
