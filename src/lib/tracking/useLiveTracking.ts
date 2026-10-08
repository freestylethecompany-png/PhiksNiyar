'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DeliveryTrackingOrder, DeliveryStatus, GeoPoint } from '../db/types';

export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'COMPLETED' | 'ERROR';

export interface UseLiveTrackingOptions {
  orderId: string;
  onLocationUpdate?: (order: DeliveryTrackingOrder) => void;
  onStatusUpdate?: (status: DeliveryStatus, order: DeliveryTrackingOrder) => void;
  onRouteRecalculated?: (order: DeliveryTrackingOrder) => void;
  onDeliveryCompleted?: () => void;
}

export function useLiveTracking({
  orderId,
  onLocationUpdate,
  onStatusUpdate,
  onRouteRecalculated,
  onDeliveryCompleted,
}: UseLiveTrackingOptions) {
  const [order, setOrder] = useState<DeliveryTrackingOrder | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('CONNECTING');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial snapshot or perform fallback poll
  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracking/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          if (data.order.status === 'DELIVERED') {
            setConnectionState('COMPLETED');
          }
          return data.order;
        }
      }
    } catch (e) {
      console.warn('Tracking snapshot fetch failed:', e);
    }
    return null;
  }, [orderId]);

  // Connect to SSE stream
  const connectStream = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionState((prev) => (prev === 'CONNECTING' ? 'CONNECTING' : 'RECONNECTING'));
    setErrorMsg(null);

    const sse = new EventSource(`/api/tracking/${orderId}/stream`);
    eventSourceRef.current = sse;

    sse.addEventListener('snapshot', (e: MessageEvent) => {
      try {
        const data: DeliveryTrackingOrder = JSON.parse(e.data);
        setOrder(data);
        setConnectionState(data.status === 'DELIVERED' ? 'COMPLETED' : 'CONNECTED');
      } catch (err) {
        console.error('Failed to parse SSE snapshot:', err);
      }
    });

    sse.addEventListener('update', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const updatedOrder: DeliveryTrackingOrder = payload.order;
        setOrder(updatedOrder);
        setConnectionState(updatedOrder.status === 'DELIVERED' ? 'COMPLETED' : 'CONNECTED');

        if (payload.type === 'LOCATION_UPDATE' && onLocationUpdate) {
          onLocationUpdate(updatedOrder);
        } else if (payload.type === 'STATUS_UPDATE' && onStatusUpdate) {
          onStatusUpdate(updatedOrder.status, updatedOrder);
        } else if (payload.type === 'ROUTE_RECALCULATED' && onRouteRecalculated) {
          onRouteRecalculated(updatedOrder);
        }
      } catch (err) {
        console.error('Failed to parse SSE update:', err);
      }
    });

    sse.addEventListener('completed', () => {
      setConnectionState('COMPLETED');
      if (onDeliveryCompleted) onDeliveryCompleted();
      sse.close();
    });

    sse.onerror = () => {
      setConnectionState('RECONNECTING');
      sse.close();

      // Retry SSE connection after 3.5s
      reconnectTimeoutRef.current = setTimeout(() => {
        connectStream();
      }, 3500);
    };
  }, [orderId, onLocationUpdate, onStatusUpdate, onRouteRecalculated, onDeliveryCompleted]);

  useEffect(() => {
    fetchSnapshot();
    connectStream();

    // Fallback polling every 4 seconds in case browser SSE drops
    fallbackPollIntervalRef.current = setInterval(() => {
      if (connectionState !== 'COMPLETED') {
        fetchSnapshot();
      }
    }, 4000);

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (fallbackPollIntervalRef.current) clearInterval(fallbackPollIntervalRef.current);
    };
  }, [orderId, connectStream, fetchSnapshot, connectionState]);

  // Push partner GPS update to backend
  const pushPartnerLocation = useCallback(
    async (coords: { latitude: number; longitude: number; heading?: number; speedKmh?: number }) => {
      try {
        const res = await fetch(`/api/tracking/${orderId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coords),
        });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          return data;
        } else {
          throw new Error(data.error || 'Failed to update location');
        }
      } catch (err: any) {
        console.error('pushPartnerLocation error:', err);
        setErrorMsg(err.message || 'GPS transmission failed');
        throw err;
      }
    },
    [orderId]
  );

  // Update order status (Picked up -> On the way -> Delivered)
  const updateStatus = useCallback(
    async (newStatus: DeliveryStatus, note?: string) => {
      try {
        const res = await fetch(`/api/tracking/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, note }),
        });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          if (newStatus === 'DELIVERED') {
            setConnectionState('COMPLETED');
          }
          return data.order;
        } else {
          throw new Error(data.error || 'Failed to update status');
        }
      } catch (err: any) {
        console.error('updateStatus error:', err);
        setErrorMsg(err.message || 'Status update failed');
        throw err;
      }
    },
    [orderId]
  );

  return {
    order,
    connectionState,
    errorMsg,
    pushPartnerLocation,
    updateStatus,
    refresh: fetchSnapshot,
  };
}
