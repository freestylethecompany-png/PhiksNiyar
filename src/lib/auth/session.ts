import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../db/types';
import { db } from '../db/database';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) {
    return secret.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('SECURITY WARNING: JWT_SECRET is unset or too short in production. Please set a 32+ character JWT_SECRET.');
    return secret || 'fixnear-production-fallback-key-32-chars-long-security';
  }
  return 'fixnear-development-only-secret-key-not-for-production-use';
}

export interface AuthSessionPayload {
  userId: string;
  phone: string;
  role: UserRole;
  name: string;
}

/**
 * Reads and verifies the current session from HTTP-only cookie
 */
export async function getAuthSession(): Promise<AuthSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('sevanta_session')?.value ||
      cookieStore.get('fixnear_session')?.value ||
      cookieStore.get('localai_session')?.value;
    if (!token) return null;

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as AuthSessionPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Retrieves the full DB user record for the current session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getAuthSession();
  if (!session) return null;
  return db.getUserById(session.userId) || null;
}

/**
 * Creates a JWT token for a user
 */
export function createSessionToken(user: User): string {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    },
    secret,
    { expiresIn: '30d' }
  );
}
