import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    // 1. Resolve Provider Profile strictly based on verified session
    let provider = null;
    if (session.role === 'PROVIDER') {
      provider = db.getProviderByUserId(session.userId);
    } else if (session.role === 'ADMIN' && body.providerId) {
      provider = db.getProviderById(body.providerId);
    }

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider account not found or unauthorized.' },
        { status: 403 }
      );
    }

    const providerBookings = db.getBookings().filter((b) => b.providerId === provider.id);
    const today = new Date().toISOString().split('T')[0];

    const todayBookings = providerBookings.filter(
      (b) => b.scheduledDate === today && b.status !== 'CANCELLED' && b.status !== 'REJECTED'
    );

    const completedBookings = providerBookings.filter((b) => b.status === 'COMPLETED');
    const todayEarnings = completedBookings
      .filter((b) => b.updatedAt.startsWith(today))
      .reduce((sum, b) => sum + b.pricing.providerPayoutAmount, 0);

    // Sanitize query to prevent prompt injection or buffer attacks
    const q = (query || '').toLowerCase().trim().slice(0, 200);
    let reply = '';

    if (q.includes('job') || q.includes('today') || q.includes('schedule')) {
      if (todayBookings.length === 0) {
        reply = `You have no active scheduled jobs for today (${today}). Check your pending requests to accept new leads in Chilakaluripet.`;
      } else {
        const jobSummaries = todayBookings
          .map(
            (b, i) =>
              `${i + 1}. ${b.category} (${b.subcategory}) in ${b.customerAddress?.areaName || 'Chilakaluripet'}, Time: ${b.scheduledTime} [Status: ${b.status}]`
          )
          .join('\n');
        reply = `You have ${todayBookings.length} job(s) for today:\n${jobSummaries}`;
      }
    } else if (q.includes('first') || q.includes('visit') || q.includes('route')) {
      const activePending = todayBookings.filter(
        (b) => b.status === 'ACCEPTED' || b.status === 'SCHEDULED' || b.status === 'PROVIDER_ON_THE_WAY'
      );
      if (activePending.length === 0) {
        reply = `All your active jobs for today are either in progress or finished!`;
      } else {
        const first = activePending[0];
        // Privacy: reveal area name only, never raw street before doorstep arrival
        reply = `Your next visit is in ${first.customerAddress?.areaName || 'Chilakaluripet'} scheduled for ${first.scheduledTime}. Open the Active Jobs tab for GPS directions.`;
      }
    } else if (q.includes('earn') || q.includes('money') || q.includes('revenue') || q.includes('week')) {
      const totalEarned = completedBookings.reduce((sum, b) => sum + b.pricing.providerPayoutAmount, 0);
      reply = `Your net completed earnings today: ₹${todayEarnings}. Lifetime completed payout in FixNear: ₹${totalEarned.toLocaleString('en-IN')}. Platform commission deducted was 10%.`;
    } else if (q.includes('demand') || q.includes('most') || q.includes('requests') || q.includes('popular')) {
      reply = `Highest customer demand in Chilakaluripet:\n1. AC Repair & Gas Refill (Kalamandir & Pandaripuram)\n2. Electrician & MCB Tripping (Clock Tower Center)\n3. Water Motor Pump & Tap Leakage (Ganapavaram Road)`;
    } else {
      reply = `Hello ${provider.businessName}! I can help you with your daily schedule, estimated earnings, or local service demand trends in Chilakaluripet. Ask: "What jobs do I have today?" or "How much did I earn?"`;
    }

    return NextResponse.json({ success: true, answer: reply });
  } catch (error) {
    console.error('Error in /api/ai/assistant:', error);
    return NextResponse.json({ error: 'Failed to process assistant query' }, { status: 500 });
  }
}
