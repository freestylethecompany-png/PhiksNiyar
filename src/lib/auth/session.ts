import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../db/types';
import { db } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'fixnear-super-secret-key-chilakaluripet-2026-production';

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
  const cookieStore = await cookies();
  const token = cookieStore.get('fixnear_session')?.value || cookieStore.get('localai_session')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSessionPayload;
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
  return jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
