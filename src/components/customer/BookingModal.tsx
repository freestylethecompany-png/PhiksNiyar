'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, IndianRupee, ShieldCheck, X, Loader2 } from 'lucide-react';
import { ProviderMatchResult, AIUnderstoodRequest, User } from '@/lib/db/types';
import { Language, translations } from '@/lib/i18n/translations';

interface BookingModalProps {
  match: ProviderMatchResult;
  initialRequest?: AIUnderstoodRequest | null;
  selectedArea: string;
  currentUser?: User | null;
  onConfirmBooking: (bookingPayload: any) => Promise<void>;
  onClose: () => void;
  currentLang?: Language;
}

export default function BookingModal({
  match,
  initialRequest,
  selectedArea,
  currentUser,
  onConfirmBooking,
  onClose,
  currentLang = 'te',
}: BookingModalProps) {
  const { provider } = match;
  const t = translations[currentLang];
  const [scheduledDate, setScheduledDate] = useState(
    initialRequest?.preferredDate === 'Tomorrow'
      ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState(
    initialRequest?.preferredTime || (currentLang === 'te' ? 'సాయంత్రం (4:30 PM - 8:00 PM)' : 'Evening (4:30 PM - 8:00 PM)')
  );
  const [streetAddress, setStreetAddress] = useState(
    'D.No 4-22, Near Gandhi Statue, Main Road'
  );
  const [notes, setNotes] = useState(
    initialRequest?.issue || `${provider.primaryCategory} doorstep service requested`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visitingCharge = provider.pricingModel.visitingCharge;
  const platformFee = Math.round((visitingCharge * 10) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmBooking({
        providerId: provider.id,
        customerId: currentUser?.id || 'usr-cust-1',
        category: initialRequest?.category || provider.primaryCategory,
        subcategory: initialRequest?.subcategory || provider.subcategories[0] || 'Inspection',
        description: notes,
        scheduledDate,
        scheduledTime,
        address: {
          id: `addr-${Date.now()}`,
          userId: currentUser?.id || 'usr-cust-1',
          title: 'Home',
          street: streetAddress,
          areaName: selectedArea,
          city: 'Chilakaluripet',
          state: 'Andhra Pradesh',
          pincode: '522616',
          latitude: 16.0885,
          longitude: 80.166,
          isDefault: true,
        },
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit booking');
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
            <h3 style={{ fontSize: '1.2rem' }}>
              {currentLang === 'te' ? `${provider.businessName} బుకింగ్` : `Book ${provider.businessName}`}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {currentLang === 'te'
                ? `${selectedArea}, చిలకలూరిపేటలో ఇంటి వద్దకే సర్వీస్`
                : `Doorstep service in ${selectedArea}, Chilakaluripet`}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Service Summary Chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: 'var(--primary-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-200)',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  {currentLang === 'te' ? 'ఎంచుకున్న సర్వీస్' : 'SELECTED SERVICE'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {initialRequest?.category || provider.primaryCategory}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {initialRequest?.subcategory || provider.subcategories[0]}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.visitingChargeLabel}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                  ₹{visitingCharge}
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.selectDateLabel}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.selectTimeLabel}
                </label>
                <select
                  className="form-select"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                >
                  <option value="Morning (9:00 AM - 12:00 PM)">
                    {currentLang === 'te' ? 'ఉదయం (9:00 AM - 12:00 PM)' : 'Morning (9:00 AM - 12:00 PM)'}
                  </option>
                  <option value="Afternoon (1:00 PM - 4:00 PM)">
                    {currentLang === 'te' ? 'మధ్యాహ్నం (1:00 PM - 4:00 PM)' : 'Afternoon (1:00 PM - 4:00 PM)'}
                  </option>
                  <option value="Evening (4:30 PM - 8:00 PM)">
                    {currentLang === 'te' ? 'సాయంత్రం (4:30 PM - 8:00 PM)' : 'Evening (4:30 PM - 8:00 PM)'}
                  </option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">
                <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {t.doorstepAddressLabel}
              </label>
              <input
                type="text"
                className="form-input"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder={currentLang === 'te' ? 'ఇంటి నంబరు, వీధి, గుర్తు' : 'Door No, Street, Landmark'}
                required
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">{t.problemNotesLabel}</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  currentLang === 'te'
                    ? 'సమస్య వివరాలు తెలపండి (ఉదా: 1.5 టన్ స్ప్లిట్ AC కూలింగ్ రాలేదు)'
                    : 'Explain any details (e.g. 1.5 ton split AC cooling problem)'
                }
              />
            </div>

            {/* Pricing Transparency */}
            <div
              style={{
                background: 'var(--surface-alt)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.visitingChargeLabel}</span>
                <span style={{ fontWeight: 600 }}>₹{visitingCharge}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {currentLang === 'te' ? 'ప్లాట్‌ఫామ్ & బీమా సదుపాయం' : 'Platform Facilitation & Insurance'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                  {currentLang === 'te' ? 'ఉచితం (10% వాటా సహా)' : 'FREE (Inc. 10% platform share)'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid var(--border-light)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                }}
              >
                <span>{currentLang === 'te' ? 'చెల్లించాల్సిన మొత్తం' : 'Total Amount Due'}</span>
                <span>₹{visitingCharge}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                {t.visitingChargeNotice}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              {currentLang === 'te' ? 'రద్దు చేయి' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t.submittingBookingBtn}</span>
                </>
              ) : (
                <span>{t.confirmBookingBtn}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
