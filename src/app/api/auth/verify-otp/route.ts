import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@/lib/db/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fixnear-super-secret-key-chilakaluripet-2026-production';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { phone, code, role = 'CUSTOMER', name } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and 6-digit OTP code are required' }, { status: 400 });
    }

    phone = phone.trim().replace(/\s+/g, '');
    if (!phone.startsWith('+91')) {
      if (phone.length === 10) phone = `+91${phone}`;
    }

    // Verify OTP against persistent DB
    const isValid = db.verifyOtp(phone, code.trim());
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 });
    }

    // Check if user exists
    let user = db.getUserByPhone(phone);
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        phone,
        name: name || (role === 'PROVIDER' ? 'New Service Partner' : 'Local Customer'),
        role: role as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveUser(user);
    }

    // Sign JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user,
      token,
    });

    // Set secure cookies (localai_session and fixnear_session)
    response.cookies.set('localai_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
    response.cookies.set('fixnear_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
