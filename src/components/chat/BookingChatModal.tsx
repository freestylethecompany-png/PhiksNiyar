'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2, Phone, ExternalLink } from 'lucide-react';
import { Booking, UserRole } from '@/lib/db/types';

interface BookingChatModalProps {
  booking: Booking;
  currentUserRole: UserRole;
  currentUserId?: string;
  onClose: () => void;
}

export default function BookingChatModal({
  booking,
  currentUserRole,
  currentUserId = 'usr-cust-1',
  onClose,
}: BookingChatModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/bookings/messages?bookingId=${booking.id}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3500); // Poll for live chat updates
    return () => clearInterval(interval);
  }, [booking.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/bookings/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          senderId: currentUserId,
          senderRole: currentUserRole,
          text: inputText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // WhatsApp click-to-chat URL
  const targetPhone =
    currentUserRole === 'CUSTOMER'
      ? booking.providerPhone.replace(/\D/g, '')
      : booking.customerPhone.replace(/\D/g, '');

  const waText = encodeURIComponent(
    `Hello! Regarding FixNear Booking #${booking.id} (${booking.category} at ${booking.customerAddress.areaName}, Chilakaluripet): `
  );
  const whatsAppUrl = `https://wa.me/${targetPhone}?text=${waText}`;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', height: '620px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>
              Chat with {currentUserRole === 'CUSTOMER' ? booking.providerName : booking.customerName}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Booking #{booking.id} • {booking.category}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                background: '#25D366',
                color: 'white',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
              title="Open WhatsApp Chat"
            >
              <span>WhatsApp</span>
              <ExternalLink size={12} />
            </a>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fafbfc' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.4rem auto' }} />
              <span>Loading conversation...</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
              <p>No messages yet. Send a message to coordinate arrival in Chilakaluripet!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === currentUserRole;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    padding: '0.65rem 0.95rem',
                    borderRadius: 'var(--radius-lg)',
                    background: isMe ? 'var(--primary)' : 'white',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    border: isMe ? 'none' : '1px solid var(--border-light)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ fontSize: '0.65rem', opacity: 0.8, marginBottom: '0.2rem', fontWeight: 600 }}>
                    {isMe ? 'You' : m.senderRole === 'PROVIDER' ? booking.providerName : booking.customerName}
                  </div>
                  <div>{m.text}</div>
                  <div style={{ fontSize: '0.62rem', opacity: 0.7, textAlign: 'right', marginTop: '0.25rem' }}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} style={{ padding: '0.85rem 1rem', background: 'white', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message here... (e.g. 'I am near Kalamandir clock tower')"
            disabled={sending}
          />
          <button type="submit" className="btn-primary" disabled={sending || !inputText.trim()}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
