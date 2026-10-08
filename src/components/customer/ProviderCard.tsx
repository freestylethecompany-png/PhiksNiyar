'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Sparkles,
  Info,
  Calendar,
  IndianRupee,
  X,
  Award,
} from 'lucide-react';
import { ProviderMatchResult } from '@/lib/db/types';
import { Language, translations } from '@/lib/i18n/translations';

interface ProviderCardProps {
  match: ProviderMatchResult;
  onBook: (match: ProviderMatchResult) => void;
  onViewReviews: (match: ProviderMatchResult) => void;
  currentLang?: Language;
}

export default function ProviderCard({
  match,
  onBook,
  onViewReviews,
  currentLang = 'te',
}: ProviderCardProps) {
  const { provider, user, overallScore, breakdown } = match;
  const [showScoreModal, setShowScoreModal] = useState(false);
  const t = translations[currentLang];

  return (
    <>
      <div className="provider-card">
        {/* Top Info */}
        <div className="provider-card-top">
          {/* Avatar with Live Status Indicator */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={
                user.avatarUrl ||
                'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'
              }
              alt={provider.businessName}
              className="provider-avatar"
            />
            <span
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'var(--success)',
                border: '2px solid #ffffff',
                boxShadow: '0 0 4px rgba(5, 150, 105, 0.4)',
              }}
              title="Active in Chilakaluripet"
            />
          </div>

          <div className="provider-info">
            <div className="provider-title-row">
              <div>
                <h3 className="provider-name">{provider.businessName}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span className="provider-category-tag">{provider.primaryCategory}</span>
                  {provider.verificationStatus === 'VERIFIED' ? (
                    <span className="verified-badge">
                      <ShieldCheck size={13} color="var(--secondary)" /> {t.verifiedPartnerBadge}
                    </span>
                  ) : (
                    <span className="pending-badge">
                      {currentLang === 'te' ? 'ధృవీకరణ పెండింగ్‌లో ఉంది' : 'Verification Pending'}
                    </span>
                  )}
                </div>
              </div>

              {/* Match Score Pill */}
              <button
                type="button"
                className="match-score-pill"
                onClick={() => setShowScoreModal(true)}
                title={
                  currentLang === 'te'
                    ? 'AI మ్యాచ్ స్కోర్ వివరణ చూడండి'
                    : 'Click to view transparent match score breakdown'
                }
              >
                <Sparkles size={13} />
                <span>
                  {overallScore}% {t.matchScoreLabel}
                </span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="provider-metrics-row">
              <div
                className="metric-item"
                style={{
                  background: 'var(--warning-light)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#b45309',
                  fontWeight: 700,
                }}
              >
                <Star size={13} fill="#d97706" color="#d97706" />
                <span>
                  {provider.metrics.rating} ({provider.metrics.totalReviews} {t.reviewsCountLabel})
                </span>
              </div>

              <div
                className="metric-item"
                style={{
                  background: 'var(--primary-50)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--primary-dark)',
                  fontWeight: 600,
                }}
              >
                <MapPin size={13} color="var(--primary)" />
                <span>
                  {currentLang === 'te'
                    ? `${breakdown.distanceKm} కి.మీ (${provider.locationArea})`
                    : `${breakdown.distanceKm} km away (${provider.locationArea})`}
                </span>
              </div>

              <div
                className="metric-item"
                style={{
                  background: 'var(--secondary-50)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--secondary-dark)',
                  fontWeight: 600,
                }}
              >
                <CheckCircle size={13} color="var(--secondary)" />
                <span>
                  {currentLang === 'te'
                    ? `${provider.metrics.completedJobs} పూర్తయ్యాయి`
                    : `${provider.metrics.completedJobs} jobs done`}
                </span>
              </div>

              <div
                className="metric-item"
                style={{
                  background: 'var(--surface-alt)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                <Clock size={13} color="var(--text-muted)" />
                <span>
                  {currentLang === 'te'
                    ? `${provider.metrics.responseRate}% స్పందన (~${provider.metrics.avgResponseMinutes}ని.)`
                    : `${provider.metrics.responseRate}% response (~${provider.metrics.avgResponseMinutes}m)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio preview */}
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: '0.25rem 0',
          }}
        >
          {provider.bio}
        </p>

        {/* Footer: Visiting charge & actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t.visitingChargeLabel}
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '1px',
              }}
            >
              <span>₹{provider.pricingModel.visitingCharge}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {currentLang === 'te' ? '(ఇంటి వద్ద తనిఖీ)' : '(Doorstep Inspection)'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onViewReviews(match)}
              style={{ padding: '0.5rem 0.95rem', fontSize: '0.8125rem' }}
            >
              {t.viewReviewsBtn} ({provider.metrics.totalReviews})
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onBook(match)}
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.8125rem' }}
            >
              <Calendar size={15} />
              <span>{t.bookNowBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Match Score Modal */}
      {showScoreModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={18} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                    {currentLang === 'te' ? 'పారదర్శక AI మ్యాచ్ స్కోర్' : 'Transparent Match Breakdown'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Algorithm Match: <strong>{overallScore}% compatibility</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowScoreModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.25rem',
                  lineHeight: 1.5,
                }}
              >
                {currentLang === 'te'
                  ? `సేవంత (Sevanta) ఎలాంటి స్పాన్సర్డ్ లేదా చెల్లించిన స్థానాలను అనుమతించదు. ఈ స్కోర్ (${overallScore}%) చిలకలూరిపేటలో మా 10-ఫ్యాక్టర్ పారదర్శక అల్గారిథమ్ ద్వారా లెక్కించబడింది:`
                  : `Sevanta never sells sponsored listings. This score (${overallScore}%) is computed objectively using our 10-factor local matching algorithm:`}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <ScoreFactorRow
                  label={currentLang === 'te' ? 'కేటగిరీ & స్కిల్ మ్యాచ్' : 'Category & Skill Match'}
                  weight="30%"
                  score={breakdown.categoryMatchScore}
                />
                <ScoreFactorRow
                  label={
                    currentLang === 'te'
                      ? `దూరం & సామీప్యత (${breakdown.distanceKm} కి.మీ చిలకలూరిపేటలో)`
                      : `Distance Proximity (${breakdown.distanceKm} km in Chilakaluripet)`
                  }
                  weight="20%"
                  score={breakdown.distanceScore}
                />
                <ScoreFactorRow
                  label="Working Hours & Immediate Availability"
                  weight="15%"
                  score={breakdown.availabilityScore}
                />
                <ScoreFactorRow
                  label={`Customer Rating (${provider.metrics.rating} ⭐)`}
                  weight="10%"
                  score={breakdown.ratingScore}
                />
                <ScoreFactorRow
                  label={`Job Completion Rate (${100 - provider.metrics.cancellationRate}%)`}
                  weight="10%"
                  score={breakdown.completionRateScore}
                />
                <ScoreFactorRow
                  label={`Response Speed (${provider.metrics.avgResponseMinutes} min avg)`}
                  weight="5%"
                  score={breakdown.responseRateScore}
                />
                <ScoreFactorRow
                  label={`Visiting Price Compatibility (₹${provider.pricingModel.visitingCharge})`}
                  weight="10%"
                  score={breakdown.priceScore}
                />
              </div>

              {provider.verificationStatus === 'VERIFIED' && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.65rem 0.95rem',
                    background: 'var(--secondary-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--secondary-200)',
                    fontSize: '0.8125rem',
                    color: 'var(--secondary-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldCheck size={18} color="var(--secondary)" style={{ flexShrink: 0 }} />
                  <span>
                    Government ID & trade credentials verified by Sevanta administrator (+5% trust bonus).
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowScoreModal(false)}
                style={{ padding: '0.5rem 1.25rem' }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ScoreFactorRow({
  label,
  weight,
  score,
}: {
  label: string;
  weight: string;
  score: number;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8125rem',
          fontWeight: 600,
          marginBottom: '0.25rem',
        }}
      >
        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Weight: {weight} • <strong>{score}/100</strong>
        </span>
      </div>
      <div
        style={{
          height: '6px',
          background: 'var(--surface-alt)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(score, 100)}%`,
            background:
              score >= 80 ? 'var(--primary)' : score >= 50 ? 'var(--accent-saffron)' : 'var(--danger)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}
