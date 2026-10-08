'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Sparkles,
  User,
  Wrench,
  Shield,
  LocateFixed,
  LogIn,
  UserPlus,
  ChevronDown,
  LogOut,
  Calendar,
  Briefcase,
  Bike,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { CHILAKALURIPET_AREAS, calculateDistanceKm } from '@/lib/constants/locations';
import { UserRole, User as UserType } from '@/lib/db/types';
import { Language, translations } from '@/lib/i18n/translations';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  activeBookingCount?: number;
  currentUser?: UserType | null;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onOpenAuth: () => void;
  onOpenPersonaSwitcher: () => void;
  onOpenOnboarding: () => void;
  onGoHome: () => void;
  onLogout?: () => void;
  onOpenMyBookings?: () => void;
}

export default function Navbar({
  currentRole,
  onRoleChange,
  selectedArea,
  onAreaChange,
  activeBookingCount = 0,
  currentUser,
  currentLang,
  onLangChange,
  onOpenAuth,
  onOpenPersonaSwitcher,
  onOpenOnboarding,
  onGoHome,
  onLogout,
  onOpenMyBookings,
}: NavbarProps) {
  const [detectingGps, setDetectingGps] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = translations[currentLang];

  // Demo mode is only available in development when explicitly enabled via environment variable
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDev = process.env.NODE_ENV !== 'production';
      const envDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
      setIsDemoMode(isDev && envDemo);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real GPS Geolocation Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let closestArea = CHILAKALURIPET_AREAS[0];
        let minDistance = Infinity;

        for (const area of CHILAKALURIPET_AREAS) {
          const dist = calculateDistanceKm(latitude, longitude, area.latitude, area.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closestArea = area;
          }
        }

        onAreaChange(closestArea.name);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setDetectingGps(false);
        alert('Could not acquire GPS position. Defaulting to Kalamandir Center, Chilakaluripet.');
      },
      { timeout: 8000 }
    );
  };

  const getRoleBadgeLabel = (role: UserRole) => {
    if (role === 'ADMIN') return 'Administrator';
    if (role === 'PROVIDER') return 'Verified Pro';
    return 'Customer';
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Left: Brand Identity */}
        <div className="brand-wrapper" onClick={onGoHome} role="button" tabIndex={0}>
          <div className="brand-logo-card">
            <img
              src="/sevanta-logo.png"
              alt="Sevanta"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="brand-name">
                <span style={{ color: 'var(--primary)' }}>Seva</span>
                <span style={{ color: 'var(--secondary)' }}>nta</span>
              </span>
              {currentLang === 'te' && (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  (సేవంత)
                </span>
              )}
              <span className="brand-badge">CHILAKALURIPET</span>
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '1px',
              }}
            >
              <span>{t.brandTagline}</span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>● Live in AP</span>
            </div>
          </div>
        </div>

        {/* Center: Hyperlocal Area Selector & GPS Quick-Detect */}
        <div className="nav-location-pill desktop-only">
          <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
          <select
            className="nav-location-select"
            value={selectedArea}
            onChange={(e) => onAreaChange(e.target.value)}
            aria-label="Select location area in Chilakaluripet"
          >
            {CHILAKALURIPET_AREAS.map((area) => (
              <option key={area.id} value={area.name}>
                {area.name} (Chilakaluripet)
              </option>
            ))}
          </select>
          <button
            type="button"
            className="nav-location-gps-btn"
            onClick={handleDetectLocation}
            disabled={detectingGps}
            title="Auto-detect nearest area in Chilakaluripet via GPS"
            aria-label="Detect current location"
          >
            <LocateFixed size={14} className={detectingGps ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Right: Actions, Language Switch, Live Tracking & Account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Segmented Language Switcher */}
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${currentLang === 'en' ? 'active' : ''}`}
              onClick={() => onLangChange('en')}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              className={`segmented-btn ${currentLang === 'te' ? 'active' : ''}`}
              onClick={() => onLangChange('te')}
              title="తెలుగు భాషకు మారండి"
            >
              తెలుగు
            </button>
          </div>

          {/* Live Delivery Map Tracker Pill */}
          <Link
            href="/tracking"
            className="nav-live-badge"
            title="Interactive Delivery Map with Real-time GPS Tracker"
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 6px var(--secondary)',
              }}
            />
            <Bike size={14} color="var(--secondary)" />
            <span style={{ fontSize: '0.78rem' }}>
              {currentLang === 'te' ? 'లైవ్ మ్యాప్' : 'Live Map'}
            </span>
          </Link>

          {/* Quick Context Action: Join as Pro (if not a provider) */}
          {(!currentUser || currentUser.role !== 'PROVIDER') && (
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="btn-secondary desktop-only"
              style={{
                padding: '0.38rem 0.8rem',
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <UserPlus size={13} color="var(--secondary)" />
              <span>{t.joinAsPro}</span>
            </button>
          )}

          {/* Contextual Shortcut for Customer Bookings */}
          {currentUser && currentUser.role === 'CUSTOMER' && onOpenMyBookings && (
            <button
              type="button"
              onClick={onOpenMyBookings}
              className="btn-secondary desktop-only"
              style={{
                padding: '0.38rem 0.8rem',
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <Calendar size={13} color="var(--primary)" />
              <span>{t.myBookings}</span>
              {activeBookingCount > 0 && (
                <span
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 800,
                  }}
                >
                  {activeBookingCount}
                </span>
              )}
            </button>
          )}

          {/* Direct Workspace Switch for Providers & Admins */}
          {currentUser && currentUser.role === 'PROVIDER' && (
            <div className="desktop-only" style={{ alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => onRoleChange(currentRole === 'PROVIDER' ? 'CUSTOMER' : 'PROVIDER')}
                className="btn-secondary"
                style={{
                  padding: '0.38rem 0.8rem',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-full)',
                  borderColor: currentRole === 'PROVIDER' ? 'var(--primary)' : 'var(--border-light)',
                  background: currentRole === 'PROVIDER' ? 'var(--primary-50)' : 'var(--surface)',
                  color: currentRole === 'PROVIDER' ? 'var(--primary-dark)' : 'var(--text-secondary)',
                }}
              >
                <Wrench size={13} />
                <span>{currentRole === 'PROVIDER' ? 'Marketplace' : 'Pro Dashboard'}</span>
              </button>
            </div>
          )}

          {currentUser && currentUser.role === 'ADMIN' && (
            <div className="desktop-only" style={{ alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => onRoleChange(currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}
                className="btn-secondary"
                style={{
                  padding: '0.38rem 0.8rem',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-full)',
                  borderColor: currentRole === 'ADMIN' ? '#334155' : 'var(--border-light)',
                  background: currentRole === 'ADMIN' ? '#0f172a' : 'var(--surface)',
                  color: currentRole === 'ADMIN' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                <Shield size={13} />
                <span>{currentRole === 'ADMIN' ? 'Marketplace' : 'Admin Console'}</span>
              </button>
            </div>
          )}

          {/* User Account / Profile Popover Menu */}
          {currentUser ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.32rem 0.65rem 0.32rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Account options"
                aria-expanded={userDropdownOpen}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background:
                      currentUser.role === 'ADMIN'
                        ? '#0f172a'
                        : currentUser.role === 'PROVIDER'
                        ? '#d97706'
                        : 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentUser.name ? currentUser.name.split(' ')[0] : 'Account'}
                  </div>
                </div>
                <ChevronDown
                  size={13}
                  color="var(--text-muted)"
                  style={{
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Elevated Popover Card */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '260px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 1000,
                    padding: '0.5rem 0',
                    animation: 'modal-enter 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* User Profile Header */}
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'var(--surface-alt)',
                      margin: '-0.5rem 0 0.35rem 0',
                      borderTopLeftRadius: 'var(--radius-lg)',
                      borderTopRightRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {currentUser.phone}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background:
                            currentUser.role === 'ADMIN'
                              ? '#0f172a'
                              : currentUser.role === 'PROVIDER'
                              ? '#fef3c7'
                              : '#eff6ff',
                          color:
                            currentUser.role === 'ADMIN'
                              ? '#ffffff'
                              : currentUser.role === 'PROVIDER'
                              ? '#92400e'
                              : '#1d4ed8',
                          border:
                            currentUser.role === 'PROVIDER'
                              ? '1px solid #fde68a'
                              : currentUser.role === 'CUSTOMER'
                              ? '1px solid #bfdbfe'
                              : 'none',
                        }}
                      >
                        {getRoleBadgeLabel(currentUser.role)}
                      </span>
                    </div>
                  </div>

                  {/* Role Switcher in Menu (If Provider or Admin) */}
                  {(currentUser.role === 'PROVIDER' || currentUser.role === 'ADMIN') && (
                    <div
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Active View
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onRoleChange('CUSTOMER');
                            setUserDropdownOpen(false);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: currentRole === 'CUSTOMER' ? 700 : 500,
                            background: currentRole === 'CUSTOMER' ? 'var(--primary-50)' : 'transparent',
                            color: currentRole === 'CUSTOMER' ? 'var(--primary-dark)' : 'var(--text-secondary)',
                            border: currentRole === 'CUSTOMER' ? '1px solid var(--primary-200)' : '1px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onRoleChange(currentUser.role);
                            setUserDropdownOpen(false);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: currentRole === currentUser.role ? 700 : 500,
                            background: currentRole === currentUser.role ? 'var(--primary-50)' : 'transparent',
                            color: currentRole === currentUser.role ? 'var(--primary-dark)' : 'var(--text-secondary)',
                            border: currentRole === currentUser.role ? '1px solid var(--primary-200)' : '1px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          {currentUser.role === 'PROVIDER' ? 'Partner' : 'Admin'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions list */}
                  <div style={{ padding: '0.2rem 0' }}>
                    {currentUser.role === 'CUSTOMER' && onOpenMyBookings && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenMyBookings();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          fontSize: '0.8125rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Calendar size={15} color="var(--primary)" />
                        <span>{t.myBookings}</span>
                        {activeBookingCount > 0 && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              background: 'var(--primary)',
                              color: 'white',
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: 800,
                            }}
                          >
                            {activeBookingCount}
                          </span>
                        )}
                      </button>
                    )}

                    {currentUser.role !== 'PROVIDER' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenOnboarding();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          fontSize: '0.8125rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Briefcase size={15} color="var(--secondary)" />
                        <span>{t.joinAsPro}</span>
                      </button>
                    )}

                    {/* Developer Demo Account Switcher */}
                    {isDemoMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenPersonaSwitcher();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          fontSize: '0.8125rem',
                          color: 'var(--accent-saffron)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Sparkles size={15} color="var(--accent-saffron)" />
                        <span>Switch Demo Account</span>
                      </button>
                    )}
                  </div>

                  {/* Logout Button */}
                  {onLogout && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.25rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          fontSize: '0.8125rem',
                          color: 'var(--danger)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={15} />
                        <span>{t.logout || 'Log Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-primary"
              style={{
                padding: '0.42rem 0.95rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <LogIn size={14} />
              <span>{t.login}</span>
            </button>
          )}

          {/* Discreet Demo Switcher Pill (if unauthenticated in demo mode) */}
          {isDemoMode && !currentUser && (
            <button
              type="button"
              onClick={onOpenPersonaSwitcher}
              style={{
                padding: '0.3rem 0.6rem',
                background: 'var(--accent-saffron-light)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                color: 'var(--accent-saffron-hover)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Demo Mode: Switch test personas"
            >
              ⚡ Demo
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="nav-location-gps-btn mobile-only"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (When hamburger menu is open) */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            background: 'white',
            padding: '1rem',
            boxShadow: 'var(--shadow-md)',
            animation: 'modal-enter 0.15s ease',
          }}
        >
          {/* Mobile Location Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <MapPin size={16} color="var(--primary)" />
            <select
              value={selectedArea}
              onChange={(e) => onAreaChange(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              {CHILAKALURIPET_AREAS.map((area) => (
                <option key={area.id} value={area.name}>
                  {area.name} (Chilakaluripet)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingGps}
              style={{
                padding: '4px',
                borderRadius: '50%',
                background: 'white',
                border: '1px solid var(--border-light)',
                color: 'var(--primary)',
              }}
              title="Detect GPS location"
            >
              <LocateFixed size={14} className={detectingGps ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Mobile Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentUser && currentUser.role === 'CUSTOMER' && onOpenMyBookings && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMyBookings();
                }}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
              >
                <Calendar size={16} color="var(--primary)" />
                <span>{t.myBookings}</span>
                {activeBookingCount > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                    }}
                  >
                    {activeBookingCount}
                  </span>
                )}
              </button>
            )}

            {(!currentUser || currentUser.role !== 'PROVIDER') && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOnboarding();
                }}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
              >
                <Briefcase size={16} color="var(--secondary)" />
                <span>{t.joinAsPro}</span>
              </button>
            )}

            {currentUser && currentUser.role === 'PROVIDER' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRoleChange(currentRole === 'PROVIDER' ? 'CUSTOMER' : 'PROVIDER');
                }}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
              >
                <Wrench size={16} color="var(--primary)" />
                <span>{currentRole === 'PROVIDER' ? 'Marketplace View' : 'Partner Dashboard'}</span>
              </button>
            )}

            {currentUser && currentUser.role === 'ADMIN' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRoleChange(currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN');
                }}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
              >
                <Shield size={16} color="#0f172a" />
                <span>{currentRole === 'ADMIN' ? 'Marketplace View' : 'Admin Console'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
