import { NextResponse } from 'next/server';
import { fetchRoadRoute } from '@/lib/tracking/routingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const originLat = parseFloat(searchParams.get('originLat') || '');
    const originLng = parseFloat(searchParams.get('originLng') || '');
    const destLat = parseFloat(searchParams.get('destLat') || '');
    const destLng = parseFloat(searchParams.get('destLng') || '');

    if (
      isNaN(originLat) ||
      isNaN(originLng) ||
      isNaN(destLat) ||
      isNaN(destLng)
    ) {
      return NextResponse.json(
        { error: 'Valid originLat, originLng, destLat, and destLng are required.' },
        { status: 400 }
      );
    }

    const route = await fetchRoadRoute(
      { latitude: originLat, longitude: originLng },
      { latitude: destLat, longitude: destLng }
    );

    return NextResponse.json({
      success: true,
      route,
    });
  } catch (error) {
    console.error('Error in /api/tracking/route:', error);
    return NextResponse.json({ error: 'Failed to compute road route' }, { status: 500 });
  }
}
