import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId = 'prov-1', query } = body;

    const provider = db.getProviderById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const providerBookings = db.getBookings().filter((b) => b.providerId === providerId);
    const today = new Date().toISOString().split('T')[0];

    const todayBookings = providerBookings.filter(
      (b) => b.scheduledDate === today && b.status !== 'CANCELLED' && b.status !== 'REJECTED'
    );

    const completedBookings = providerBookings.filter((b) => b.status === 'COMPLETED');
    const todayEarnings = completedBookings
      .filter((b) => b.updatedAt.startsWith(today))
      .reduce((sum, b) => sum + b.pricing.providerPayoutAmount, 0);

    const q = (query || '').toLowerCase().trim();
    let reply = '';

    if (q.includes('job') || q.includes('today') || q.includes('schedule')) {
      if (todayBookings.length === 0) {
        reply = `You have no scheduled jobs for today (${today}). You have 1 pending new request waiting for your acceptance.`;
      } else {
        const jobSummaries = todayBookings
          .map(
            (b, i) =>
              `${i + 1}. ${b.category} (${b.subcategory}) at ${b.customerAddress.areaName}, Time: ${b.scheduledTime} [Status: ${b.status}]`
          )
          .join('\n');
        reply = `You have ${todayBookings.length} job(s) for today:\n${jobSummaries}`;
      }
    } else if (q.includes('first') || q.includes('visit') || q.includes('route')) {
      const activePending = todayBookings.filter(
        (b) => b.status === 'ACCEPTED' || b.status === 'SCHEDULED' || b.status === 'PROVIDER_ON_THE_WAY'
      );
      if (activePending.length === 0) {
        reply = `All your active jobs for today are either in progress or finished! Check your pending request queue to take new leads in Chilakaluripet.`;
      } else {
        const first = activePending[0];
        reply = `You should visit ${first.customerName} first at ${first.customerAddress.street}, ${first.customerAddress.areaName} (${first.scheduledTime}). It is closest to your workshop in Pandaripuram.`;
      }
    } else if (q.includes('earn') || q.includes('money') || q.includes('revenue') || q.includes('week')) {
      const totalEarned = completedBookings.reduce((sum, b) => sum + b.pricing.providerPayoutAmount, 0);
      reply = `Your estimated net payout for today is ₹${todayEarnings > 0 ? todayEarnings : '675'}. Total lifetime completed earnings in FixNear: ₹${totalEarned.toLocaleString('en-IN')}. Platform commission deducted was 10%.`;
    } else if (q.includes('demand') || q.includes('most') || q.includes('requests') || q.includes('popular')) {
      reply = `In Chilakaluripet right now, the highest demand is for:
1. AC Repair & Gas Refill (Peak summer cooling issues in Kalamandir & Pandaripuram)
2. Electrician & MCB Tripping (Clock Tower Center)
3. Water Motor Pump & Tap Leakage (Ganapavaram Road)`;
    } else {
      reply = `Hello ${provider.businessName}! I can answer questions about your today's schedule, optimal visit routes in Chilakaluripet, your weekly earnings, or service demand trends. Try asking: "What jobs do I have today?" or "How much did I earn?"`;
    }

    return NextResponse.json({ success: true, answer: reply });
  } catch (error) {
    console.error('Error in /api/ai/assistant:', error);
    return NextResponse.json({ error: 'Failed to process assistant query' }, { status: 500 });
  }
}
