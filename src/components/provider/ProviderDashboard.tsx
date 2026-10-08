'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  IndianRupee,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Sparkles,
  Bot,
  Send,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Navigation,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { Booking, ProviderProfile, User } from '@/lib/db/types';

interface ProviderDashboardProps {
  currentUser?: User | null;
  onStatusUpdate: (bookingId: string, newStatus: string, finalAmount?: number, startOtpInput?: string) => Promise<void>;
  onOpenChat: (booking: Booking) => void;
  onSwitchPersona?: (userId: string) => Promise<void>;
  onOpenOnboarding?: () => void;
  onGoHome?: () => void;
}

export default function ProviderDashboard({
  currentUser,
  onStatusUpdate,
  onOpenChat,
  onSwitchPersona,
  onOpenOnboarding,
  onGoHome,
}: ProviderDashboardProps) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'JOBS' | 'AI_ASSISTANT' | 'PROFILE'>('JOBS');

  // AI Assistant state
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: 'Namaskaram! I am your FixNear Provider Assistant. Ask me about your jobs today, route navigation in Chilakaluripet, or your daily earnings.',
    },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const provRes = await fetch('/api/providers');
      const provData = await provRes.json();

      let currentProv: ProviderProfile | null = null;
      if (provData.providers && provData.providers.length > 0) {
        if (currentUser?.id) {
          currentProv = provData.providers.find((p: any) => p.userId === currentUser.id) || null;
        }
        if (!currentProv) {
          currentProv = provData.providers[0]; // fallback
        }
        setProvider(currentProv);
      }

      if (currentProv) {
        const bookRes = await fetch(`/api/bookings?role=PROVIDER&providerId=${currentProv.id}`);
        const bookData = await bookRes.json();
        if (bookData.bookings) {
          setBookings(bookData.bookings);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, currentUser?.role]);

  const handleAction = async (
    bookingId: string,
    newStatus: string,
    finalAmount?: number,
    startOtpInput?: string
  ) => {
    await onStatusUpdate(bookingId, newStatus, finalAmount, startOtpInput);
    await loadData();
  };

  const handleAskAssistant = async (queryText?: string) => {
    const q = queryText || assistantQuery;
    if (!q.trim()) return;

    const userMsg = { sender: 'user' as const, text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setAssistantQuery('');
    setAssistantLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provider?.id || 'prov-1', query: q }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: data.answer || 'Could not retrieve data.' },
      ]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Assistant service temporarily unavailable.' },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem' }}>Loading Provider Dashboard...</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Fetching leads and job dispatch for Chilakaluripet</p>
      </div>
    );
  }

  // Not signed in as Provider
  if (!currentUser || currentUser.role !== 'PROVIDER') {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', maxWidth: '580px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem 2rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Wrench size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Provider Partner Access
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            You are currently signed in as <strong>{currentUser?.name || 'Visitor'}</strong> ({currentUser?.role || 'Guest'}). Sign in as an onboarded service professional to view incoming leads, execute jobs, and manage earnings.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {onSwitchPersona && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onSwitchPersona('usr-prov-1')}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                >
                  <Wrench size={18} />
                  <span>Sign in as Ravi Kumar (RK Cool Care • AC Pro)</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onSwitchPersona('usr-prov-2')}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                >
                  <Wrench size={18} />
                  <span>Sign in as G. Venkatesh (Licensed Electrician)</span>
                </button>
              </>
            )}

            {onOpenOnboarding && (
              <button
                type="button"
                className="btn-outline"
                onClick={onOpenOnboarding}
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
              >
                Join as New Provider (Onboard Business)
              </button>
            )}

            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                ← Return to Customer Marketplace
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Provider Profile Not Found</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
          Please complete onboarding or switch to a registered provider persona.
        </p>
      </div>
    );
  }

  // Filter bookings
  const newRequests = bookings.filter((b) => b.status === 'REQUESTED');
  const activeJobs = bookings.filter(
    (b) =>
      b.status === 'ACCEPTED' ||
      b.status === 'SCHEDULED' ||
      b.status === 'PROVIDER_ON_THE_WAY' ||
      b.status === 'ARRIVED' ||
      b.status === 'IN_PROGRESS' ||
      b.status === 'PAYMENT_PENDING'
  );
  const completedJobs = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'PAID');
  const todayEarnings = completedJobs.reduce((sum, b) => sum + b.pricing.providerPayoutAmount, 0);

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem 1.25rem', maxWidth: '960px' }}>
      {/* Provider Greeting Header */}
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
            <h1 style={{ fontSize: '1.6rem' }}>Namaskaram, Ravi Kumar 👋</h1>
            {provider.verificationStatus === 'VERIFIED' ? (
              <span className="verified-badge">
                <ShieldCheck size={13} /> Verified Partner
              </span>
            ) : (
              <span className="pending-badge">Pending Verification</span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {provider.businessName} • {provider.locationArea}, Chilakaluripet
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--surface)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <button
            className={`role-btn ${activeTab === 'JOBS' ? 'active' : ''}`}
            onClick={() => setActiveTab('JOBS')}
            style={{ padding: '0.5rem 1rem' }}
          >
            Jobs & Leads ({newRequests.length + activeJobs.length})
          </button>
          <button
            className={`role-btn ${activeTab === 'AI_ASSISTANT' ? 'active' : ''}`}
            onClick={() => setActiveTab('AI_ASSISTANT')}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Bot size={15} color="var(--primary)" />
            <span>AI Assistant</span>
          </button>
          <button
            className={`role-btn ${activeTab === 'PROFILE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PROFILE')}
            style={{ padding: '0.5rem 1rem' }}
          >
            Profile & Settings
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY&apos;S NET EARNINGS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
            ₹{todayEarnings > 0 ? todayEarnings.toLocaleString('en-IN') : '1,250'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>After 10% platform share</div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>NEW REQUESTS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-saffron-hover)', marginTop: '0.2rem' }}>
            {newRequests.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Awaiting your acceptance</div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE JOBS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {activeJobs.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Scheduled & In progress</div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>RATING & RESPONSE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>
            {provider.metrics.rating} ⭐
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {provider.metrics.responseRate}% response ({provider.metrics.completedJobs} total jobs)
          </div>
        </div>
      </div>

      {/* TAB 1: JOBS & LEADS */}
      {activeTab === 'JOBS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* SECTION A: NEW INCOMING LEADS */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>New Service Requests</span>
              {newRequests.length > 0 && (
                <span style={{ fontSize: '0.75rem', background: 'var(--accent-saffron-light)', color: 'var(--accent-saffron-hover)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  Action Required
                </span>
              )}
            </h2>

            {newRequests.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No new pending requests right now. New customer leads in Chilakaluripet will appear here instantly!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {newRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '2px solid var(--accent-saffron)',
                      padding: '1.25rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                          {req.category} — {req.subcategory}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                          <MapPin size={14} color="var(--primary)" />
                          <span>{req.customerAddress.street}, {req.customerAddress.areaName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.1rem' }}>
                          <Clock size={14} />
                          <span>Preferred: <strong>{req.scheduledDate} ({req.scheduledTime})</strong></span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visiting Charge</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                          ₹{req.pricing.visitingCharges}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.85rem', padding: '0.6rem 0.85rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      <strong>Issue:</strong> {req.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleAction(req.id, 'REJECTED')}
                        style={{ color: 'var(--danger)' }}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleAction(req.id, 'ACCEPTED')}
                      >
                        Accept Lead & Confirm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: ACTIVE & IN-PROGRESS JOBS */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Active Jobs & Status Progression ({activeJobs.length})
            </h2>

            {activeJobs.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active jobs currently in progress.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeJobs.map((job) => {
                  const waPhone = job.customerPhone.replace(/\D/g, '');
                  const waText = encodeURIComponent(
                    `Hello ${job.customerName}! I am ${provider.businessName} regarding your FixNear booking #${job.id} for ${job.category}.`
                  );
                  const whatsAppUrl = `https://wa.me/${waPhone}?text=${waText}`;

                  return (
                    <div
                      key={job.id}
                      style={{
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                              {job.category}
                            </span>
                            <span className={`status-chip ${job.status.toLowerCase().replace(/_/g, '-')}`}>
                              {job.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                            Customer: <strong>{job.customerName}</strong> ({job.customerPhone})
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Address: {job.customerAddress.street}, {job.customerAddress.areaName}, Chilakaluripet
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Payout</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                            ₹{job.pricing.providerPayoutAmount}
                          </div>
                        </div>
                      </div>

                      {/* State Transition Actions */}
                      <div
                        style={{
                          marginTop: '1.25rem',
                          paddingTop: '0.85rem',
                          borderTop: '1px solid var(--border-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onOpenChat(job)}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          >
                            <MessageSquare size={14} color="var(--primary)" />
                            <span>In-App Chat</span>
                          </button>
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: '#16a34a' }}
                          >
                            <span>WhatsApp</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {job.status === 'ACCEPTED' && (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleAction(job.id, 'PROVIDER_ON_THE_WAY')}
                            >
                              <Navigation size={14} />
                              <span>Mark On The Way</span>
                            </button>
                          )}

                          {job.status === 'PROVIDER_ON_THE_WAY' && (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleAction(job.id, 'ARRIVED')}
                            >
                              <MapPin size={14} />
                              <span>Mark Arrived at Doorstep</span>
                            </button>
                          )}

                          {job.status === 'ARRIVED' && (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => {
                                if (job.startOtp) {
                                  const otp = prompt(
                                    `🔐 DOORSTEP SECURITY VERIFICATION\n\nPlease enter the 4-digit Start-OTP shown on ${job.customerName}'s phone to verify doorstep arrival and unlock service warranty:`
                                  );
                                  if (!otp) return;
                                  handleAction(job.id, 'IN_PROGRESS', undefined, otp.trim());
                                } else {
                                  handleAction(job.id, 'IN_PROGRESS');
                                }
                              }}
                            >
                              <Wrench size={14} />
                              <span>Verify OTP & Start Job</span>
                            </button>
                          )}

                          {job.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ background: 'var(--accent-saffron-hover)' }}
                              onClick={() => {
                                const amountStr = prompt(
                                  'Enter final invoice amount for customer (₹):',
                                  String(job.pricing.visitingCharges + 250)
                                );
                                if (amountStr) {
                                  handleAction(job.id, 'PAYMENT_PENDING', parseFloat(amountStr));
                                }
                              }}
                            >
                              <IndianRupee size={14} />
                              <span>Work Done - Generate Bill</span>
                            </button>
                          )}

                          {job.status === 'PAYMENT_PENDING' && (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleAction(job.id, 'COMPLETED')}
                            >
                              <CheckCircle2 size={14} />
                              <span>Confirm Payment Received & Complete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI PROVIDER ASSISTANT */}
      {activeTab === 'AI_ASSISTANT' && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', background: 'var(--surface-alt)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>AI Operations Assistant</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Grounded strictly in your live bookings, earnings, and Chilakaluripet customer requests
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ padding: '1.5rem', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '0.85rem 1.15rem',
                  borderRadius: 'var(--radius-lg)',
                  background: msg.sender === 'user' ? 'var(--primary)' : 'var(--surface-alt)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                }}
              >
                {msg.text}
              </div>
            ))}
            {assistantLoading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Assistant analyzing your data...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Suggestions */}
          <div style={{ padding: '0.75rem 1.5rem', background: '#fafbfc', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleAskAssistant('What jobs do I have today?')}
            >
              📅 What jobs do I have today?
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleAskAssistant('Which customer should I visit first?')}
            >
              🗺️ Which customer should I visit first?
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleAskAssistant('How much did I earn this week?')}
            >
              💰 How much did I earn?
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleAskAssistant('What services are getting the most requests in Chilakaluripet?')}
            >
              📈 What services are in top demand?
            </button>
          </div>

          {/* Chat Input */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="form-input"
              value={assistantQuery}
              onChange={(e) => setAssistantQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
              placeholder="Ask anything about your schedule, route, or earnings..."
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleAskAssistant()}
              disabled={assistantLoading || !assistantQuery.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE & SETTINGS */}
      {activeTab === 'PROFILE' && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Provider Profile Details</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Business Name</label>
              <input type="text" className="form-input" value={provider.businessName} readOnly />
            </div>

            <div>
              <label className="form-label">Primary Service Category</label>
              <input type="text" className="form-input" value={provider.primaryCategory} readOnly />
            </div>

            <div>
              <label className="form-label">Service Radius</label>
              <input type="text" className="form-input" value={`${provider.serviceRadiusKm} km around Chilakaluripet`} readOnly />
            </div>

            <div>
              <label className="form-label">Visiting / Inspection Charge</label>
              <input type="text" className="form-input" value={`₹${provider.pricingModel.visitingCharge}`} readOnly />
            </div>

            <div>
              <label className="form-label">Working Hours</label>
              <input
                type="text"
                className="form-input"
                value={`${provider.workingHours.startTime} - ${provider.workingHours.endTime} (${provider.workingHours.days.slice(0, 3).join(', ')}...)`}
                readOnly
              />
            </div>

            <div>
              <label className="form-label">Aadhaar & Verification Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <ShieldCheck size={18} color="var(--success)" />
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                  Aadhaar Verified ({provider.verificationDocuments.idNumberMasked})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
