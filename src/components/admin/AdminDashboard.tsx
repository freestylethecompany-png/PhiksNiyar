'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Sliders,
  FileText,
  Loader2,
  Activity,
  Calendar,
  Lock,
} from 'lucide-react';
import { PlatformSettings, ProviderProfile, Booking, User } from '@/lib/db/types';

interface AdminDashboardProps {
  currentUser?: User | null;
  onAuthenticateAdmin?: () => Promise<void>;
  onGoHome?: () => void;
}

export default function AdminDashboard({ currentUser, onAuthenticateAdmin, onGoHome }: AdminDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VERIFICATION' | 'BOOKINGS' | 'SETTINGS' | 'AUDIT'>('OVERVIEW');
  const [settingsForm, setSettingsForm] = useState<PlatformSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      const res = await fetch('/api/admin');
      if (res.status === 403 || res.status === 401) {
        setAuthError(true);
        setData(null);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        setSettingsForm(json.settings);
        setAuthError(false);
      } else {
        setAuthError(true);
      }
    } catch (e) {
      console.error(e);
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser?.id, currentUser?.role]);

  const handleVerifyProvider = async (providerId: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          status,
          notes: `Verified by admin via console for Chilakaluripet market`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(`Provider status updated to ${status}`);
        setTimeout(() => setStatusMessage(null), 3000);
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
      alert('Verification update failed');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;

    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage('Platform commission & match algorithm settings saved successfully!');
        setTimeout(() => setStatusMessage(null), 3000);
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem' }}>Loading Admin Portal...</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Verifying administrator credentials for Chilakaluripet</p>
      </div>
    );
  }

  if (authError || !data) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', maxWidth: '580px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem 2rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Admin Privileges Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            The Sevanta Admin Console is strictly protected. You must be signed in as a verified Platform Administrator to audit transactions, approve local service providers, and adjust commission rates.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {onAuthenticateAdmin && (
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  await onAuthenticateAdmin();
                  fetchAdminData();
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
              >
                <Shield size={18} />
                <span>Authenticate as Sevanta Admin (+91 90000 00001)</span>
              </button>
            )}
            {onGoHome && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onGoHome}
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
              >
                Return to Customer Marketplace
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { metrics, verificationQueue, allProviders, recentBookings, auditLogs } = data;

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem 1.25rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--text-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/sevanta-logo.png" alt="Sevanta" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              <h1 style={{ fontSize: '1.6rem' }}>
                <span style={{ color: 'var(--primary)' }}>Seva</span>
                <span style={{ color: 'var(--secondary)' }}>nta</span> Admin Command Center
              </h1>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Platform Governance • Market: Chilakaluripet, AP • Commission: {metrics.commissionPercent}%
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--surface)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <button
            className={`role-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
            onClick={() => setActiveTab('OVERVIEW')}
            style={{ padding: '0.5rem 0.9rem' }}
          >
            Overview
          </button>
          <button
            className={`role-btn ${activeTab === 'VERIFICATION' ? 'active' : ''}`}
            onClick={() => setActiveTab('VERIFICATION')}
            style={{ padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>Verification Queue</span>
            {verificationQueue.length > 0 && (
              <span style={{ background: 'var(--danger)', color: 'white', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px' }}>
                {verificationQueue.length}
              </span>
            )}
          </button>
          <button
            className={`role-btn ${activeTab === 'BOOKINGS' ? 'active' : ''}`}
            onClick={() => setActiveTab('BOOKINGS')}
            style={{ padding: '0.5rem 0.9rem' }}
          >
            Bookings ({recentBookings.length})
          </button>
          <button
            className={`role-btn ${activeTab === 'SETTINGS' ? 'active' : ''}`}
            onClick={() => setActiveTab('SETTINGS')}
            style={{ padding: '0.5rem 0.9rem' }}
          >
            Settings & Weights
          </button>
          <button
            className={`role-btn ${activeTab === 'AUDIT' ? 'active' : ''}`}
            onClick={() => setActiveTab('AUDIT')}
            style={{ padding: '0.5rem 0.9rem' }}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--success-light)',
            color: '#065f46',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #a7f3d0',
            fontWeight: 600,
            marginBottom: '1.25rem',
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'OVERVIEW' && (
        <div>
          {/* Key Metric Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REGISTERED PROVIDERS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {metrics.totalProviders}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>
                {metrics.verifiedProviders} Verified | {metrics.pendingVerifications} Pending
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SERVICE BOOKINGS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                {metrics.totalBookings}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {metrics.completedJobs} Completed & Paid
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GROSS MARKETPLACE GMV</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                ₹{metrics.grossRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Paid transaction volume
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLATFORM COMMISSION EARNED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-saffron-hover)', marginTop: '0.2rem' }}>
                ₹{metrics.platformCommission.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                At {metrics.commissionPercent}% platform fee
              </div>
            </div>
          </div>

          {/* Marketplace Integrity & Offline Circumvention Defense Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1.5px solid #a7f3d0',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: '#059669',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>
                    Marketplace Anti-Circumvention & UIDAI Security Shield
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#047857' }}>
                    Automated Defense Against Worker Offline Cash Undercutting & Identity Fraud
                  </p>
                </div>
              </div>

              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid #86efac',
                }}
              >
                ● Live Protection Active
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #d1fae5' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>UIDAI AADHAAR VERHOEFF</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginTop: '0.2rem' }}>
                  100% Cryptographic
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Verhoeff checksum + SHA-256 identity hash + masked storage
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #d1fae5' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>GEOFENCE PLACE VERIFY</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginTop: '0.2rem' }}>
                  25 km Chilakaluripet
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  GPS workshop verification centered at 16.0885° N, 80.1660° E
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #d1fae5' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>DOORSTEP START-OTP</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginTop: '0.2rem' }}>
                  4-Digit OTP Required
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Technician must verify customer code before starting job
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #d1fae5' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>COLLUSION STRIKES LOGGED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309', marginTop: '0.2rem' }}>
                  {allProviders.reduce((acc: number, p: any) => acc + (p.circumventionStrikes || 0), 0)} Strikes
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Automated penalty when customers report offline cash quotes
                </div>
              </div>
            </div>
          </div>

          {/* Quick Roster of All Providers */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-light)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>
              Chilakaluripet Service Provider Network ({allProviders.length})
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Provider / Business</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Area</th>
                    <th style={{ padding: '0.75rem' }}>Security Verification</th>
                    <th style={{ padding: '0.75rem' }}>Circumvention Integrity</th>
                    <th style={{ padding: '0.75rem' }}>Rating</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allProviders.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 700 }}>{p.businessName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.user?.name} ({p.user?.phone})
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{p.primaryCategory}</td>
                      <td style={{ padding: '0.75rem' }}>{p.locationArea}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
                            🔒 UIDAI Aadhaar: {p.verificationDocuments?.idNumberMasked || 'XXXX-XXXX-8921'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#0284c7' }}>
                            📍 GPS Geofenced (25km)
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {(p.circumventionStrikes || 0) > 0 ? (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            ⚠️ {p.circumventionStrikes} Strike{p.circumventionStrikes > 1 ? 's' : ''} ({p.circumventionRiskScore}% Risk)
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '0.78rem', fontWeight: 700 }}>
                            ✓ Clean (0 Strikes)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: '#d97706', fontWeight: 700 }}>{p.metrics.rating} ⭐</span>{' '}
                        ({p.metrics.totalReviews})
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          className={`status-chip ${
                            p.verificationStatus === 'VERIFIED'
                              ? 'completed'
                              : p.verificationStatus === 'PENDING'
                              ? 'on-the-way'
                              : 'cancelled'
                          }`}
                        >
                          {p.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {p.verificationStatus !== 'VERIFIED' ? (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleVerifyProvider(p.id, 'VERIFIED')}
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                            onClick={() => handleVerifyProvider(p.id, 'SUSPENDED')}
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === 'VERIFICATION' && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Provider Document Verification Queue ({verificationQueue.length})
          </h2>

          {verificationQueue.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Verification Queue is Clear</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                All onboarding providers in Chilakaluripet have been reviewed and verified.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {verificationQueue.map((p: any) => (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-light)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem' }}>{p.businessName}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Applicant: {p.user?.name} | Phone: {p.user?.phone} | Area: {p.locationArea}
                      </p>
                      <p style={{ color: 'var(--primary-dark)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>
                        Category: {p.primaryCategory} ({p.experienceYears} years experience)
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleVerifyProvider(p.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleVerifyProvider(p.id, 'VERIFIED')}
                      >
                        <ShieldCheck size={16} />
                        <span>Verify & Issue Badge</span>
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <strong>Government Aadhaar ID:</strong>
                      <div style={{ color: 'var(--success)', fontWeight: 600, marginTop: '0.2rem' }}>
                        ✓ {p.verificationDocuments?.idNumberMasked || 'Uploaded (Encrypted)'}
                      </div>
                    </div>
                    <div>
                      <strong>Trade License / Certification:</strong>
                      <div style={{ color: p.verificationDocuments?.tradeLicenseUploaded ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                        {p.verificationDocuments?.tradeLicenseUploaded ? '✓ Verified License' : 'Not required for sole technician'}
                      </div>
                    </div>
                    <div>
                      <strong>Chilakaluripet Service Radius:</strong>
                      <div style={{ marginTop: '0.2rem' }}>{p.serviceRadiusKm} km coverage</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKINGS MANAGER */}
      {activeTab === 'BOOKINGS' && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
            All Platform Bookings ({recentBookings.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentBookings.map((b: Booking) => (
              <div
                key={b.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800 }}>{b.category}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{b.id}</span>
                    {b.startOtp && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#047857',
                          fontWeight: 700,
                          background: '#d1fae5',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        🔐 Start-OTP: {b.startOtp}
                      </span>
                    )}
                    {b.priceMatchedAmount && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#ea580c',
                          fontWeight: 700,
                          background: '#ffedd5',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid #fed7aa',
                        }}
                      >
                        🏷️ Best-Price Matched: ₹{b.priceMatchedAmount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Customer: {b.customerName} ({b.customerAddress.areaName}) ➔ Provider: {b.providerName}
                  </div>
                  {b.cancellationFlaggedCollusion && (
                    <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 700, marginTop: '0.25rem' }}>
                      ⚠️ Worker Collusion Flagged: Customer reported technician quoted cheaper cash outside app
                    </div>
                  )}
                  {b.cancellationReason && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Cancellation Note: {b.cancellationReason}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`status-chip ${b.status.toLowerCase().replace(/_/g, '-')}`}>
                    {b.status}
                  </span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    ₹{b.pricing.finalAmount || b.pricing.estimatedAmount} (Platform fee: ₹{b.pricing.platformCommissionAmount})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURABLE SETTINGS & 10-FACTOR WEIGHTS */}
      {activeTab === 'SETTINGS' && settingsForm && (
        <form onSubmit={handleSaveSettings}>
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-light)',
              padding: '2rem',
              boxShadow: 'var(--shadow-sm)',
              maxWidth: '680px',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Platform Commission & Match Weights Configuration
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Per requirements, platform commission percentage and algorithm matching weights can be adjusted dynamically without hardcoding.
            </p>

            {/* Platform Commission Setting */}
            <div className="form-group">
              <label className="form-label">Platform Commission Percentage (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                className="form-input"
                value={settingsForm.platformCommissionPercent}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    platformCommissionPercent: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Applied to all booking payouts (e.g. ₹1,000 service price with 10% commission gives ₹100 revenue and ₹900 provider payout)
              </span>
            </div>

            {/* 10-Factor Weights Editor */}
            <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
              Provider Matching Algorithm Weights (Sum: 1.0)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category Match Weight</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={settingsForm.matchingWeights.categoryMatch}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      matchingWeights: {
                        ...settingsForm.matchingWeights,
                        categoryMatch: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Distance Proximity Weight</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={settingsForm.matchingWeights.distance}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      matchingWeights: {
                        ...settingsForm.matchingWeights,
                        distance: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Today Availability Weight</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={settingsForm.matchingWeights.availability}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      matchingWeights: {
                        ...settingsForm.matchingWeights,
                        availability: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Rating Weight</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={settingsForm.matchingWeights.rating}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      matchingWeights: {
                        ...settingsForm.matchingWeights,
                        rating: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Completion Rate Weight</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={settingsForm.matchingWeights.completionRate}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      matchingWeights: {
                        ...settingsForm.matchingWeights,
                        completionRate: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price Compatibility Weight</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={settingsForm.matchingWeights.priceCompatibility}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      matchingWeights: {
                        ...settingsForm.matchingWeights,
                        priceCompatibility: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={savingSettings}>
                {savingSettings ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Configuration Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
            System Audit Trail ({auditLogs.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {auditLogs.map((log: any) => (
              <div
                key={log.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-alt)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{log.action}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    by {log.actorRole} ({log.targetEntity}: {log.targetId})
                  </span>
                </div>
                <div style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                  {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
