'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle,
  Radio,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { DeliveryTrackingOrder, DeliveryStatus, GeoPoint } from '@/lib/db/types';
import { calculateBearing } from '@/lib/tracking/routingService';

interface DeliveryPartnerSimulatorProps {
  order: DeliveryTrackingOrder;
  onPushLocation: (coords: { latitude: number; longitude: number; heading?: number; speedKmh?: number }) => Promise<any>;
  onUpdateStatus: (status: DeliveryStatus, note?: string) => Promise<any>;
}

export default function DeliveryPartnerSimulator({
  order,
  onPushLocation,
  onUpdateStatus,
}: DeliveryPartnerSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isWatchingGps, setIsWatchingGps] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const addLog = (msg: string) => {
    setLogMessages((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 4),
    ]);
  };

  // Find closest waypoint index to partner's current position
  useEffect(() => {
    if (!order.routeGeometry || order.routeGeometry.length === 0) return;
    const currentLoc = order.partner.currentLocation;

    let closestIdx = 0;
    let minD = Infinity;
    order.routeGeometry.forEach((pt, idx) => {
      const d = Math.hypot(pt.latitude - currentLoc.latitude, pt.longitude - currentLoc.longitude);
      if (d < minD) {
        minD = d;
        closestIdx = idx;
      }
    });

    setSimStepIndex(closestIdx);
  }, [order.routeGeometry]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 1. Step-by-Step Road Simulation Loop
  const handleStartSimulation = () => {
    if (isSimulating) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsSimulating(false);
      addLog('Simulation stopped.');
      return;
    }

    if (order.status === 'DELIVERED') {
      addLog('Resetting status to ON_THE_WAY for simulation restart...');
      onUpdateStatus('ON_THE_WAY', 'Resumed live tracking simulation');
    }

    setIsSimulating(true);
    addLog(`Simulation started along ${order.routeGeometry.length} road waypoints at ~32 km/h...`);

    let currentIdx = simStepIndex;
    if (currentIdx >= order.routeGeometry.length - 1) {
      currentIdx = 0;
      setSimStepIndex(0);
    }

    // Interval moves the rider along road coordinates every 1.5 seconds
    timerRef.current = setInterval(async () => {
      if (currentIdx >= order.routeGeometry.length - 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSimulating(false);
        addLog('Rider reached customer destination! Marking as DELIVERED...');
        await onUpdateStatus('DELIVERED', 'Arrived at customer doorstep in Kalamandir Center');
        return;
      }

      currentIdx += 1;
      setSimStepIndex(currentIdx);

      const prevPt = order.routeGeometry[currentIdx - 1];
      const nextPt = order.routeGeometry[currentIdx];
      const heading = calculateBearing(prevPt, nextPt);
      const speed = Math.round(28 + Math.random() * 8); // 28-36 km/h realistic city driving

      try {
        const res = await onPushLocation({
          latitude: nextPt.latitude,
          longitude: nextPt.longitude,
          heading,
          speedKmh: speed,
        });

        if (res && res.routeRecalculated) {
          addLog('✨ New route recalculated after dynamic deviation!');
        } else {
          addLog(`Dispatched GPS: ${nextPt.latitude.toFixed(5)}, ${nextPt.longitude.toFixed(5)} (${speed} km/h, ${Math.round(heading)}°)`);
        }
      } catch (err: any) {
        addLog(`Error pushing GPS: ${err.message}`);
      }
    }, 1500);
  };

  // 2. Off-Route Detour Simulation: Jumps rider 80m off the polyline to test automatic recalculation!
  const handleSimulateOffRouteDetour = async () => {
    if (order.status === 'DELIVERED') {
      addLog('Resetting order status to ON_THE_WAY for live detour test...');
      await onUpdateStatus('ON_THE_WAY', 'Resumed live tracking simulation');
    }

    const cur = order.partner.currentLocation;
    // Offset by ~90 meters off the road
    const detourPoint: GeoPoint = {
      latitude: cur.latitude + 0.00095,
      longitude: cur.longitude + 0.00085,
    };

    addLog('⚡ Injecting off-route detour (>75m deviation) to test automatic re-routing...');
    try {
      const res = await onPushLocation({
        latitude: detourPoint.latitude,
        longitude: detourPoint.longitude,
        heading: 45,
        speedKmh: 30,
      });

      if (res && res.routeRecalculated) {
        addLog('✅ SUCCESS: Backend detected off-route deviation and recalculated road route!');
      } else {
        addLog('Deviation sent. Check server response.');
      }
    } catch (err: any) {
      addLog(`Detour injection error: ${err.message}`);
    }
  };

  // 3. Real Device GPS Broadcast
  const handleToggleWatchGps = () => {
    if (isWatchingGps) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatchingGps(false);
      addLog('Physical GPS broadcasting stopped.');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsWatchingGps(true);
    addLog('Requesting real browser GPS watchPosition...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        const speedKmh = speed ? Math.round(speed * 3.6) : 25;
        const headDeg = heading || 0;

        addLog(`Broadcast real GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        try {
          await onPushLocation({
            latitude,
            longitude,
            heading: headDeg,
            speedKmh,
          });
        } catch (e: any) {
          addLog(`Broadcast error: ${e.message}`);
        }
      },
      (err) => {
        addLog(`GPS watch error: ${err.message}`);
        setIsWatchingGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
  };

  // 4. Milestone Step Update
  const handleStatusChange = async (newStatus: DeliveryStatus) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(newStatus);
      addLog(`Status changed to ${newStatus}`);
    } catch (e: any) {
      addLog(`Failed to change status: ${e.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div
      style={{
        background: '#0f172a',
        color: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#00a651',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Navigation size={15} color="white" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>
              Delivery Partner Console & GPS Simulator
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Rider: {order.partner.name} ({order.partner.vehicleType})
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            background: isSimulating ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.15)',
            color: isSimulating ? '#4ade80' : '#94a3b8',
            padding: '3px 8px',
            borderRadius: '12px',
            fontWeight: 700,
            border: '1px solid currentColor',
          }}
        >
          {isSimulating ? '● DRIVING ACTIVE' : 'IDLE'}
        </span>
      </div>

      {/* Simulator Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        {/* Play / Stop Simulation */}
        <button
          type="button"
          onClick={handleStartSimulation}
          disabled={order.status === 'DELIVERED'}
          style={{
            padding: '10px 8px',
            borderRadius: '10px',
            background: isSimulating ? '#ef4444' : '#00a651',
            color: 'white',
            border: 'none',
            fontWeight: 700,
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            cursor: order.status === 'DELIVERED' ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {isSimulating ? <Square size={16} /> : <Play size={16} />}
          <span>{isSimulating ? 'Stop Driving' : 'Drive on Road'}</span>
        </button>

        {/* Trigger Off-Route Detour */}
        <button
          type="button"
          onClick={handleSimulateOffRouteDetour}
          disabled={order.status === 'DELIVERED'}
          style={{
            padding: '10px 8px',
            borderRadius: '10px',
            background: '#d97706',
            color: 'white',
            border: 'none',
            fontWeight: 700,
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            cursor: order.status === 'DELIVERED' ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
          title="Take an off-route detour to test dynamic route recalculation"
        >
          <Zap size={16} />
          <span>Test Detour</span>
        </button>

        {/* Broadcast Physical GPS */}
        <button
          type="button"
          onClick={handleToggleWatchGps}
          disabled={order.status === 'DELIVERED'}
          style={{
            padding: '10px 8px',
            borderRadius: '10px',
            background: isWatchingGps ? '#3b82f6' : '#334155',
            color: 'white',
            border: 'none',
            fontWeight: 700,
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            cursor: order.status === 'DELIVERED' ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
          title="Broadcast device GPS"
        >
          <Radio size={16} className={isWatchingGps ? 'animate-pulse' : ''} />
          <span>{isWatchingGps ? 'Broadcasting...' : 'Device GPS'}</span>
        </button>
      </div>

      {/* Manual Status Milestone Buttons */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
          Manual Delivery Milestones:
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={isUpdatingStatus || order.status === 'PICKED_UP'}
            onClick={() => handleStatusChange('PICKED_UP')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              background: order.status === 'PICKED_UP' ? '#059669' : '#1e293b',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Mark Picked Up
          </button>

          <button
            type="button"
            disabled={isUpdatingStatus || order.status === 'ON_THE_WAY'}
            onClick={() => handleStatusChange('ON_THE_WAY')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              background: order.status === 'ON_THE_WAY' ? '#0b3b95' : '#1e293b',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Mark On the Way
          </button>

          <button
            type="button"
            disabled={isUpdatingStatus || order.status === 'DELIVERED'}
            onClick={() => handleStatusChange('DELIVERED')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              background: order.status === 'DELIVERED' ? '#16a34a' : '#1e293b',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Mark Delivered
          </button>
        </div>
      </div>

      {/* Console Telemetry Output */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#38bdf8',
          maxHeight: '100px',
          overflowY: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {logMessages.length === 0 ? (
          <div style={{ color: '#64748b' }}>Ready. Click "Drive on Road" or "Test Detour".</div>
        ) : (
          logMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
