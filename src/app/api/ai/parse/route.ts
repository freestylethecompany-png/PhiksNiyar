import { NextResponse } from 'next/server';
import { understandServiceRequest } from '@/lib/ai/nlpEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide a service description' },
        { status: 400 }
      );
    }

    const understood = await understandServiceRequest(text);
    return NextResponse.json({ success: true, data: understood });
  } catch (error) {
    console.error('Error in /api/ai/parse:', error);
    return NextResponse.json(
      { error: 'Failed to parse service request' },
      { status: 500 }
    );
  }
}
