'use client';

import React, { useState } from 'react';
import { Smartphone, Lock, CheckCircle2, ArrowRight, X, Loader2, Sparkles } from 'lucide-react';
import { User, UserRole } from '@/lib/db/types';

interface AuthModalProps {
  initialRole?: UserRole;
  onSuccess: (user: User) => void;
  onClose: () => void;
}

export default function AuthModal({ initialRole = 'CUSTOMER', onSuccess, onClose }: AuthModalProps) {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setDevOtp(data.devOtp || null);
        setStep('OTP');
      } else {
        setErrorMsg(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setErrorMsg('Network error while requesting OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: otpCode.trim(),
          role,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.error || 'Invalid OTP code');
      }
    } catch (err) {
      setErrorMsg('Network error while verifying OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img src="/sevanta-logo.png" alt="Sevanta" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {step === 'PHONE' ? 'Sign in with Phone' : 'Enter 6-digit OTP'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Seva</span>
                <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>nta</span> • Chilakaluripet, AP
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp}>
            <div className="modal-body">
              {errorMsg && (
                <div style={{ padding: '0.6rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Select Your Role</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`role-btn ${role === 'CUSTOMER' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.5rem', textAlign: 'center', justifyContent: 'center' }}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('PROVIDER')}
                    className={`role-btn ${role === 'PROVIDER' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.5rem', textAlign: 'center', justifyContent: 'center' }}
                  >
                    Service Provider
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Babu / Ravi Kumar"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number (India)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  A 6-digit OTP will be verified. Standard SMS rates apply.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading || !phone}>
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="modal-body">
              {errorMsg && (
                <div style={{ padding: '0.6rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                We sent a 6-digit code to <strong>{phone}</strong>.
              </p>

              {process.env.NODE_ENV !== 'production' && devOtp && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'var(--primary-50)',
                    border: '1px solid var(--primary-200)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: 'var(--primary-dark)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong>Local Dev OTP:</strong> <code>{devOtp}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtp)}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 123456"
                  style={{ letterSpacing: '0.3em', fontSize: '1.25rem', textAlign: 'center', fontWeight: 800 }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}
                >
                  Change phone number
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading || otpCode.length < 4}>
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
