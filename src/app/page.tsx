'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroAIInput from '@/components/customer/HeroAIInput';
import RequestConfirmModal from '@/components/customer/RequestConfirmModal';
import CategoryGrid from '@/components/customer/CategoryGrid';
import ProviderCard from '@/components/customer/ProviderCard';
import BookingModal from '@/components/customer/BookingModal';
import ActiveBookings from '@/components/customer/ActiveBookings';
import PaymentModal from '@/components/customer/PaymentModal';
import ReviewModal from '@/components/customer/ReviewModal';
import ReviewsDrawerModal from '@/components/customer/ReviewsDrawerModal';
import ProviderDashboard from '@/components/provider/ProviderDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AuthModal from '@/components/auth/AuthModal';
import ProviderOnboardingModal from '@/components/provider/ProviderOnboardingModal';
import BookingChatModal from '@/components/chat/BookingChatModal';
import PersonaSwitcherModal from '@/components/auth/PersonaSwitcherModal';
import {
  UserRole,
  AIUnderstoodRequest,
  ProviderMatchResult,
  Booking,
  ServiceCategory,
  Review,
  User,
  ProviderProfile,
} from '@/lib/db/types';
import {
  Sparkles,
  Shield,
  User as UserIcon,
  Wrench,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Clock,
  IndianRupee,
  CheckCircle,
} from 'lucide-react';
import { Language, translations } from '@/lib/i18n/translations';
import Link from 'next/link';

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CUSTOMER');
  const [selectedArea, setSelectedArea] = useState<string>('Kalamandir Center');
  const [customerTab, setCustomerTab] = useState<'DISCOVER' | 'MY_BOOKINGS'>('DISCOVER');
  const [currentLang, setCurrentLang] = useState<Language>('te');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = (localStorage.getItem('fixnear_lang') || localStorage.getItem('manaseva_lang')) as Language;
      if (savedLang === 'en' || savedLang === 'te') {
        setCurrentLang(savedLang);
      }
    }
  }, []);

  const handleLangChange = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fixnear_lang', lang);
    }
  };

  const t = translations[currentLang];

  // Authenticated User
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Chat
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  // AI & Search states
  const [aiLoading, setAiLoading] = useState(false);
  const [parsedRequest, setParsedRequest] = useState<AIUnderstoodRequest | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Matching & Results
  const [matches, setMatches] = useState<ProviderMatchResult[]>([]);
  const [searchCategory, setSearchCategory] = useState<string>('AC Repair & Service');

  // Modals
  const [selectedMatchForBooking, setSelectedMatchForBooking] = useState<ProviderMatchResult | null>(null);
  const [selectedMatchForReviews, setSelectedMatchForReviews] = useState<ProviderMatchResult | null>(null);
  const [matchReviews, setMatchReviews] = useState<Review[]>([]);

  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  // Bookings list
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check auth session on load
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setCurrentRole(data.user.role);
        if (data.user.role === 'CUSTOMER') {
          await loadCustomerBookings();
        }
      } else {
        setCurrentUser(null);
        setCurrentRole('CUSTOMER');
      }
    } catch (e) {
      console.warn('Auth check skipped:', e);
      setCurrentUser(null);
      setCurrentRole('CUSTOMER');
    }
  };

  // Handle switching persona (Customer, Provider, Admin)
  const handleSelectPersona = async (userId: string, notify = true) => {
    try {
      const res = await fetch('/api/auth/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setCurrentRole(data.user.role);
        setShowPersonaModal(false);
        if (notify) showToast(`Authenticated as ${data.user.name} (${data.user.role})`);
        if (data.user.role === 'CUSTOMER') {
          await loadCustomerBookings();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    // If the authenticated user already holds the role or wants customer marketplace
    if (newRole === 'CUSTOMER') {
      setCurrentRole('CUSTOMER');
      return;
    }

    if (newRole === 'ADMIN') {
      if (currentUser?.role === 'ADMIN') {
        setCurrentRole('ADMIN');
      } else {
        const isDemo = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('demo') || process.env.NEXT_PUBLIC_DEMO_MODE === 'true');
        if (isDemo) {
          await handleSelectPersona('usr-admin-1');
        } else {
          showToast('Admin authentication required');
          setShowAuthModal(true);
        }
      }
      return;
    }

    if (newRole === 'PROVIDER') {
      if (currentUser?.role === 'PROVIDER') {
        setCurrentRole('PROVIDER');
      } else {
        const isDemo = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('demo') || process.env.NEXT_PUBLIC_DEMO_MODE === 'true');
        if (isDemo) {
          await handleSelectPersona('usr-prov-1');
        } else {
          setShowOnboardingModal(true);
        }
      }
      return;
    }

    setCurrentRole(newRole);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setCurrentRole('CUSTOMER');
      setCustomerBookings([]);
      setShowPersonaModal(false);
      showToast('Logged out successfully');
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch customer bookings for authenticated session
  const loadCustomerBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const json = await res.json();
        if (json.bookings) {
          setCustomerBookings(json.bookings);
        }
      } else {
        setCustomerBookings([]);
      }
    } catch (e) {
      console.error(e);
      setCustomerBookings([]);
    }
  };

  const loadDefaultProviders = async (categoryName = 'AC Repair & Service') => {
    try {
      const res = await fetch(
        `/api/providers?category=${encodeURIComponent(categoryName)}&area=${encodeURIComponent(
          selectedArea
        )}`
      );
      const json = await res.json();
      if (json.matches) {
        setMatches(json.matches);
        setSearchCategory(categoryName);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAuth();
    loadDefaultProviders();
  }, [selectedArea]);

  // AI Natural Language Search handler
  const handleAISearch = async (queryText: string) => {
    try {
      setAiLoading(true);
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: queryText }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setParsedRequest(json.data);
        setShowConfirmModal(true);
      } else {
        showToast('Could not analyze request. Please try again or select a category below.');
      }
    } catch (e) {
      console.error(e);
      showToast('AI analysis failed. Please check network connection.');
    } finally {
      setAiLoading(false);
    }
  };

  // When customer confirms parsed request
  const handleConfirmRequest = async (confirmedData: AIUnderstoodRequest) => {
    setShowConfirmModal(false);
    setParsedRequest(confirmedData);
    setSearchCategory(confirmedData.category);

    try {
      setAiLoading(true);
      const res = await fetch(
        `/api/providers?category=${encodeURIComponent(
          confirmedData.category
        )}&subcategory=${encodeURIComponent(
          confirmedData.subcategory
        )}&area=${encodeURIComponent(selectedArea)}&urgency=${confirmedData.urgency}`
      );
      const json = await res.json();
      if (json.matches) {
        setMatches(json.matches);
        const el = document.getElementById('provider-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // Direct category selection from grid
  const handleCategorySelect = (cat: ServiceCategory) => {
    setParsedRequest({
      category: cat.name,
      subcategory: cat.subcategories[0] || 'Standard Service',
      issue: `Customer looking for ${cat.name} in ${selectedArea}`,
      rawInput: cat.name,
      detectedLanguage: 'en',
      preferredDate: 'Today',
      preferredTime: 'Flexible',
      urgency: 'normal',
      estimatedCostRange: { min: cat.basePriceEstimate, max: cat.basePriceEstimate * 2.5 },
    });
    loadDefaultProviders(cat.name);
    const el = document.getElementById('provider-results-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Booking creation
  const handleConfirmBooking = async (payload: any) => {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      showToast('Booking request sent to provider! Live status updated.');
      await loadCustomerBookings();
      setCustomerTab('MY_BOOKINGS');
    } else {
      throw new Error(json.error || 'Booking failed');
    }
  };

  // Booking cancellation
  // Booking cancellation with collusion detection & penalty
  const handleCancelBooking = async (bookingId: string, reason?: string, isCollusion?: boolean) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: 'CANCELLED',
          actorRole: 'CUSTOMER',
          cancellationReason: reason || 'Cancelled by customer',
          isCollusion: Boolean(isCollusion),
          note: reason || 'Cancelled by customer',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          isCollusion
            ? currentLang === 'te'
              ? 'బుకింగ్ రద్దు చేయబడింది. వర్కర్ తక్కువ ధర ప్రవర్తనపై సెక్యూరిటీ స్ట్రైక్ నమోదు చేయబడింది.'
              : 'Booking cancelled. Offline collusion strike registered against provider.'
            : currentLang === 'te'
            ? 'బుకింగ్ రద్దు చేయబడింది.'
            : 'Booking cancelled.'
        );
        await loadCustomerBookings();
      } else {
        alert(json.error || 'Failed to cancel booking');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Best-Price Guarantee: On-Platform Price Matching
  const handlePriceMatch = async (bookingId: string, matchedAmount: number) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          priceMatchedAmount: matchedAmount,
          actorRole: 'CUSTOMER',
          note: `Customer price matched to ₹${matchedAmount} on app under FixNear Protection`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          currentLang === 'te'
            ? `బిల్లు ₹${matchedAmount} కి మార్చబడింది! మీ 7 రోజుల ఉచిత వారంటీ యాక్టివ్‌గా ఉంది.`
            : `Bill matched to ₹${matchedAmount}! FixNear 7-Day Warranty kept 100% active.`
        );
        await loadCustomerBookings();
      } else {
        alert(json.error || 'Price match update failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while matching price');
    }
  };

  // Payment execution
  const handlePaymentSuccess = async (bookingId: string, method: string) => {
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        status: 'PAID',
        actorRole: 'CUSTOMER',
        paymentMethod: method,
      }),
    });
    const json = await res.json();
    if (json.success) {
      showToast('Payment successful! Booking marked PAID.');
      await loadCustomerBookings();
    }
  };

  // Review submission
  const handleSubmitReview = async (reviewPayload: any) => {
    const res = await fetch('/api/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload),
    });
    const json = await res.json();
    if (json.success) {
      showToast('Thank you! Your verified review has been published.');
      await loadCustomerBookings();
      await loadDefaultProviders(searchCategory || undefined);
    } else {
      throw new Error(json.error || 'Failed to submit review');
    }
  };

  // Provider status update (for provider view) with Doorstep Start-OTP verification
  const handleProviderStatusUpdate = async (
    bookingId: string,
    newStatus: string,
    finalAmount?: number,
    startOtpInput?: string
  ) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: newStatus,
          actorRole: 'PROVIDER',
          finalAmount,
          startOtpInput,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Status updated to ${newStatus}`);
        await loadCustomerBookings();
      } else {
        alert(json.error || `Could not update status to ${newStatus}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error while updating status');
    }
  };

  // View reviews of provider
  const handleViewReviews = (match: ProviderMatchResult) => {
    setSelectedMatchForReviews(match);
    fetch(`/api/providers`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.providers?.find((p: any) => p.id === match.provider.id);
        setMatchReviews(found?.reviews || []);
      });
  };

  // New Provider Onboarding Success
  const handleOnboardingSuccess = (newProvider: ProviderProfile) => {
    showToast(`Welcome ${newProvider.businessName}! Profile submitted for admin verification.`);
    loadDefaultProviders();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: 'var(--text-primary)',
            color: 'white',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 9999,
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderLeft: '4px solid var(--primary)',
            animation: 'modal-enter 0.2s ease',
          }}
        >
          <Sparkles size={16} color="var(--primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Activity Ticker Ribbon */}
      <div className="live-ticker-ribbon">
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="live-ticker-badge">
              <span className="live-pulse-dot" />
              <span>{t.liveBadge}</span>
            </span>
            <span style={{ fontWeight: 700 }}>{t.activeProsCount}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.75rem',
              color: '#d1fae5',
            }}
          >
            <span>🛡️ {t.trustAadhaarTitle}</span>
            <span>⚡ {t.trustArrivalTitle}</span>
            <span>🏷️ {t.trustPriceTitle}</span>
          </div>
        </div>
      </div>

      {/* Global Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        selectedArea={selectedArea}
        onAreaChange={setSelectedArea}
        activeBookingCount={customerBookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length}
        currentUser={currentUser}
        currentLang={currentLang}
        onLangChange={handleLangChange}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenPersonaSwitcher={() => setShowPersonaModal(true)}
        onOpenOnboarding={() => setShowOnboardingModal(true)}
        onLogout={handleLogout}
        onOpenMyBookings={() => {
          setCurrentRole('CUSTOMER');
          setCustomerTab('MY_BOOKINGS');
        }}
        onGoHome={() => {
          setCurrentRole('CUSTOMER');
          setCustomerTab('DISCOVER');
        }}
      />

      {/* ROLE 1: CUSTOMER VIEW */}
      {currentRole === 'CUSTOMER' && (
        <main style={{ flex: 1 }}>
          {/* Sub Navigation Bar for Customer */}
          <div
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border-light)',
              padding: '0.6rem 0',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              className="container"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--surface-alt)',
                  padding: '3px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-light)',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  className={`segmented-btn ${customerTab === 'DISCOVER' ? 'active' : ''}`}
                  onClick={() => setCustomerTab('DISCOVER')}
                  style={{ padding: '0.35rem 0.95rem', fontSize: '0.8125rem' }}
                >
                  {t.discoverAndBook}
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${customerTab === 'MY_BOOKINGS' ? 'active' : ''}`}
                  onClick={() => setCustomerTab('MY_BOOKINGS')}
                  style={{
                    padding: '0.35rem 0.95rem',
                    fontSize: '0.8125rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{t.myBookings}</span>
                  {customerBookings.length > 0 && (
                    <span
                      style={{
                        background: customerTab === 'MY_BOOKINGS' ? 'var(--primary)' : 'var(--text-muted)',
                        color: 'white',
                        fontSize: '0.6875rem',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                      }}
                    >
                      {customerBookings.length}
                    </span>
                  )}
                </button>
              </div>

              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: currentUser ? 'var(--success)' : 'var(--border-medium)',
                  }}
                />
                <span>
                  {currentUser
                    ? `${currentLang === 'te' ? 'లాగిన్ అయ్యారు: ' : 'Signed in: '} ${currentUser.name}`
                    : (currentLang === 'te' ? 'గెస్ట్ మోడ్' : 'Guest Browsing')}
                </span>
                {currentUser?.phone && (
                  <span style={{ color: 'var(--text-subtle)' }}>({currentUser.phone})</span>
                )}
              </div>
            </div>
          </div>

          {customerTab === 'DISCOVER' ? (
            <>
              {/* 30-Min Emergency SOS Banner */}
              <div className="container">
                <div className="emergency-sos-banner">
                  <div>
                    <div className="emergency-sos-title">
                      <AlertTriangle size={18} color="#dc2626" />
                      <span>{t.emergencyTitle}</span>
                    </div>
                    <p className="emergency-sos-desc">{t.emergencySubtitle}</p>
                  </div>
                  <button
                    type="button"
                    className="emergency-sos-btn"
                    onClick={() =>
                      handleAISearch(
                        currentLang === 'te'
                          ? 'అత్యవసర రిపేర్ కావాలి, త్వరగా రండి'
                          : 'Emergency repair needed urgently'
                      )
                    }
                  >
                    <Zap size={16} />
                    <span>{t.emergencyAction}</span>
                  </button>
                </div>
              </div>

              {/* Hero AI Input */}
              <HeroAIInput
                onSearch={handleAISearch}
                isLoading={aiLoading}
                selectedArea={selectedArea}
                currentLang={currentLang}
              />

              {/* 4-Pillar Trust Guarantee Section */}
              <section className="trust-guarantee-section">
                <div className="container">
                  <div className="trust-grid">
                    <div className="trust-card">
                      <div className="trust-icon-box">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <div className="trust-title">{t.trustAadhaarTitle}</div>
                        <div className="trust-desc">{t.trustAadhaarDesc}</div>
                      </div>
                    </div>

                    <div className="trust-card">
                      <div className="trust-icon-box">
                        <Clock size={22} />
                      </div>
                      <div>
                        <div className="trust-title">{t.trustArrivalTitle}</div>
                        <div className="trust-desc">{t.trustArrivalDesc}</div>
                      </div>
                    </div>

                    <div className="trust-card">
                      <div className="trust-icon-box">
                        <IndianRupee size={22} />
                      </div>
                      <div>
                        <div className="trust-title">{t.trustPriceTitle}</div>
                        <div className="trust-desc">{t.trustPriceDesc}</div>
                      </div>
                    </div>

                    <div className="trust-card">
                      <div className="trust-icon-box">
                        <CheckCircle size={22} />
                      </div>
                      <div>
                        <div className="trust-title">{t.trustGuaranteeTitle}</div>
                        <div className="trust-desc">{t.trustGuaranteeDesc}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Category Grid */}
              <CategoryGrid onSelectCategory={handleCategorySelect} currentLang={currentLang} />

              {/* Provider Matches Section */}
              <section id="provider-results-section" style={{ padding: '2rem 0 4rem 0' }}>
                <div className="container">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                          {currentLang === 'te'
                            ? `${searchCategory || 'మీకు'} దగ్గరలోని వెరిఫైడ్ టెక్నీషియన్లు`
                            : `Matched Providers for ${searchCategory || 'You'}`}
                        </h2>
                        <span
                          style={{
                            background: 'var(--primary-50)',
                            color: 'var(--primary-dark)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid var(--primary-200)',
                          }}
                        >
                          {currentLang === 'te' ? '10-ఫ్యాక్టర్ AI ర్యాంకింగ్' : '10-Factor AI Ranked'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                        {currentLang === 'te'
                          ? `${selectedArea}, చిలకలూరిపేటలో సర్వీస్ అందించే నిపుణులు`
                          : `Showing verified technicians serving ${selectedArea}, Chilakaluripet`}
                      </p>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {currentLang === 'te' ? (
                        <span>క్రమబద్ధీకరణ: <strong>అల్గారిథమ్ మ్యాచ్ స్కోర్</strong> (సామీప్యత + లభ్యత + రేటింగ్)</span>
                      ) : (
                        <span>Sorted by: <strong>Algorithm Match Score</strong> (Proximity + Availability + Rating)</span>
                      )}
                    </div>
                  </div>

                  {matches.length === 0 ? (
                    <div
                      style={{
                        padding: '3rem 1.5rem',
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius-xl)',
                        textAlign: 'center',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
                        {currentLang === 'te'
                          ? `${selectedArea}లో ${searchCategory ? `"${searchCategory}" కోసం ` : ''}ప్రొవైడర్లు లభించలేదు`
                          : `No providers found${searchCategory ? ` for "${searchCategory}"` : ''} in ${selectedArea}`}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {currentLang === 'te'
                          ? 'మరొక సర్వీస్ కేటగిరీని ఎంచుకోండి లేదా ఏరియాను మార్చండి.'
                          : 'Try another service category or expand your search area.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {matches.map((match) => (
                        <ProviderCard
                          key={match.provider.id}
                          match={match}
                          currentLang={currentLang}
                          onBook={(m) => {
                            if (!currentUser) {
                              showToast(
                                currentLang === 'te'
                                  ? 'దయచేసి బుకింగ్ చేయడానికి లాగిన్ అవ్వండి'
                                  : 'Please sign in to book your local service provider'
                              );
                              setShowAuthModal(true);
                              return;
                            }
                            setSelectedMatchForBooking(m);
                          }}
                          onViewReviews={(m) => handleViewReviews(m)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            /* My Bookings Tab */
            <div className="container">
              <ActiveBookings
                currentUser={currentUser}
                bookings={customerBookings}
                currentLang={currentLang}
                onOpenPayment={(b) => setPaymentBooking(b)}
                onOpenReview={(b) => setReviewBooking(b)}
                onOpenChat={(b) => setChatBooking(b)}
                onCancelBooking={handleCancelBooking}
                onPriceMatch={handlePriceMatch}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            </div>
          )}
        </main>
      )}

      {/* ROLE 2: PROVIDER VIEW */}
      {currentRole === 'PROVIDER' && (
        <main style={{ flex: 1 }}>
          <ProviderDashboard
            currentUser={currentUser}
            onStatusUpdate={handleProviderStatusUpdate}
            onOpenChat={(b) => setChatBooking(b)}
            onSwitchPersona={handleSelectPersona}
            onOpenOnboarding={() => setShowOnboardingModal(true)}
            onGoHome={() => {
              setCurrentRole('CUSTOMER');
              setCustomerTab('DISCOVER');
            }}
          />
        </main>
      )}

      {/* ROLE 3: ADMIN VIEW */}
      {currentRole === 'ADMIN' && (
        <main style={{ flex: 1 }}>
          <AdminDashboard
            currentUser={currentUser}
            onAuthenticateAdmin={() => handleSelectPersona('usr-admin-1')}
            onGoHome={() => {
              setCurrentRole('CUSTOMER');
              setCustomerTab('DISCOVER');
            }}
          />
        </main>
      )}

      {/* MODALS */}
      {/* 1. Request Confirm Modal */}
      {showConfirmModal && parsedRequest && (
        <RequestConfirmModal
          requestData={parsedRequest}
          onConfirm={(req) => {
            if (!currentUser) {
              showToast('Please sign in with your phone to match providers');
              setShowAuthModal(true);
              return;
            }
            handleConfirmRequest(req);
          }}
          onClose={() => setShowConfirmModal(false)}
        />
      )}

      {/* 2. Booking Modal */}
      {selectedMatchForBooking && (
        <BookingModal
          match={selectedMatchForBooking}
          initialRequest={parsedRequest}
          selectedArea={selectedArea}
          currentUser={currentUser}
          currentLang={currentLang}
          onConfirmBooking={handleConfirmBooking}
          onClose={() => setSelectedMatchForBooking(null)}
        />
      )}

      {/* 3. Payment Modal */}
      {paymentBooking && (
        <PaymentModal
          booking={paymentBooking}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setPaymentBooking(null)}
        />
      )}

      {/* 4. Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onSubmitReview={handleSubmitReview}
          onClose={() => setReviewBooking(null)}
        />
      )}

      {/* 5. Reviews Drawer Modal */}
      {selectedMatchForReviews && (
        <ReviewsDrawerModal
          match={selectedMatchForReviews}
          reviews={matchReviews}
          onClose={() => setSelectedMatchForReviews(null)}
        />
      )}

      {/* 6. Phone OTP Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialRole={currentRole}
          onSuccess={(user) => {
            setCurrentUser(user);
            showToast(`Welcome back, ${user.name}!`);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* 7. Persona Switcher Modal */}
      {showPersonaModal && (
        <PersonaSwitcherModal
          currentUser={currentUser}
          onSelectPersona={handleSelectPersona}
          onOpenPhoneAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          onClose={() => setShowPersonaModal(false)}
        />
      )}

      {/* 8. Provider Onboarding Wizard Modal */}
      {showOnboardingModal && (
        <ProviderOnboardingModal
          onSuccess={handleOnboardingSuccess}
          onClose={() => setShowOnboardingModal(false)}
        />
      )}

      {/* 9. Booking Live Chat Modal */}
      {chatBooking && (
        <BookingChatModal
          booking={chatBooking}
          currentUserRole={currentRole}
          currentUserId={currentUser?.id || (currentRole === 'PROVIDER' ? chatBooking.providerId : chatBooking.customerId)}
          onClose={() => setChatBooking(null)}
        />
      )}

      {/* Footer */}
      <footer
        style={{
          background: 'white',
          borderTop: '1px solid var(--border-light)',
          padding: '2.5rem 0',
          marginTop: 'auto',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="brand-logo-card" style={{ width: '38px', height: '38px' }}>
                  <img
                    src="/fixnear-logo.png"
                    alt="FixNear"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '1.25rem' }}>
                  <span>
                    <span style={{ color: 'var(--primary)' }}>Fix</span>
                    <span style={{ color: 'var(--secondary)' }}>Near</span>
                  </span>
                  <span style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>(ఫిక్స్‌నియర్)</span>
                  <span className="brand-badge">CHILAKALURIPET</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.4rem', maxWidth: '540px', lineHeight: 1.4 }}>
                {t.footerDesc}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontWeight: 600 }}>
              <Link href="/terms" style={{ color: 'var(--text-secondary)' }}>
                {t.termsLink}
              </Link>
              <Link href="/privacy" style={{ color: 'var(--text-secondary)' }}>
                {t.privacyLink}
              </Link>
              <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>
                {t.helpdeskLabel}: +91 8647 254999
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ maxWidth: '650px', lineHeight: 1.4 }}>
              {t.complianceNotice}
            </div>
            <div>© {new Date().getFullYear()} FixNear (ఫిక్స్‌నియర్) Technologies. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
