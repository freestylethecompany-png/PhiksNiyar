'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Shield,
  Clock,
  MapPin,
  CheckCircle2,
  Bike,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Sliders,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import DeliveryInteractiveMap from '@/components/tracking/DeliveryInteractiveMap';
import DeliveryStatusStepper from '@/components/tracking/DeliveryStatusStepper';
import DeliveryPartnerSimulator from '@/components/tracking/DeliveryPartnerSimulator';
import { useLiveTracking } from '@/lib/tracking/useLiveTracking';
import { Language, translations } from '@/lib/i18n/translations';

function TrackingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId') || 'CPT-DEL-101';
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [activeViewMode, setActiveViewMode] = useState<'CUSTOMER' | 'PARTNER'>('CUSTOMER');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('fixnear_lang') as Language;
      if (savedLang === 'en' || savedLang === 'te') {
        setCurrentLang(savedLang);
      }
    }
  }, []);

  const isTelugu = currentLang === 'te';

  // Real-time tracking hook with Server-Sent Events & fallback polling
  const {
    order,
    connectionState,
    errorMsg,
    pushPartnerLocation,
    updateStatus,
    refresh,
  } = useLiveTracking({
    orderId,
  });

  if (!order) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '20px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid #e2e8f0',
            borderTopColor: '#0b3b95',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
          {isTelugu ? 'డెలివరీ ట్రాకింగ్ సమాచారం లోడ్ అవుతోంది...' : 'Connecting to Live Delivery Stream...'}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Connecting to real-time GPS telemetry for Order #{orderId}...
        </p>
      </div>
    );
  }

  const arrivalTime = new Date(order.metrics.estimatedArrivalTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid var(--border-light, #e2e8f0)',
          padding: '12px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1380px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Left: Back & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              <span>{isTelugu ? 'మార్కెట్‌ప్లేస్' : 'Back to Market'}</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                <span style={{ color: '#0b3b95' }}>Fix</span>
                <span style={{ color: '#00a651' }}>Near</span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}
              >
                LIVE TRACKING
              </span>
            </div>
          </div>

          {/* Center: Order ID & Real-time Connection Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Order <span style={{ color: '#0b3b95' }}>#{order.orderId}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background:
                  connectionState === 'CONNECTED'
                    ? '#ecfdf5'
                    : connectionState === 'COMPLETED'
                    ? '#f1f5f9'
                    : '#fef3c7',
                border:
                  connectionState === 'CONNECTED'
                    ? '1px solid #a7f3d0'
                    : connectionState === 'COMPLETED'
                    ? '1px solid #cbd5e1'
                    : '1px solid #fde68a',
                color:
                  connectionState === 'CONNECTED'
                    ? '#065f46'
                    : connectionState === 'COMPLETED'
                    ? '#475569'
                    : '#92400e',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background:
                    connectionState === 'CONNECTED'
                      ? '#10b981'
                      : connectionState === 'COMPLETED'
                      ? '#94a3b8'
                      : '#f59e0b',
                }}
              />
              <span>
                {connectionState === 'CONNECTED'
                  ? 'Real-Time SSE Connected'
                  : connectionState === 'COMPLETED'
                  ? 'Delivery Concluded'
                  : 'Reconnecting GPS...'}
              </span>
            </div>
          </div>

          {/* Right: View Mode Toggle & Language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle: Customer vs Partner Simulator */}
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveViewMode('CUSTOMER')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  background: activeViewMode === 'CUSTOMER' ? 'white' : 'transparent',
                  color: activeViewMode === 'CUSTOMER' ? '#0b3b95' : '#64748b',
                  boxShadow: activeViewMode === 'CUSTOMER' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Customer View
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('PARTNER')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  background: activeViewMode === 'PARTNER' ? '#00a651' : 'transparent',
                  color: activeViewMode === 'PARTNER' ? 'white' : '#64748b',
                  boxShadow: activeViewMode === 'PARTNER' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Partner Console 🚴
              </button>
            </div>

            {/* Language Switch */}
            <button
              type="button"
              onClick={() => {
                const next = currentLang === 'en' ? 'te' : 'en';
                setCurrentLang(next);
                localStorage.setItem('fixnear_lang', next);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'white',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              {currentLang === 'en' ? 'తెలుగు' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main style={{ flex: 1, padding: '20px 16px', maxWidth: '1380px', margin: '0 auto', width: '100%' }}>
        {/* Error notification if any */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* LEFT: Interactive Map & Live ETA Banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Live Hero ETA Card */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '18px 22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#64748b',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {isTelugu ? 'అంచనా వేసిన చేరు సమయం' : 'Estimated Time of Arrival'}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0b3b95', lineHeight: 1 }}>
                    {order.status === 'DELIVERED' ? 'Arrived' : `${order.metrics.etaMinutes}`}
                  </span>
                  {order.status !== 'DELIVERED' && (
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b3b95' }}>
                      {isTelugu ? 'నిమిషాలు' : 'mins'}
                    </span>
                  )}
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginLeft: '6px' }}>
                    {order.status === 'DELIVERED' ? '(Doorstep Verified)' : `(by ${arrivalTime})`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {isTelugu ? 'మిగిలిన దూరం' : 'Remaining Distance'}
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {order.metrics.remainingDistanceKm} km
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {isTelugu ? 'ట్రాఫిక్ పరిస్థితి' : 'Road Traffic'}
                  </span>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color:
                        order.trafficLevel === 'LOW'
                          ? '#059669'
                          : order.trafficLevel === 'MODERATE'
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  >
                    ● {order.trafficLevel === 'LOW' ? 'Normal / Clear' : 'Moderate Congestion'}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Map Component Container */}
            <div style={{ height: '560px', width: '100%' }}>
              <DeliveryInteractiveMap
                order={order}
                isPartnerMode={activeViewMode === 'PARTNER'}
              />
            </div>

            {/* Doorstep Verification & Anti-Circumvention Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0b3b95 0%, #1e40af 100%)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: '0 4px 14px rgba(11, 59, 149, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>
                    {isTelugu ? '4-అంకెల డోర్‌స్టెప్ Start-OTP రక్షణ' : '4-Digit Doorstep Start-OTP Security'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                    {isTelugu
                      ? 'రైడర్ మీ చిరునామాకు చేరుకున్నప్పుడు మాత్రమే మీ OTPని చెప్పండి.'
                      : 'Share your 4-digit code only when technician arrives at your door.'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'white',
                  color: '#0b3b95',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '0.2em',
                }}
              >
                6845
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Stepper, Partner Card & Simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Delivery Partner Profile Card */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #00a651',
                    }}
                  >
                    <img
                      src={order.partner.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                      alt={order.partner.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                      {order.partner.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {order.partner.vehicleType} • {order.partner.vehicleNumber}
                    </div>
                    <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700, marginTop: '2px' }}>
                      ★ {order.partner.rating} Verified Delivery Partner
                    </div>
                  </div>
                </div>

                {/* Call & Chat Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`tel:${order.partner.phone}`}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                    title="Call Partner"
                  >
                    <Phone size={17} />
                  </a>
                  <button
                    type="button"
                    onClick={() => alert(`In-app chat connected with ${order.partner.name}`)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#0b3b95',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Message Partner"
                  >
                    <MessageSquare size={17} />
                  </button>
                </div>
              </div>

              {/* Delivery Stop Info */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', marginTop: '4px' }} />
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Pickup Hub: </span>
                    <strong style={{ color: '#0f172a' }}>{order.pickup.name}</strong> ({order.pickup.address})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginTop: '4px' }} />
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Destination: </span>
                    <strong style={{ color: '#0f172a' }}>{order.customer.name}</strong> ({order.customer.address})
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Stage Delivery Status Stepper */}
            <DeliveryStatusStepper
              currentStatus={order.status}
              statusHistory={order.statusHistory}
              isTelugu={isTelugu}
            />

            {/* Delivery Partner Console / GPS Simulator */}
            <DeliveryPartnerSimulator
              order={order}
              onPushLocation={pushPartnerLocation}
              onUpdateStatus={updateStatus}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading FixNear Delivery Tracking...</div>}>
      <TrackingPageContent />
    </Suspense>
  );
}
