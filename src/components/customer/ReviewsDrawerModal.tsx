'use client';

import React from 'react';
import { Star, ShieldCheck, X, User } from 'lucide-react';
import { ProviderMatchResult, Review } from '@/lib/db/types';

interface ReviewsDrawerModalProps {
  match: ProviderMatchResult;
  reviews: Review[];
  onClose: () => void;
}

export default function ReviewsDrawerModal({
  match,
  reviews,
  onClose,
}: ReviewsDrawerModalProps) {
  const { provider } = match;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Customer Reviews</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontWeight: 700 }}>{provider.businessName}</span>
              <span style={{ color: '#d97706', fontWeight: 800 }}>• {provider.metrics.rating} ⭐</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({provider.metrics.totalReviews} total)</span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
              No written reviews yet for this provider in Chilakaluripet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.customerName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Verified booking in Chilakaluripet • {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
