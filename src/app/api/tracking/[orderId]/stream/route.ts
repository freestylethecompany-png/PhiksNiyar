import { db } from '@/lib/db/database';
import { trackingBus, TrackingBroadcastPayload } from '@/lib/tracking/eventBus';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  let initialOrder = db.getDeliveryTracking(orderId);
  if (!initialOrder) {
    db.seedDeliveriesIfEmpty();
    initialOrder = db.getDeliveryTracking(orderId);
  }

  if (!initialOrder) {
    return new Response(JSON.stringify({ error: 'Order not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial snapshot
      const snapshotMessage = `event: snapshot\ndata: ${JSON.stringify(initialOrder)}\n\n`;
      controller.enqueue(encoder.encode(snapshotMessage));

      // 2. Setup event listener for this specific order
      const handleUpdate = (payload: TrackingBroadcastPayload) => {
        try {
          const message = `event: update\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(message));

          // If delivery completed, close the stream cleanly
          if (payload.order.status === 'DELIVERED') {
            const closeMessage = `event: completed\ndata: ${JSON.stringify({ message: 'Delivery completed' })}\n\n`;
            controller.enqueue(encoder.encode(closeMessage));
            cleanup();
            controller.close();
          }
        } catch (e) {
          cleanup();
        }
      };

      // 3. Setup 15-second heartbeat to keep connection alive through NATs / firewalls
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          cleanup();
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(heartbeatInterval);
        trackingBus.off(`tracking:${orderId}`, handleUpdate);
        trackingBus.off(`tracking:${initialOrder?.id}`, handleUpdate);
      };

      trackingBus.on(`tracking:${orderId}`, handleUpdate);
      if (initialOrder.id !== orderId) {
        trackingBus.on(`tracking:${initialOrder.id}`, handleUpdate);
      }

      // 4. Handle client abort / disconnect
      request.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering (Nginx, Caddy, Vercel)
    },
  });
}
