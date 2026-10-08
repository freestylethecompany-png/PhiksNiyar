import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimiter';
import { generateSecurePhoneOtp } from '@/lib/security/cryptoUtils';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP-level rate limiting (max 15 requests per 15 mins per IP)
    const ipCheck = checkRateLimit(`otp-send-ip:${clientIp}`, 15, 15 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests from this network. Please wait ${ipCheck.retryAfterSeconds} seconds before retrying.`,
        },
        { status: 429 }
      );
    }

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

    // 2. Phone-level rate limiting (max 3 OTP requests per 10 minutes per phone)
    const phoneCheck = checkRateLimit(`otp-send-phone:${phone}`, 3, 10 * 60 * 1000, 15 * 60 * 1000);
    if (!phoneCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests for this number. Please wait ${phoneCheck.retryAfterSeconds} seconds before requesting another code.`,
        },
        { status: 429 }
      );
    }

    // Generate cryptographically sound 6-digit OTP
    const code = generateSecurePhoneOtp();

    // Persist OTP in database with 10-minute expiry
    db.saveOtp(phone, code, 10);

    const isProduction = process.env.NODE_ENV === 'production';
    let smsSent = false;

    // 1. Production SMS Gateway: Fast2SMS
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    if (fast2SmsKey) {
      try {
        const smsRes = await fetch(
          `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2SmsKey}&route=otp&variables_values=${code}&flash=0&numbers=${digitsOnly}`
        );
        if (smsRes.ok) {
          smsSent = true;
        }
      } catch (err) {
        console.warn('Fast2SMS gateway error:', err);
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
        params.append('Body', `Your FixNear verification code is ${code}. Valid for 10 minutes.`);

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
        }
      } catch (err) {
        console.warn('Twilio SMS gateway error:', err);
      }
    }

    const responsePayload: Record<string, any> = {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      phone,
    };

    // In development mode only (when explicitly not production and SMS gateways not set)
    if (!isProduction && !fast2SmsKey && !twilioSid) {
      responsePayload.devOtp = code;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error in /api/auth/send-otp:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
