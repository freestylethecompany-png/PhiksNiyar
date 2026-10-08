import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:sevanta_session|fixnear_session|localai_session)=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as any;
      const user = db.getUserById(decoded.userId);
      if (!user) {
        return NextResponse.json({ authenticated: false, user: null });
      }

      let providerProfile = null;
      if (user.role === 'PROVIDER') {
        providerProfile = db.getProviderByUserId(user.id);
      }

      return NextResponse.json({
        authenticated: true,
        user,
        provider: providerProfile,
      });
    } catch (jwtErr) {
      return NextResponse.json({ authenticated: false, user: null });
    }
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ authenticated: false, error: 'Auth check failed' }, { status: 500 });
  }
}
