'use client';

import React from 'react';

export type LogoVariant =
  | 'full'
  | 'horizontal'
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
  withTelugu = false,
  withTagline = true,
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
        return { height: 26, iconSize: 22 };
      case 'sm':
        return { height: 34, iconSize: 28 };
      case 'md':
        return { height: 44, iconSize: 36 };
      case 'lg':
        return { height: 56, iconSize: 48 };
      case 'xl':
        return { height: 72, iconSize: 64 };
      default:
        return { height: 44, iconSize: 36 };
    }
  };

  const { height, iconSize } = getDimension(size);
  const isDarkBackground = variant === 'dark';

  // 1. Stacked Image Variant (Official Emblem + Wordmark + Tagline)
  if (variant === 'image') {
    return (
      <div
        className={`phiksniyar-logo-image ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        <img
          src="/phiksniyar-logo.png"
          alt="PhiksNiyar — Skilled People • Real Solutions"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
          style={{
            height: height * 1.5,
            width: 'auto',
            maxHeight: height * 2,
            objectFit: 'contain',
            display: 'block',
          }}
        />
        {withTelugu && (
          <span
            style={{
              fontFamily: "'Noto Sans Telugu', 'Gautami', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              color: isDarkBackground ? '#94A3B8' : '#102F78',
              marginTop: '4px',
            }}
          >
            (ఫిక్స్ నియర్)
          </span>
        )}
      </div>
    );
  }

  // 2. Standalone Emblem (Compact / Icon / AppIcon / Favicon)
  if (variant === 'icon' || variant === 'appIcon' || variant === 'favicon') {
    const isAppIcon = variant === 'appIcon';
    return (
      <div
        className={`phiksniyar-logo-emblem ${className}`}
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: isAppIcon ? '22%' : '8px',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isAppIcon ? '0 4px 12px rgba(16, 47, 120, 0.18)' : 'none',
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        <img
          src="/phiksniyar-emblem.png"
          alt="PhiksNiyar Emblem"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // 3. Loading Animation Variant
  if (variant === 'loading') {
    return (
      <div
        className={`phiksniyar-logo-loading ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          ...style,
        }}
        onClick={onClick}
      >
        <div
          style={{
            width: iconSize * 1.25,
            height: iconSize * 1.25,
            position: 'relative',
            animation: 'pulse 1.6s infinite ease-in-out',
          }}
        >
          <img
            src="/phiksniyar-emblem.png"
            alt="PhiksNiyar Loading"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '1rem' }}>
            <span style={{ color: '#102F78' }}>Phiks</span>
            <span style={{ color: '#0DB58A' }}>Niyar</span>
            {withTelugu && <span style={{ color: '#64748B', fontSize: '0.8rem', marginLeft: '3px' }}>(ఫిక్స్ నియర్)</span>}
          </div>
          <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Skilled People • Real Solutions
          </span>
        </div>
      </div>
    );
  }

  // 4. Provider Verified Trust Badge
  if (variant === 'badge') {
    return (
      <span
        className={`phiksniyar-provider-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '3px 9px',
          borderRadius: '9999px',
          background: 'rgba(13, 181, 138, 0.1)',
          border: '1px solid rgba(13, 181, 138, 0.25)',
          color: '#0DB58A',
          fontSize: '0.75rem',
          fontWeight: 700,
          ...style,
        }}
        onClick={onClick}
      >
        <img
          src="/phiksniyar-emblem.png"
          alt=""
          style={{ width: '14px', height: '14px', objectFit: 'contain' }}
        />
        <span>PhiksNiyar Verified</span>
      </span>
    );
  }

  // 5. Default Full / Horizontal Brand Identity Lockup
  // Uses the official horizontal asset with emblem, bold navy wordmark, and tagline
  return (
    <div
      className={`phiksniyar-logo-full ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        lineHeight: 1,
        ...style,
      }}
      onClick={onClick}
    >
      <img
        src="/phiksniyar-logo-horizontal.png"
        alt="PhiksNiyar — Skilled People • Real Solutions"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.png';
        }}
        style={{
          height: `${height}px`,
          width: 'auto',
          maxHeight: `${height}px`,
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {withTelugu && (
        <span
          style={{
            fontFamily: "'Noto Sans Telugu', 'Gautami', sans-serif",
            fontWeight: 700,
            fontSize: `${Math.round(height * 0.36)}px`,
            color: isDarkBackground ? '#CBD5E1' : '#102F78',
            alignSelf: 'center',
            marginLeft: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          (ఫిక్స్ నియర్)
        </span>
      )}
    </div>
  );
}

export const PhiksNiyarLogoComponent = PhiksNiyarLogo;
