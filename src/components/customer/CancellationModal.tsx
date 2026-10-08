'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  IndianRupee,
  X,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  TrendingDown,
} from 'lucide-react';
import { Booking } from '@/lib/db/types';
import { Language, translations } from '@/lib/i18n/translations';

interface CancellationModalProps {
  booking: Booking;
  currentLang?: Language;
  onConfirmCancel: (reason: string, isCollusion: boolean) => Promise<void>;
  onPriceMatch: (newAmount: number) => Promise<void>;
  onClose: () => void;
}

export default function CancellationModal({
  booking,
  currentLang = 'te',
  onConfirmCancel,
  onPriceMatch,
  onClose,
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('WORKER_OFFERED_LOWER_PRICE');
  const [workerQuotedPrice, setWorkerQuotedPrice] = useState<number>(
    Math.max(100, (booking.pricing.finalAmount || booking.pricing.estimatedAmount) - 50)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPriceMatchSuccess, setShowPriceMatchSuccess] = useState(false);

  const t = translations[currentLang];
  const currentTotal = booking.pricing.finalAmount || booking.pricing.estimatedAmount;

  const isWorkerCollusion = selectedReason === 'WORKER_OFFERED_LOWER_PRICE';

  const cancellationReasons = [
    {
      id: 'WORKER_OFFERED_LOWER_PRICE',
      labelEn: 'Worker offered a lower price directly in cash to cancel app',
      labelTe: 'వర్కర్ యాప్ బయట తక్కువ ధర చెప్పి క్యాన్సిల్ చేయమన్నారు (ఆఫ్‌లైన్ నగదు)',
      isRisk: true,
    },
    {
      id: 'WORKER_QUOTED_HIGHER_PRICE',
      labelEn: 'Worker quoted much higher price than estimated on website',
      labelTe: 'వెబ్‌సైట్ ధర కంటే వర్కర్ చాలా ఎక్కువ డబ్బులు అడుగుతున్నారు',
      isRisk: false,
    },
    {
      id: 'WORKER_DELAYED',
      labelEn: 'Worker is severely delayed or did not respond',
      labelTe: 'వర్కర్ చాలా ఆలస్యం చేశారు లేదా ఫోన్ ఎత్తలేదు',
      isRisk: false,
    },
    {
      id: 'NO_LONGER_NEEDED',
      labelEn: 'I no longer need this service / problem solved',
      labelTe: 'నాకు ఇకపై ఈ సర్వీస్ అవసరం లేదు / సమస్య తీరిపోయింది',
      isRisk: false,
    },
    {
      id: 'OTHER',
      labelEn: 'Other personal reason',
      labelTe: 'ఇతర వ్యక్తిగత కారణం',
      isRisk: false,
    },
  ];

  const handlePriceMatchSubmit = async () => {
    if (workerQuotedPrice <= 0 || workerQuotedPrice >= currentTotal) {
      alert(
        currentLang === 'te'
          ? `దయచేసి అసలు బిల్లు (₹${currentTotal}) కంటే తక్కువగా వర్కర్ చెప్పిన ధర నమోదు చేయండి.`
          : `Please enter the lower price (less than ₹${currentTotal}) quoted by the worker.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onPriceMatch(workerQuotedPrice);
      setShowPriceMatchSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to update price match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedCancel = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmCancel(selectedReason, isWorkerCollusion);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '580px', overflow: 'hidden' }}>
        {/* Header */}
        <div
          className="modal-header"
          style={{
            background: isWorkerCollusion ? '#fff1f2' : 'var(--surface)',
            borderBottom: isWorkerCollusion ? '1px solid #fecdd3' : '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isWorkerCollusion ? '#ffe4e6' : 'var(--primary-50)',
                color: isWorkerCollusion ? '#e11d48' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isWorkerCollusion ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: isWorkerCollusion ? '#9f1239' : 'var(--text-primary)' }}>
                {currentLang === 'te' ? 'బుకింగ్ రద్దు & ధర భద్రత' : 'Booking Cancellation & Price Protection'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {booking.providerName} • {booking.category}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
          {showPriceMatchSuccess ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#166534', fontWeight: 800 }}>
                {currentLang === 'te' ? 'ధర సవరించబడింది!' : 'Price Matched on App!'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                {currentLang === 'te'
                  ? `మీ బిల్లు ₹${workerQuotedPrice} కి మార్చబడింది. 7 రోజుల ఉచిత వారంటీ మరియు రక్షణ కొనసాగుతాయి!`
                  : `Bill updated to ₹${workerQuotedPrice}. Your 7-day warranty and insurance remain fully active!`}
              </p>
            </div>
          ) : (
            <>
              {/* Reason Selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {currentLang === 'te' ? 'రద్దు చేయడానికి ప్రధాన కారణం ఏమిటి?' : 'Why are you cancelling?'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {cancellationReasons.map((r) => (
                    <label
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        border: selectedReason === r.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: selectedReason === r.id ? 'var(--primary-50)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="cancellationReason"
                        checked={selectedReason === r.id}
                        onChange={() => setSelectedReason(r.id)}
                        style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {currentLang === 'te' ? r.labelTe : r.labelEn}
                        </div>
                        {r.isRisk && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#b91c1c',
                              fontWeight: 700,
                              marginTop: '0.2rem',
                              display: 'inline-block',
                            }}
                          >
                            ⚠️ {currentLang === 'te' ? 'వారంటీ రద్దు అయ్యే ప్రమాదం ఉంది' : 'High Risk of Warranty Loss'}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* SPECIAL ANTI-CIRCUMVENTION RESOLUTION BLOCK */}
              {isWorkerCollusion && (
                <div
                  style={{
                    background: '#fff7ed',
                    border: '1px solid #fdba74',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    marginTop: '1rem',
                  }}
                >
                  {/* Warning Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c', fontWeight: 800 }}>
                    <ShieldAlert size={18} />
                    <span>
                      {currentLang === 'te'
                        ? 'జాగ్రత్త: యాప్ బయట నగదు చెల్లిస్తే వారంటీ రద్దు అవుతుంది!'
                        : 'WARNING: You LOSE 100% of FixNear Protection Offline!'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: '0.35rem', lineHeight: 1.45 }}>
                    {currentLang === 'te'
                      ? 'వర్కర్ చెప్పిన తక్కువ ధరకు యాప్ క్యాన్సిల్ చేసి నేరుగా నగదు ఇస్తే: రేపు మళ్లీ అదే సమస్య వచ్చినా ఎవరూ ఉచితంగా చేయరు, మరియు పరికరాల నష్టపరిహార బీమా లభించదు!'
                      : 'If you cancel the booking to pay directly in cash: You lose our 7-Day Free Rework Guarantee, ₹10,000 Appliance Damage Protection, and verified safety record.'}
                  </p>

                  {/* The Win-Win Price Match Solution */}
                  <div
                    style={{
                      background: 'white',
                      border: '1px solid #fed7aa',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginTop: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: '#9a3412' }}>
                      <TrendingDown size={16} color="#ea580c" />
                      <span>
                        {currentLang === 'te'
                          ? 'పరిష్కారం: వర్కర్ చెప్పిన ధరకే యాప్‌లోనే బిల్ చేయండి!'
                          : 'FixNear Best Price Match: Pay Worker’s Quote ON-APP!'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {currentLang === 'te'
                        ? `వర్కర్ ఎంత ధర చెప్పారు? ఆ మొత్తాన్ని నమోదు చేయండి. మీరు తక్కువ ధరే చెల్లిస్తారు, మరియు 7 రోజుల వారంటీ ఉంటుంది!`
                        : `Enter the lower price the technician quoted. Pay that exact amount through the app while keeping 100% of your warranty!`}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                          }}
                        >
                          ₹
                        </span>
                        <input
                          type="number"
                          className="form-input"
                          style={{ paddingLeft: '24px', fontWeight: 700, fontSize: '1rem' }}
                          value={workerQuotedPrice}
                          onChange={(e) => setWorkerQuotedPrice(Number(e.target.value))}
                          placeholder="e.g. 350"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                          whiteSpace: 'nowrap',
                          padding: '0.65rem 1.1rem',
                          fontSize: '0.85rem',
                        }}
                        disabled={isSubmitting}
                        onClick={handlePriceMatchSubmit}
                      >
                        <ShieldCheck size={16} />
                        <span>
                          {currentLang === 'te' ? 'ధర మ్యాచ్ చేసి రక్షణ పొందండి' : 'Match Price & Keep Warranty'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!showPriceMatchSuccess && (
          <div className="modal-footer" style={{ background: 'var(--surface-alt)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              {currentLang === 'te' ? 'వెనక్కి వెళ్ళు' : 'Keep Booking'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{
                color: '#b91c1c',
                borderColor: '#fca5a5',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
              disabled={isSubmitting}
              onClick={handleProceedCancel}
            >
              {isSubmitting
                ? currentLang === 'te'
                  ? 'రద్దు చేస్తున్నాము...'
                  : 'Cancelling...'
                : isWorkerCollusion
                ? currentLang === 'te'
                  ? 'వారంటీ లేకుండానే రద్దు చేయండి'
                  : 'Cancel Without Warranty'
                : currentLang === 'te'
                ? 'బుకింగ్ రద్దు చేయండి'
                : 'Confirm Cancellation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
