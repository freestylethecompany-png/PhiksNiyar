'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isApp =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isApp);

      // Register Service Worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
              console.log('PhiksNiyar PWA: Service Worker registered with scope:', reg.scope);
            })
            .catch((err) => {
              console.warn('PhiksNiyar PWA: Service Worker registration failed:', err);
            });
        });
      }

      // Capture install prompt event
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Only show prompt banner if not dismissed previously in this session
        const dismissed = sessionStorage.getItem('phiksniyar_pwa_dismissed');
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('Error during PWA installation:', err);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('phiksniyar_pwa_dismissed', 'true');
  };

  if (!showInstallBanner || isStandalone) {
    return null;
  }

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        width: 'calc(100% - 32px)',
        maxWidth: '440px',
        background: '#182B49',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '0.85rem 1.15rem',
        boxShadow: '0 12px 32px rgba(24, 43, 73, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        animation: 'modal-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <img
          src="/phiksniyar-emblem.png"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
          alt="PhiksNiyar App Icon"
          style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain' }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
            Install PhiksNiyar App
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Fast access on phone or PC (ఫిక్స్ నియర్ యాప్)
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            background: '#0F9D72',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Download size={13} />
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
