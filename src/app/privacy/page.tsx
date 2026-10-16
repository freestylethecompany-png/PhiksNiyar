import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import PhiksNiyarLogo from '@/components/common/PhiksNiyarLogo';

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
        <ArrowLeft size={16} /> Back to PhiksNiyar Home
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <PhiksNiyarLogo variant="full" size="md" withTagline={false} />
          <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
            Privacy & Data Policy
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          PhiksNiyar India • DPDP Act 2023 Privacy Commitment • Chilakaluripet, AP
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

          <section id="account-deletion">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              5. Account Deletion & User Data Rights (Google Play Policy & DPDP Act 2023)
            </h2>
            <p>
              PhiksNiyar provides users with complete autonomy over their data. You may request the permanent deletion of your account and all associated personal identifiers at any time:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
              <li>
                <strong>In-App Deletion:</strong> Tap your profile avatar in the navigation bar, select <em>Account Settings</em>, and click <em>Delete Account</em>.
              </li>
              <li>
                <strong>Web Deletion Request:</strong> If you uninstalled the mobile app, you can request account deletion by emailing <a href="mailto:support@phiksniyar.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>support@phiksniyar.com</a> with your registered mobile number, or by logging into the PhiksNiyar web portal.
              </li>
            </ul>
            <p>
              <strong>Data Deletion Scope:</strong> Upon confirmation, your customer profile, saved addresses, authentication credentials, and active sessions are permanently erased from our production databases. Completed invoice records are stripped of all personal names and street addresses into an anonymized ledger to comply with Indian GST and financial statutory auditing obligations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
