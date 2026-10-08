import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, CheckCircle, FileText } from 'lucide-react';

export default function TermsPage() {
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
        <ArrowLeft size={16} /> Back to Sevanta Home
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
          <img src="/sevanta-logo.png" alt="Sevanta" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '2rem' }}>
            <span style={{ color: 'var(--primary)' }}>Seva</span>
            <span style={{ color: 'var(--secondary)' }}>nta</span> Terms of Service
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          Last updated: October 2026 • Chilakaluripet, Andhra Pradesh • Local help. Right when you need it.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              1. Platform Nature & Facilitator Role
            </h2>
            <p>
              Sevanta (సేవంత, formerly FixNear) is an AI-assisted hyperlocal marketplace platform connecting independent local service professionals
              (technicians, plumbers, electricians, mechanics) in Chilakaluripet, Andhra Pradesh with
              customers seeking home services. <strong>Sevanta is a technology facilitator and does not employ technicians directly.</strong> All service professionals are independent local trade vendors.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              2. Identity Verification & Trust Protection
            </h2>
            <p>
              Sevanta validates provider identity using government identity checks, trade credential audits, cryptographic identity hashing, and 25 km geofence boundary checks in Chilakaluripet. While Sevanta awards verified trust badges, customers receive 7-Day Free Rework Warranties exclusively when bookings and payments are kept on the Sevanta platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              3. Pricing, Price-Match Guarantee & Platform Commission
            </h2>
            <p>
              Visiting charges are fixed transparently by the trade professional. If a technician quotes a lower price at the doorstep, customers can use the on-app <strong>Price Match Guarantee</strong> to pay the discounted price while keeping their 7-Day Warranty and insurance protection fully active. A standard 10% platform facilitation fee applies to provider payouts.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              4. Anti-Circumvention Policy & Doorstep OTP
            </h2>
            <p>
              To ensure safety and warranty compliance, service begins only after the customer provides the 4-digit Doorstep Start-OTP to the provider. Providers soliciting off-platform cash transactions or collusion are subject to marketplace strikes, trust-score penalties, and account suspension.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              5. Local Helpdesk & Contact
            </h2>
            <p>
              For assistance in Chilakaluripet, Palnadu District: Phone: +91 8647 254999 | Email: support@sevanta.in (or support@fixnear.in)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
