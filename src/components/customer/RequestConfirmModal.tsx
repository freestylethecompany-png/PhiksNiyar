'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Calendar, AlertCircle, Wrench, X, Sparkles } from 'lucide-react';
import { AIUnderstoodRequest } from '@/lib/db/types';

interface RequestConfirmModalProps {
  requestData: AIUnderstoodRequest;
  onConfirm: (confirmedData: AIUnderstoodRequest) => void;
  onClose: () => void;
}

export default function RequestConfirmModal({
  requestData,
  onConfirm,
  onClose,
}: RequestConfirmModalProps) {
  const [formData, setFormData] = useState<AIUnderstoodRequest>({ ...requestData });

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-50)',
                color: 'var(--primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>AI Understood Your Request</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Review structured details before matching local providers
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* User's original prompt preview */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--primary)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              YOUR ORIGINAL VOICE / TEXT QUERY:
            </div>
            <div style={{ fontStyle: 'italic', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              &ldquo;{formData.rawInput}&rdquo;
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label className="form-label">Identified Service Category</label>
            <input
              type="text"
              className="form-input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subcategory / Specific Fault</label>
            <input
              type="text"
              className="form-input"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Problem Summary</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Preferred Date</label>
              <select
                className="form-select"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              >
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="Day After Tomorrow">Day After Tomorrow</option>
                <option value="This Weekend">This Weekend</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Time Slot</label>
              <select
                className="form-select"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              >
                <option value="Flexible">Flexible Anytime</option>
                <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1:00 PM - 4:00 PM)</option>
                <option value="Evening (4:30 PM - 8:00 PM)">Evening (4:30 PM - 8:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Urgency Level</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(['low', 'normal', 'urgent'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: lvl })}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor:
                      formData.urgency === lvl
                        ? lvl === 'urgent'
                          ? 'var(--danger)'
                          : 'var(--primary)'
                        : 'var(--border-light)',
                    background:
                      formData.urgency === lvl
                        ? lvl === 'urgent'
                          ? 'var(--danger-light)'
                          : 'var(--primary-50)'
                        : 'var(--surface)',
                    color:
                      formData.urgency === lvl
                        ? lvl === 'urgent'
                          ? 'var(--danger)'
                          : 'var(--primary-dark)'
                        : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {lvl === 'urgent' ? '🚨 Urgent' : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onConfirm(formData)}
          >
            <CheckCircle2 size={16} />
            <span>Confirm & Match Providers</span>
          </button>
        </div>
      </div>
    </div>
  );
}
