import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';

export async function GET() {
  const startTime = Date.now();

  try {
    const health = db.checkHealth();
    const latencyMs = Date.now() - startTime;

    if (!health.healthy) {
      return NextResponse.json(
        {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          database: 'error',
          latencyMs,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        product: 'PhiksNiyar (ఫిక్స్ నియర్)',
        market: 'Chilakaluripet, AP, India',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          connected: true,
          topology: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite-WAL',
        },
        uptimeSeconds: Math.floor(process.uptime()),
        latencyMs,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database liveness check failed',
      },
      { status: 500 }
    );
  }
}
