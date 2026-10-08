import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '3rem 1.25rem 6rem 1.25rem', maxWidth: '800px' }}>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--primary)',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={16} /> Back to FixNear Home
      </Link>

      <div
        style={{
          background: 'var(--surface)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <img src="/fixnear-logo.png" alt="FixNear" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '2rem' }}>
            <span style={{ color: '#0b3b95' }}>Fix</span>
            <span style={{ color: '#00a651' }}>Near</span> Privacy & Data Policy
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          FixNear India • Privacy Commitment • Chilakaluripet, AP
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              1. Information We Collect
            </h2>
            <p>
              We collect only essential details required to coordinate local doorstep repairs: your phone number,
              first name, and service address within Chilakaluripet. We strictly do not sell, rent, or monetize personal customer data.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              2. UIDAI Aadhaar Data Security & Masking
            </h2>
            <p>
              In strict adherence to UIDAI data privacy standards, raw 12-digit Aadhaar numbers are never stored in plaintext. They are cryptographically hashed using salted SHA-256 digests for duplicate detection, and stored exclusively as masked identifiers (XXXX-XXXX-1234).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              3. Privacy of Customer Address & Doorstep OTP
            </h2>
            <p>
              Your exact doorstep address is never exposed publicly to unconfirmed parties. Only the verified provider assigned to your active booking receives the street address. Furthermore, the 4-digit Doorstep Start-OTP guarantees that service is initiated only when the technician is physically present with you.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              4. AI Voice & Query Privacy
            </h2>
            <p>
              Voice and text queries entered into our Telugu/English AI search engine are processed solely for categorizing your service need. No voice recordings or private conversations are permanently retained.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
