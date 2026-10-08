'use client';

import React from 'react';
import { User, Wrench, Shield, Check, LogOut, Smartphone, X } from 'lucide-react';
import { User as UserType } from '@/lib/db/types';

interface PersonaSwitcherModalProps {
  currentUser: UserType | null;
  onSelectPersona: (userId: string) => Promise<void>;
  onOpenPhoneAuth: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export default function PersonaSwitcherModal({
  currentUser,
  onSelectPersona,
  onOpenPhoneAuth,
  onLogout,
  onClose,
}: PersonaSwitcherModalProps) {
  const personas = [
    {
      id: 'usr-cust-1',
      name: 'Suresh Babu',
      role: 'CUSTOMER',
      phone: '+91 98480 12345',
      desc: 'Customer • Kalamandir Center, Chilakaluripet',
      icon: <User size={18} color="var(--primary)" />,
    },
    {
      id: 'usr-prov-1',
      name: 'Ravi Kumar',
      role: 'PROVIDER',
      phone: '+91 94401 56789',
      desc: 'AC Pro (RK Cool Care) • Pandaripuram',
      icon: <Wrench size={18} color="#d97706" />,
    },
    {
      id: 'usr-prov-2',
      name: 'G. Venkatesh',
      role: 'PROVIDER',
      phone: '+91 98492 34567',
      desc: 'Licensed Electrician • Clock Tower Center',
      icon: <Wrench size={18} color="#0284c7" />,
    },
    {
      id: 'usr-admin-1',
      name: 'Sevanta Admin',
      role: 'ADMIN',
      phone: '+91 90000 00001',
      desc: 'Platform Administrator • Full Governance',
      icon: <Shield size={18} color="var(--text-primary)" />,
    },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Switch Authenticated Persona</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Test all authenticated marketplace workflows with 1 click
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Current User Pill */}
          {currentUser && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--primary-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-200)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  CURRENT ACTIVE SESSION
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {currentUser.phone} • Role: <strong>{currentUser.role}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.78rem',
                  color: 'var(--danger)',
                  fontWeight: 700,
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'white',
                  border: '1px solid var(--border-light)',
                }}
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Persona List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {personas.map((p) => {
              const isSelected = currentUser?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPersona(p.id);
                    onClose();
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    background: isSelected ? 'var(--surface-alt)' : 'white',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.desc}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ color: 'var(--primary)' }}>
                      <Check size={18} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Or Phone OTP */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPhoneAuth();
              }}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Smartphone size={16} />
              <span>Login with Any Custom Phone & OTP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
