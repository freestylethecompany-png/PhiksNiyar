import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';

/**
 * DELETE /api/auth/delete-account
 * Google Play Store & DPDP Act 2023 Mandatory Policy Endpoint
 * Allows authenticated users to permanently delete their account and purge personal data.
 */
export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to delete your account.' },
        { status: 401 }
      );
    }

    // Call database account deletion and PII scrubbing
    const result = db.deleteUserAccount(session.userId);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Your PhiksNiyar account and associated personal data have been permanently deleted.',
    });

    // Clear all session cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    };

    response.cookies.set('phiksniyar_session', '', cookieOptions);
    response.cookies.set('sevanta_session', '', cookieOptions);
    response.cookies.set('fixnear_session', '', cookieOptions);
    response.cookies.set('localai_session', '', cookieOptions);

    return response;
  } catch (error) {
    console.error('Error in DELETE /api/auth/delete-account:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting your account.' },
      { status: 500 }
    );
  }
}

// Support POST with action=delete for web clients without DELETE support
export async function POST(request: Request) {
  return DELETE(request);
}
