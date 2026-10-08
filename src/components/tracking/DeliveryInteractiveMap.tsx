'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  LocateFixed,
  Eye,
  TrafficCone,
  Maximize2,
  Compass,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { DeliveryTrackingOrder, GeoPoint } from '@/lib/db/types';
import { LeafletMapProvider } from '@/lib/tracking/leafletProvider';
import { IMapProvider } from '@/lib/tracking/modularMap';

interface DeliveryInteractiveMapProps {
  order: DeliveryTrackingOrder;
  isPartnerMode?: boolean;
  onUserRecenter?: () => void;
}

export default function DeliveryInteractiveMap({
  order,
  isPartnerMode = false,
  onUserRecenter,
}: DeliveryInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapProviderRef = useRef<IMapProvider | null>(null);

  const [mapInitialized, setMapInitialized] = useState(false);
  const [followRider, setFollowRider] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [isOffCenter, setIsOffCenter] = useState(false);

  // Initialize Map Provider
  useEffect(() => {
    if (!mapContainerRef.current || mapProviderRef.current) return;

    const provider = new LeafletMapProvider();
    mapProviderRef.current = provider;

    const initialCenter = order.partner.currentLocation || order.customer.location;

    provider
      .initialize(mapContainerRef.current, initialCenter, 16)
      .then(() => {
        setMapInitialized(true);

        // Set markers
        provider.setCustomerMarker(
          order.customer.location,
          order.customer.name,
          order.customer.address
        );

        provider.setPickupMarker(
          order.pickup.location,
          order.pickup.name,
          order.pickup.address
        );

        // Draw initial route
        if (order.routeGeometry && order.routeGeometry.length > 0) {
          provider.drawRoute(order.routeGeometry, { showTraffic: false });
        }

        // Draw initial partner location
        const partnerLoc = order.partner.currentLocation;
        provider.updatePartnerMarker(
          partnerLoc,
          partnerLoc.heading,
          partnerLoc.speedKmh,
          order.partner.vehicleType,
          false
        );

        // Fit bounds to show route and both parties
        provider.fitBounds([order.partner.currentLocation, order.customer.location], 50);

        // Listen for user manual pan
        provider.onUserPan(() => {
          setFollowRider(false);
          setIsOffCenter(true);
        });
      })
      .catch((err) => {
        console.error('Failed to initialize map provider:', err);
      });

    return () => {
      if (mapProviderRef.current) {
        mapProviderRef.current.destroy();
        mapProviderRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline when geometry changes (e.g. recalculated off-route)
  useEffect(() => {
    if (!mapProviderRef.current || !mapInitialized) return;
    if (order.routeGeometry && order.routeGeometry.length > 1) {
      mapProviderRef.current.drawRoute(order.routeGeometry, { showTraffic });
    }
  }, [order.routeGeometry, mapInitialized, showTraffic]);

  // Update Partner Marker and Camera when partner coordinates update
  useEffect(() => {
    if (!mapProviderRef.current || !mapInitialized) return;

    const loc = order.partner.currentLocation;
    mapProviderRef.current.updatePartnerMarker(
      loc,
      loc.heading,
      loc.speedKmh,
      order.partner.vehicleType,
      true
    );

    // If auto-follow is active, gently pan camera to track rider
    if (followRider) {
      mapProviderRef.current.panTo(loc);
    }
  }, [order.partner.currentLocation, followRider, mapInitialized, order.partner.vehicleType]);

  // Toggle Traffic Layer
  const handleToggleTraffic = () => {
    const nextVal = !showTraffic;
    setShowTraffic(nextVal);
    if (mapProviderRef.current) {
      mapProviderRef.current.setTrafficVisible(nextVal);
    }
  };

  // Re-center on Delivery Partner
  const handleRecenterOnPartner = useCallback(() => {
    setFollowRider(true);
    setIsOffCenter(false);
    if (mapProviderRef.current) {
      mapProviderRef.current.panTo(order.partner.currentLocation);
      mapProviderRef.current.setCenter(order.partner.currentLocation, 16);
    }
    if (onUserRecenter) onUserRecenter();
  }, [order.partner.currentLocation, onUserRecenter]);

  // Fit all active points (Customer + Rider + Hub)
  const handleFitAll = () => {
    if (mapProviderRef.current) {
      setFollowRider(false);
      setIsOffCenter(true);
      mapProviderRef.current.fitBounds(
        [order.partner.currentLocation, order.customer.location, order.pickup.location],
        60
      );
    }
  };

  const partnerLoc = order.partner.currentLocation;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '440px',
        borderRadius: 'var(--radius-lg, 16px)',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        border: '1px solid var(--border-light, #e2e8f0)',
        background: '#f8fafc',
      }}
    >
      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      />

      {/* Floating HUD: Live Speedometer & Rider Heading */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '8px 14px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: order.trackingActive ? '#22c55e' : '#94a3b8',
              animation: order.trackingActive ? 'pulse-radar 1.5s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>
            {order.trackingActive ? 'LIVE GPS' : 'TRACKING PAUSED'}
          </span>
        </div>

        <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />

        <div>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
            Speed
          </span>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
            {Math.round(partnerLoc.speedKmh)} <span style={{ fontSize: '10px' }}>km/h</span>
          </div>
        </div>

        <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />

        <div>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
            Heading
          </span>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Compass size={13} style={{ transform: `rotate(${partnerLoc.heading}deg)` }} />
            <span>{Math.round(partnerLoc.heading)}°</span>
          </div>
        </div>
      </div>

      {/* Floating Action Controls on Right */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Follow Rider Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !followRider;
            setFollowRider(next);
            if (next) handleRecenterOnPartner();
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: followRider ? '#00a651' : 'white',
            color: followRider ? 'white' : '#1e293b',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title={followRider ? 'Following Rider' : 'Enable Follow Rider'}
        >
          <LocateFixed size={14} />
          <span>{followRider ? 'Following' : 'Free Explore'}</span>
        </button>

        {/* Traffic Toggle */}
        <button
          type="button"
          onClick={handleToggleTraffic}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: showTraffic ? '#d97706' : 'white',
            color: showTraffic ? 'white' : '#1e293b',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Toggle traffic congestion view"
        >
          <TrafficCone size={14} />
          <span>Traffic {showTraffic ? 'ON' : 'OFF'}</span>
        </button>

        {/* Fit All Bounds */}
        <button
          type="button"
          onClick={handleFitAll}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'white',
            color: '#1e293b',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
          title="Fit route and all stops on screen"
        >
          <Maximize2 size={14} />
          <span>Fit Route</span>
        </button>
      </div>

      {/* Floating "Re-center on Rider" Pill (appears when user pans away) */}
      {isOffCenter && !followRider && (
        <button
          type="button"
          onClick={handleRecenterOnPartner}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: '#0b3b95',
            color: 'white',
            padding: '10px 18px',
            borderRadius: '30px',
            border: 'none',
            boxShadow: '0 4px 20px rgba(11, 59, 149, 0.4)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            animation: 'bounce-subtle 2s infinite',
          }}
        >
          <RotateCcw size={15} />
          <span>Re-center on {order.partner.name.split(' ')[0]}</span>
        </button>
      )}

      {/* Map Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(6px)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }} />
          <span>Pickup</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0b3b95' }} />
          <span>Delivery Partner</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
          <span>Customer</span>
        </div>
      </div>
    </div>
  );
}
