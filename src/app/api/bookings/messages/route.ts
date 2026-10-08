import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const messages = db.getMessagesForBooking(bookingId);
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error in GET /api/bookings/messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, senderId, senderRole, text } = body;

    if (!bookingId || !text || !text.trim()) {
      return NextResponse.json({ error: 'Missing required message parameters' }, { status: 400 });
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      bookingId,
      senderId: senderId || 'usr-cust-1',
      senderRole: senderRole || 'CUSTOMER',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    db.addMessage(newMsg);

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error) {
    console.error('Error in POST /api/bookings/messages:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
