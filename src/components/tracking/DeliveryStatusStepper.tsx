'use client';

import React from 'react';
import { Check, Clock, PackageCheck, Bike, Home, CheckCircle2 } from 'lucide-react';
import { DeliveryStatus, DeliveryTrackingOrder } from '@/lib/db/types';

interface DeliveryStatusStepperProps {
  currentStatus: DeliveryStatus;
  statusHistory?: DeliveryTrackingOrder['statusHistory'];
  isTelugu?: boolean;
}

const MILESTONES: {
  status: DeliveryStatus;
  labelEn: string;
  labelTe: string;
  icon: any;
  descEn: string;
  descTe: string;
}[] = [
  {
    status: 'ORDER_CONFIRMED',
    labelEn: 'Order Confirmed',
    labelTe: 'ఆర్డర్ ఖరారైంది',
    icon: CheckCircle2,
    descEn: 'Service parts verified and order assigned',
    descTe: 'విడిభాగాలు మరియు ఆర్డర్ కేటాయించబడ్డాయి',
  },
  {
    status: 'PREPARING',
    labelEn: 'Preparing',
    labelTe: 'సిద్ధం చేస్తున్నారు',
    icon: Clock,
    descEn: 'Packing toolkit and spares at hub',
    descTe: 'హబ్‌లో పరికరాలు సిద్ధం చేస్తున్నారు',
  },
  {
    status: 'PICKED_UP',
    labelEn: 'Picked Up',
    labelTe: 'ప్యాకేజీ తీసుకున్నారు',
    icon: PackageCheck,
    descEn: 'Rider collected package from hub',
    descTe: 'రైడర్ హబ్ నుండి ప్యాకేజీ తీసుకున్నారు',
  },
  {
    status: 'ON_THE_WAY',
    labelEn: 'On the Way',
    labelTe: 'రవాణాలో ఉన్నారు',
    icon: Bike,
    descEn: 'Rider is driving to your doorstep',
    descTe: 'రైడర్ మీ చిరునామాకు వస్తున్నారు',
  },
  {
    status: 'DELIVERED',
    labelEn: 'Delivered',
    labelTe: 'చేరుకుంది',
    icon: Home,
    descEn: 'Doorstep handoff verified with Start-OTP',
    descTe: 'డోర్‌స్టెప్ వద్ద ధృవీకరించబడింది',
  },
];

export default function DeliveryStatusStepper({
  currentStatus,
  statusHistory = [],
  isTelugu = false,
}: DeliveryStatusStepperProps) {
  const getStatusIndex = (status: DeliveryStatus) => {
    switch (status) {
      case 'ORDER_CONFIRMED':
        return 0;
      case 'PREPARING':
        return 1;
      case 'PICKED_UP':
        return 2;
      case 'ON_THE_WAY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  const getTimestampForStatus = (status: DeliveryStatus) => {
    const item = statusHistory.find((h) => h.status === status);
    if (!item) return null;
    const date = new Date(item.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-light, #e2e8f0)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      }}
    >
      <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>
        {isTelugu ? 'డెలివరీ స్థితి & ప్రయాణ దశలు' : 'Delivery Status & Milestones'}
      </h4>

      <div style={{ position: 'relative' }}>
        {MILESTONES.map((milestone, idx) => {
          const isCompleted = idx < currentIndex || currentStatus === 'DELIVERED';
          const isCurrent = idx === currentIndex && currentStatus !== 'DELIVERED';
          const isPending = idx > currentIndex && currentStatus !== 'DELIVERED';
          const timestamp = getTimestampForStatus(milestone.status);

          const IconComponent = milestone.icon;

          return (
            <div
              key={milestone.status}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                position: 'relative',
                marginBottom: idx === MILESTONES.length - 1 ? 0 : '18px',
              }}
            >
              {/* Connecting Line */}
              {idx < MILESTONES.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '28px',
                    left: '15px',
                    width: '2px',
                    height: 'calc(100% - 10px)',
                    background: isCompleted ? '#00a651' : '#e2e8f0',
                    zIndex: 1,
                  }}
                />
              )}

              {/* Status Circle Icon */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isCompleted
                    ? '#00a651'
                    : isCurrent
                    ? '#0b3b95'
                    : '#f1f5f9',
                  color: isCompleted || isCurrent ? 'white' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  boxShadow: isCurrent
                    ? '0 0 0 4px rgba(11, 59, 149, 0.2)'
                    : isCompleted
                    ? '0 2px 6px rgba(0, 166, 81, 0.3)'
                    : 'none',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <IconComponent size={15} />
                )}
              </div>

              {/* Label & Description */}
              <div style={{ marginLeft: '14px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: isCurrent ? 800 : isCompleted ? 700 : 500,
                      color: isCurrent
                        ? '#0b3b95'
                        : isCompleted
                        ? '#0f172a'
                        : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{isTelugu ? milestone.labelTe : milestone.labelEn}</span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '10px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontWeight: 700,
                        }}
                      >
                        ● Active
                      </span>
                    )}
                  </div>

                  {timestamp && (
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      {timestamp}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: isCurrent ? '#475569' : '#94a3b8',
                    marginTop: '2px',
                  }}
                >
                  {isTelugu ? milestone.descTe : milestone.descEn}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
