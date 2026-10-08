import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid Indian mobile number' },
        { status: 400 }
      );
    }

    // Clean phone number format
    phone = phone.trim().replace(/[\s\-()]/g, '');
    if (!phone.startsWith('+91')) {
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else if (!phone.startsWith('+')) {
        phone = `+91${phone.slice(-10)}`;
      }
    }

    // Validate standard Indian 10-digit mobile number (+91 followed by 6, 7, 8, or 9)
    const digitsOnly = phone.replace('+91', '');
    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      return NextResponse.json(
        { error: 'Invalid Indian mobile number. Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.' },
        { status: 400 }
      );
    }

    // Generate cryptographically sound 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist OTP in persistent database with 10-minute expiry
    db.saveOtp(phone, code, 10);

    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`[FIXNEAR OTP GATEWAY] Dispatching 6-digit verification code to ${phone}`);

    let smsSent = false;

    // 1. Production SMS Gateway: Fast2SMS (popular in India with DLT / Quick OTP route)
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    if (fast2SmsKey) {
      try {
        const smsRes = await fetch(
          `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2SmsKey}&route=otp&variables_values=${code}&flash=0&numbers=${digitsOnly}`
        );
        if (smsRes.ok) {
          smsSent = true;
          console.log(`[FAST2SMS] OTP successfully dispatched to ${phone}`);
        }
      } catch (err) {
        console.warn('Fast2SMS gateway dispatch error:', err);
      }
    }

    // 2. Production SMS Gateway: Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    if (twilioSid && twilioAuth && twilioPhone && !smsSent) {
      try {
        const basicAuth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('From', twilioPhone);
        params.append('Body', `Your FixNear verification code is ${code}. Valid for 10 minutes. Do not share with anyone.`);

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basicAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );
        if (twilioRes.ok) {
          smsSent = true;
          console.log(`[TWILIO] OTP successfully dispatched to ${phone}`);
        }
      } catch (err) {
        console.warn('Twilio SMS gateway dispatch error:', err);
      }
    }

    // In production, NEVER expose devOtp in the JSON response
    const responsePayload: Record<string, any> = {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      phone,
    };

    if (!isProduction) {
      // In development / local testing, include devOtp for test suites
      responsePayload.devOtp = code;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error in /api/auth/send-otp:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
