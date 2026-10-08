import { EventEmitter } from 'events';
import { DeliveryTrackingOrder } from '../db/types';

// Global Event Emitter for Real-Time Delivery Tracking Updates
// Ensures singleton across hot module reloads in Next.js development
const globalForTracking = globalThis as unknown as {
  deliveryTrackingBus?: EventEmitter;
};

export const trackingBus: EventEmitter =
  globalForTracking.deliveryTrackingBus || new EventEmitter();

// Allow up to 200 concurrent live tracking connections
trackingBus.setMaxListeners(200);

if (process.env.NODE_ENV !== 'production') {
  globalForTracking.deliveryTrackingBus = trackingBus;
}

export type TrackingEventType = 'LOCATION_UPDATE' | 'STATUS_UPDATE' | 'ROUTE_RECALCULATED' | 'DELIVERY_COMPLETED';

export interface TrackingBroadcastPayload {
  type: TrackingEventType;
  orderId: string;
  order: DeliveryTrackingOrder;
  timestamp: string;
}

export function broadcastTrackingEvent(type: TrackingEventType, order: DeliveryTrackingOrder) {
  const payload: TrackingBroadcastPayload = {
    type,
    orderId: order.orderId,
    order,
    timestamp: new Date().toISOString(),
  };

  trackingBus.emit(`tracking:${order.orderId}`, payload);
  trackingBus.emit(`tracking:${order.id}`, payload);
  trackingBus.emit('tracking:all', payload);
}
