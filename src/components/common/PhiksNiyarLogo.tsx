'use client';

import React from 'react';

export type LogoVariant =
  | 'full'
  | 'image'
  | 'icon'
  | 'monochrome'
  | 'dark'
  | 'light'
  | 'favicon'
  | 'appIcon'
  | 'badge'
  | 'loading';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface PhiksNiyarLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  withTelugu?: boolean;
  withTagline?: boolean;
  brandName?: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function PhiksNiyarLogo({
  variant = 'full',
  size = 'md',
  withTelugu = true,
  withTagline = false,
  className = '',
  onClick,
  style = {},
}: PhiksNiyarLogoProps) {
  // Determine pixel dimensions
  const getDimension = (sz: LogoSize): { height: number; iconSize: number } => {
    if (typeof sz === 'number') {
      return { height: sz, iconSize: sz };
    }
    switch (sz) {
      case 'xs':
        return { height: 24, iconSize: 20 };
      case 'sm':
        return { height: 32, iconSize: 26 };
      case 'md':
        return { height: 42, iconSize: 36 };
      case 'lg':
        return { height: 56, iconSize: 48 };
      case 'xl':
        return { height: 72, iconSize: 64 };
      default:
        return { height: 42, iconSize: 36 };
    }
  };

  const { height, iconSize } = getDimension(size);

  // Dedicated Image variant (renders full official brand logo asset)
  if (variant === 'image') {
    return (
      <div
        className={`phiksniyar-logo-image ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height,
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        <img
          src="/phiksniyar-logo.png"
          alt="PhiksNiyar Official Logo"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
          style={{
            height: '100%',
            width: 'auto',
            maxHeight: height,
            objectFit: 'contain',
            borderRadius: '4px',
          }}
        />
      </div>
    );
  }

  // Loading animation variant
  if (variant === 'loading') {
    return (
      <div
        className={`phiksniyar-logo-loading ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          ...style,
        }}
        onClick={onClick}
      >
        <div
          style={{
            width: iconSize,
            height: iconSize,
            position: 'relative',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        >
          <img
            src="/phiksniyar-logo.png"
            alt="PhiksNiyar Loading"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, fontSize: '0.85rem' }}>
          <span style={{ color: '#182B49' }}>Phiks</span>
          <span style={{ color: '#0F9D72' }}>Niyar</span>
          {withTelugu && <span style={{ color: '#64748B', fontSize: '0.75rem', marginLeft: '2px' }}>(ఫిక్స్ నియర్)</span>}
        </div>
      </div>
    );
  }

  // Provider badge variant
  if (variant === 'badge') {
    return (
      <span
        className={`phiksniyar-provider-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '2px 8px',
          borderRadius: '9999px',
          background: 'rgba(15, 157, 114, 0.1)',
          border: '1px solid rgba(15, 157, 114, 0.25)',
          color: '#0F9D72',
          fontSize: '0.75rem',
          fontWeight: 600,
          ...style,
        }}
        onClick={onClick}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>PhiksNiyar Verified</span>
      </span>
    );
  }

  // Icon only / AppIcon / Favicon
  if (variant === 'icon' || variant === 'appIcon' || variant === 'favicon') {
    const isAppIcon = variant === 'appIcon';
    return (
      <div
        className={`phiksniyar-logo-icon ${className}`}
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: isAppIcon ? '22%' : '8px',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isAppIcon ? '0 4px 12px rgba(24, 43, 73, 0.15)' : 'none',
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        <img
          src="/phiksniyar-logo.png"
          alt="PhiksNiyar Icon"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  // Monochrome variant
  const isMonochrome = variant === 'monochrome';
  const isDarkBackground = variant === 'dark';

  const primaryColor = isMonochrome
    ? (isDarkBackground ? '#FFFFFF' : '#111827')
    : (isDarkBackground ? '#FFFFFF' : '#182B49');

  const secondaryColor = isMonochrome
    ? (isDarkBackground ? '#E2E8F0' : '#475569')
    : '#0F9D72';

  const teluguColor = isDarkBackground ? '#94A3B8' : '#64748B';

  return (
    <div
      className={`phiksniyar-logo-full ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
      onClick={onClick}
    >
      {/* Official Circular Emblem */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          flexShrink: 0,
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: isMonochrome ? 'grayscale(100%)' : 'none',
        }}
      >
        <img
          src="/phiksniyar-logo.png"
          alt="PhiksNiyar Emblem"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Typography Stack */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', lineHeight: 1.1 }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: `${height * 0.44}px`,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: primaryColor }}>Phiks</span>
            <span style={{ color: secondaryColor }}>Niyar</span>
          </span>

          {withTelugu && (
            <span
              style={{
                fontFamily: "'Noto Sans Telugu', 'Gautami', sans-serif",
                fontWeight: 700,
                fontSize: `${height * 0.32}px`,
                color: teluguColor,
              }}
            >
              (ఫిక్స్ నియర్)
            </span>
          )}
        </div>

        {withTagline && (
          <span
            style={{
              fontSize: `${Math.max(height * 0.22, 10)}px`,
              color: isDarkBackground ? '#CBD5E1' : '#64748B',
              fontWeight: 500,
              marginTop: '2px',
              letterSpacing: '-0.01em',
            }}
          >
            Local help. Right when you need it.
          </span>
        )}
      </div>
    </div>
  );
}

export const PhiksNiyarLogoComponent = PhiksNiyarLogo;
