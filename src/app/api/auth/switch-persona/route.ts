import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { createSessionToken } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowDemoPersonas = process.env.ALLOW_DEMO_PERSONAS === 'true';

    // In production, prevent unauthorized demo persona switching
    if (isProduction && !allowDemoPersonas) {
      return NextResponse.json(
        { error: 'Demo persona switching is disabled in production. Please log in via phone OTP.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User persona not found' }, { status: 404 });
    }

    const token = createSessionToken(user);
    const response = NextResponse.json({
      success: true,
      message: `Switched session to ${user.name} (${user.role})`,
      user,
    });

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
    console.error('Error in /api/auth/switch-persona:', error);
    return NextResponse.json({ error: 'Failed to switch persona' }, { status: 500 });
  }
}
