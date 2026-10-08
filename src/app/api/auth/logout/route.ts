import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };
  response.cookies.set('sevanta_session', '', cookieOptions);
  response.cookies.set('fixnear_session', '', cookieOptions);
  response.cookies.set('localai_session', '', cookieOptions);
  return response;
}
