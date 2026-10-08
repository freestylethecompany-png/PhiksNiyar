'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Booking } from '@/lib/db/types';

interface ReviewModalProps {
  booking: Booking;
  onSubmitReview: (reviewPayload: any) => Promise<void>;
  onClose: () => void;
}

export default function ReviewModal({
  booking,
  onSubmitReview,
  onClose,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [professionalismRating, setProfessionalismRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please write a short review sharing your experience in Chilakaluripet.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReview({
        bookingId: booking.id,
        customerId: booking.customerId,
        rating,
        qualityRating,
        professionalismRating,
        valueRating,
        comment: comment.trim(),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Rate & Review Provider</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {booking.providerName} • {booking.category}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Overall Rating Stars */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                OVERALL EXPERIENCE
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ padding: '4px' }}
                  >
                    <Star
                      size={32}
                      fill={star <= rating ? '#f59e0b' : 'none'}
                      color={star <= rating ? '#f59e0b' : '#cbd5e1'}
                    />
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.3rem', color: '#d97706' }}>
                {rating === 5 && 'Outstanding! 🌟'}
                {rating === 4 && 'Very Good! 👍'}
                {rating === 3 && 'Average 👌'}
                {rating === 2 && 'Needs Improvement ⚠️'}
                {rating === 1 && 'Unsatisfactory ❌'}
              </div>
            </div>

            {/* Dimensional Ratings */}
            <div
              style={{
                background: 'var(--surface-alt)',
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <RatingBarRow
                label="Quality of Service & Repair"
                value={qualityRating}
                onChange={setQualityRating}
              />
              <RatingBarRow
                label="Punctuality & Professionalism"
                value={professionalismRating}
                onChange={setProfessionalismRating}
              />
              <RatingBarRow
                label="Value for Money"
                value={valueRating}
                onChange={setValueRating}
              />
            </div>

            {/* Written Review */}
            <div className="form-group">
              <label className="form-label">Written Feedback</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the service? Did the technician reach on time? (e.g. 'Ravi garu reached Kalamandir Center quickly and resolved the cooling issue efficiently.')"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <span>Submit Verified Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RatingBarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: '3px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            style={{ padding: '2px' }}
          >
            <Star
              size={16}
              fill={s <= value ? '#f59e0b' : 'none'}
              color={s <= value ? '#f59e0b' : '#94a3b8'}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
