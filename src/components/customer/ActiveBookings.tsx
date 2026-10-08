'use client';

import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Star,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  ExternalLink,
  Bike,
} from 'lucide-react';
import Link from 'next/link';
import { Booking, BookingStatus, User } from '@/lib/db/types';
import { Language, translations } from '@/lib/i18n/translations';
import CancellationModal from '@/components/customer/CancellationModal';

interface ActiveBookingsProps {
  currentUser?: User | null;
  bookings: Booking[];
  onOpenPayment: (booking: Booking) => void;
  onOpenReview: (booking: Booking) => void;
  onOpenChat: (booking: Booking) => void;
  onCancelBooking: (bookingId: string, reason?: string, isCollusion?: boolean) => void;
  onPriceMatch?: (bookingId: string, matchedAmount: number) => Promise<void>;
  onOpenAuth?: () => void;
  currentLang?: Language;
}

const STATUS_STEPS: BookingStatus[] = [
  'REQUESTED',
  'ACCEPTED',
  'PROVIDER_ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
  'PAYMENT_PENDING',
  'PAID',
  'COMPLETED',
];

const STATUS_LABELS_EN: Record<string, string> = {
  REQUESTED: 'Request Sent',
  ACCEPTED: 'Accepted',
  PROVIDER_ON_THE_WAY: 'On The Way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In Progress',
  PAYMENT_PENDING: 'Payment Pending',
  PAID: 'Paid',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Declined',
  DISPUTED: 'Disputed',
};

const STATUS_LABELS_TE: Record<string, string> = {
  REQUESTED: 'అభ్యర్థన పంపబడింది',
  ACCEPTED: 'అంగీకరించబడింది',
  PROVIDER_ON_THE_WAY: 'దారిలో ఉన్నారు',
  ARRIVED: 'ఇంటి వద్దకు వచ్చారు',
  IN_PROGRESS: 'పని జరుగుతోంది',
  PAYMENT_PENDING: 'చెల్లింపు వేచి ఉంది',
  PAID: 'చెల్లించబడింది',
  COMPLETED: 'పూర్తయింది',
  CANCELLED: 'రద్దు చేయబడింది',
  REJECTED: 'తిరస్కరించబడింది',
  DISPUTED: 'వివాదం',
};

