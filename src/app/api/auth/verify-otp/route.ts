import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@/lib/db/types';
import { getJwtSecret } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rateLimiter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { phone, code, name } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and 6-digit OTP code are required' },
        { status: 400 }
      );
    }

    phone = phone.trim().replace(/\s+/g, '');
    if (!phone.startsWith('+91')) {
      if (phone.length === 10) phone = `+91${phone}`;
    }

    // 1. Brute-force protection (max 5 attempts per phone before 15-minute lockout)
    const bruteForceCheck = checkRateLimit(`otp-verify-attempts:${phone}`, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    if (!bruteForceCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Account temporarily locked. Please wait ${bruteForceCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Verify OTP against database
    const isValid = db.verifyOtp(phone, code.trim());
    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Invalid or expired verification code.',
          remainingAttempts: bruteForceCheck.remaining,
        },
        { status: 400 }
      );
    }

    // Reset rate limit on successful verification
    resetRateLimit(`otp-verify-attempts:${phone}`);

    // 3. User resolution: NEVER trust client-supplied role!
    // New phone registrations are strictly 'CUSTOMER' role.
    let user = db.getUserByPhone(phone);
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        phone,
        name: name?.trim() ? name.trim().slice(0, 100) : 'Local Customer',
        role: 'CUSTOMER' as UserRole, // Hardcoded: client cannot register as ADMIN or PROVIDER directly
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveUser(user);
    } else if (name && !user.name) {
      user.name = name.trim().slice(0, 100);
      user.updatedAt = new Date().toISOString();
      db.saveUser(user);
    }

    // 4. Sign JWT Token with server secret
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
      secret,
      { expiresIn: '30d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user,
      token,
    });

    // Set secure HTTP-only session cookies
    response.cookies.set('fixnear_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('localai_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error in /api/auth/verify-otp:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
