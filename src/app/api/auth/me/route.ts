import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fixnear-super-secret-key-chilakaluripet-2026-production';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:fixnear_session|localai_session)=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
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