export default function ActiveBookings({
  currentUser,
  bookings,
  onOpenPayment,
  onOpenReview,
  onOpenChat,
  onCancelBooking,
  onPriceMatch,
  onOpenAuth,
  currentLang = 'te',
}: ActiveBookingsProps) {
  const [bookingForCancel, setBookingForCancel] = useState<Booking | null>(null);
  const t = translations[currentLang];
  const statusLabels = currentLang === 'te' ? STATUS_LABELS_TE : STATUS_LABELS_EN;

  if (!currentUser) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          padding: '3.5rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          border: '1px solid var(--border-light)',
          maxWidth: '560px',
          margin: '3rem auto',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-50)',
            color: 'var(--primary-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
          }}
        >
          <Phone size={28} />
        </div>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          {t.signInToTrack}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {t.signInToTrackDesc}
        </p>
        {onOpenAuth && (
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAuth}
            style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem', margin: '0 auto' }}
          >
            <span>{currentLang === 'te' ? 'మొబైల్ OTP తో సైన్ ఇన్' : 'Sign In with Mobile OTP'}</span>
          </button>
        )}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          padding: '3rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          border: '1px solid var(--border-light)',
          maxWidth: '650px',
          margin: '2rem auto',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={28} />
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{t.noBookingsTitle}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
          {t.noBookingsDesc}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '1.5rem auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            Your Service Bookings ({bookings.length})
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Signed in as <strong>{currentUser.name}</strong> ({currentUser.phone})
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {bookings.map((booking) => {
          const currentIndex = STATUS_STEPS.indexOf(booking.status);
          const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';

          // WhatsApp Deep link
          const waPhone = booking.providerPhone.replace(/\D/g, '');
          const waText = encodeURIComponent(
            `Hello ${booking.providerName}! Regarding FixNear Booking #${booking.id} (${booking.category} in ${booking.customerAddress.areaName}): `
          );
          const whatsAppUrl = `https://wa.me/${waPhone}?text=${waText}`;

          return (
            <div
              key={booking.id}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-light)',
                  background: 'var(--surface-alt)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                      {booking.category}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      • {booking.subcategory}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Booking ID: <code style={{ fontWeight: 600 }}>{booking.id}</code> | Scheduled:{' '}
                    <strong>{booking.scheduledDate} ({booking.scheduledTime})</strong>
                  </div>
                </div>

                <div>
                  <span className={`status-chip ${booking.status.toLowerCase().replace(/_/g, '-')}`}>
                    {statusLabels[booking.status] || booking.status}
                  </span>
                </div>
              </div>

              {/* Connected Milestone Stepper (Only if active flow) */}
              {!isCancelled && (
                <div style={{ padding: '1.25rem 1.5rem', background: '#fafbfc', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Connecting progress track line behind nodes */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '13px',
                        left: '4%',
                        right: '4%',
                        height: '2px',
                        background: 'var(--border-light)',
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, (currentIndex / (STATUS_STEPS.length - 1)) * 100))}%`,
                          background: 'var(--secondary)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    {STATUS_STEPS.map((step, idx) => {
                      const isPast = idx <= currentIndex;
                      const isCurrent = idx === currentIndex;

                      return (
                        <div
                          key={step}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                            position: 'relative',
                            zIndex: 2,
                          }}
                        >
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: isCurrent
                                ? 'var(--primary)'
                                : isPast
                                ? 'var(--secondary)'
                                : '#ffffff',
                              color: isPast ? '#ffffff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              boxShadow: isCurrent ? '0 0 0 4px var(--primary-100)' : '0 1px 3px rgba(0,0,0,0.06)',
                              border: !isPast ? '1.5px solid var(--border-medium)' : 'none',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {isPast && !isCurrent ? '✓' : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: '0.675rem',
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent
                                ? 'var(--primary)'
                                : isPast
                                ? 'var(--text-secondary)'
                                : 'var(--text-subtle)',
                              marginTop: '0.4rem',
                              textAlign: 'center',
                              maxWidth: '75px',
                              lineHeight: 1.2,
                            }}
                          >
                            {statusLabels[step] || step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Body */}
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* Provider Info */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ASSIGNED LOCAL PRO
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.15rem' }}>
                      {booking.providerName}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.2rem',
                      }}
                    >
                      <Phone size={13} color="var(--primary)" />
                      <span>{booking.providerPhone}</span>
                    </div>
                  </div>

                  {/* Customer Address */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      SERVICE ADDRESS
                    </div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.15rem', color: 'var(--text-primary)' }}>
                      {booking.customerAddress.street}, {booking.customerAddress.areaName}, Chilakaluripet
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      BILLING & PAYOUT
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.15rem' }}>
                      ₹{booking.pricing.finalAmount || booking.pricing.estimatedAmount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Visiting charge: ₹{booking.pricing.visitingCharges} | 10% platform share included
                    </div>
                  </div>
                </div>

                {/* Price Matched Protection Badge */}
                {booking.priceMatchedAmount && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.6rem 0.9rem',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.825rem',
                      color: '#9a3412',
                      fontWeight: 600,
                    }}
                  >
                    <ShieldCheck size={16} color="#ea580c" />
                    <span>
                      {currentLang === 'te'
                        ? `ధర మ్యాచ్ చేయబడింది: ₹${booking.priceMatchedAmount} (7 రోజుల వారంటీ మరియు రక్షణ యాక్టివ్‌గా ఉన్నాయి)`
                        : `On-App Best Price Matched: ₹${booking.priceMatchedAmount} (Full 7-Day Warranty & Protection Intact)`}
                    </span>
                  </div>
                )}

                {/* Doorstep Start-OTP Security Banner */}
                {booking.startOtp &&
                  (booking.status === 'ACCEPTED' ||
                    booking.status === 'PROVIDER_ON_THE_WAY' ||
                    booking.status === 'ARRIVED') && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem 1.15rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--secondary-50)',
                        border: '1.5px dashed var(--secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'var(--secondary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--secondary-dark)' }}>
                            {currentLang === 'te'
                              ? '🔐 డోర్‌స్టెప్ వెరిఫికేషన్ సెక్యూరిటీ OTP'
                              : '🔐 Doorstep Start-Job Security OTP'}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: '#047857' }}>
                            {currentLang === 'te'
                              ? 'వర్కర్ మీ ఇంటికి చేరిన తర్వాత పని ప్రారంభించడానికి ఈ కోడ్ వారికి చెప్పండి'
                              : 'Share this 4-digit security code with technician upon arrival to unlock warranty'}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1.45rem',
                          fontWeight: 900,
                          letterSpacing: '0.25rem',
                          color: 'var(--secondary-dark)',
                          background: '#ffffff',
                          border: '1.5px solid var(--secondary-200)',
                          padding: '0.35rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      >
                        {booking.startOtp}
                      </div>
                    </div>
                  )}

                {/* Notes */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong>Customer Note:</strong> {booking.description}
                </div>

                {/* Actions Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  {/* Left: Chat, WhatsApp, and Live Tracking */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onOpenChat(booking)}
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                    >
                      <MessageSquare size={14} color="var(--primary)" />
                      <span>{t.liveChatBtn}</span>
                    </button>

                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', color: '#16a34a' }}
                    >
                      <span>{t.whatsAppChatBtn}</span>
                      <ExternalLink size={12} />
                    </a>

                    {(booking.status === 'ACCEPTED' ||
                      booking.status === 'PROVIDER_ON_THE_WAY' ||
                      booking.status === 'ARRIVED') && (
                      <Link
                        href={`/tracking?orderId=CPT-DEL-101&bookingId=${booking.id}`}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.45rem 0.85rem',
                          background: 'var(--primary)',
                          color: 'white',
                          borderRadius: 'var(--radius-md)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          textDecoration: 'none',
                          fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Bike size={14} />
                        <span>{currentLang === 'te' ? 'లైవ్ మ్యాప్ ట్రాకింగ్' : 'Live Track Delivery'}</span>
                      </Link>
                    )}
                  </div>

                  {/* Right: Payment, Review, Cancel */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {(booking.status === 'REQUESTED' ||
                      booking.status === 'ACCEPTED' ||
                      booking.status === 'PROVIDER_ON_THE_WAY' ||
                      booking.status === 'ARRIVED') && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                        onClick={() => setBookingForCancel(booking)}
                      >
                        {t.cancelBookingBtn}
                      </button>
                    )}

                    {booking.status === 'PAYMENT_PENDING' && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ background: 'var(--accent-saffron-hover)' }}
                        onClick={() => onOpenPayment(booking)}
                      >
                        <CreditCard size={16} />
                        <span>
                          {t.payUpiBtn} (₹{booking.pricing.finalAmount || booking.pricing.estimatedAmount})
                        </span>
                      </button>
                    )}

                    {booking.status === 'COMPLETED' && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onOpenReview(booking)}
                      >
                        <Star size={16} />
                        <span>{t.rateServiceBtn}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Security Anti-Circumvention Cancellation & Price Match Protection Modal */}
      {bookingForCancel && (
        <CancellationModal
          booking={bookingForCancel}
          currentLang={currentLang}
          onClose={() => setBookingForCancel(null)}
          onConfirmCancel={async (reason, isCollusion) => {
            onCancelBooking(bookingForCancel.id, reason, isCollusion);
            setBookingForCancel(null);
          }}
          onPriceMatch={async (newAmount) => {
            if (onPriceMatch) {
              await onPriceMatch(bookingForCancel.id, newAmount);
            }
          }}
        />
      )}
    </div>
  );
}
