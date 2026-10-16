import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../db/types';
import { db } from '../db/database';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.trim().length < 32) {
      throw new Error(
        'FATAL CONFIGURATION ERROR: JWT_SECRET must be set to a cryptographically secure string of at least 32 characters in production.'
      );
    }
    return secret.trim();
  }
  if (secret && secret.trim().length >= 16) {
    return secret.trim();
  }
  return 'phiksniyar-development-only-secret-key-not-for-production-use';
}

export interface AuthSessionPayload {
  userId: string;
  phone: string;
  role: UserRole;
  name: string;
}

export function getSessionCookieOptions(maxAge = 30 * 24 * 60 * 60) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/**
 * Reads and verifies the current session from HTTP-only cookie or Authorization header.
 * Validates token signature, expiration, algorithm, DB user existence, and suspension status.
 */
export async function getAuthSession(): Promise<AuthSessionPayload | null> {
  try {
    let token: string | undefined;

    // 1. Check Authorization: Bearer <token> header first (essential for Android native & API clients)
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice(7).trim();
      }
    } catch {}

    // 2. Fall back to secure HTTP-only cookies
    if (!token) {
      const cookieStore = await cookies();
      token =
        cookieStore.get('phiksniyar_session')?.value ||
        cookieStore.get('sevanta_session')?.value ||
        cookieStore.get('fixnear_session')?.value ||
        cookieStore.get('localai_session')?.value;
    }

    if (!token) return null;

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as Partial<AuthSessionPayload>;

    if (!decoded.userId || !decoded.phone || !decoded.role) {
      return null;
    }

    // Verify account existence in database
    const user = db.getUserById(decoded.userId);
    if (!user) {
      return null;
    }

    // Phase 2: Enforce account suspension check
    // If provider is suspended, immediately revoke active session privileges
    if (user.role === 'PROVIDER') {
      const provider = db.getProviderByUserId(user.id);
      if (provider && provider.verificationStatus === 'SUSPENDED') {
        return null;
      }
    }

    return {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    };
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
    { algorithm: 'HS256', expiresIn: '30d' }
  );
}
