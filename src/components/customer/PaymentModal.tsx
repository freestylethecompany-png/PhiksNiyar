'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  X,
  Loader2,
  IndianRupee,
  CreditCard,
} from 'lucide-react';
import { Booking } from '@/lib/db/types';

interface PaymentModalProps {
  booking: Booking;
  onPaymentSuccess: (bookingId: string, method: string) => Promise<void>;
  onClose: () => void;
}

export default function PaymentModal({
  booking,
  onPaymentSuccess,
  onClose,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'UPI_QR' | 'UPI_INTENT' | 'RAZORPAY' | 'CASH'>('UPI_QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);

  const amount = booking.pricing.finalAmount || booking.pricing.estimatedAmount;
  const platformFee = Math.round((amount * booking.pricing.platformCommissionPercent) / 100);
  const providerPayout = amount - platformFee;

  // Real UPI deep link spec
  const upiVpa = 'sevanta.payments@okhdfcbank';
  const upiUri = `upi://pay?pa=${upiVpa}&pn=Sevanta%20Marketplace&am=${amount}&cu=INR&tn=Booking_${booking.id}`;

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      if (selectedMethod === 'RAZORPAY') {
        // Call Razorpay Order API
        const orderRes = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id }),
        });
        const orderData = await orderRes.json();
        setRazorpayOrder(orderData);

        // If client-side Razorpay SDK is available and key is configured
        if (orderData.keyId && typeof window !== 'undefined') {
          // Dynamically ensure Razorpay script
          if (!(window as any).Razorpay) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
              document.body.appendChild(script);
            });
          }

          if ((window as any).Razorpay) {
            const rzp = new (window as any).Razorpay({
              key: orderData.keyId,
              amount: orderData.amount,
              currency: orderData.currency || 'INR',
              name: 'Sevanta Services',
              description: `Booking #${booking.id} (${booking.category})`,
              order_id: orderData.orderId,
              prefill: {
                name: booking.customerName,
                contact: booking.customerPhone,
              },
              theme: { color: '#ea580c' },
              handler: async function (response: any) {
                // Verify signature on backend
                const verifyRes = await fetch('/api/payments/razorpay/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bookingId: booking.id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  await onPaymentSuccess(booking.id, 'RAZORPAY');
                  setPaymentDone(true);
                  setTimeout(() => onClose(), 1800);
                } else {
                  alert(verifyData.error || 'Payment verification failed');
                }
              },
            });
            rzp.open();
            setIsProcessing(false);
            return;
          }
        }

        // Sandbox / Test fallback if no keys configured
        await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_signature: 'test_signature',
          }),
        });
      }

      await onPaymentSuccess(
        booking.id,
        selectedMethod === 'CASH' ? 'CASH' : selectedMethod === 'RAZORPAY' ? 'RAZORPAY' : 'UPI'
      );
      setPaymentDone(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (e) {
      console.error(e);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '490px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Pay for Service</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Booking #{booking.id} • {booking.providerName}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {paymentDone ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--success)' }}>Payment Confirmed!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              ₹{amount} successfully paid via {selectedMethod}. Receipt has been issued.
            </p>
          </div>
        ) : (
          <div className="modal-body">
            {/* Amount Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>TOTAL PAYABLE AMOUNT</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>₹{amount}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                Service: {booking.category} ({booking.subcategory})
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI_QR')}
                style={{
                  padding: '0.65rem 0.2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: selectedMethod === 'UPI_QR' ? 'var(--primary)' : 'var(--border-light)',
                  background: selectedMethod === 'UPI_QR' ? 'var(--primary-50)' : 'var(--surface)',
                  color: selectedMethod === 'UPI_QR' ? 'var(--primary-dark)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <QrCode size={18} />
                <span>UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('UPI_INTENT')}
                style={{
                  padding: '0.65rem 0.2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: selectedMethod === 'UPI_INTENT' ? 'var(--primary)' : 'var(--border-light)',
                  background: selectedMethod === 'UPI_INTENT' ? 'var(--primary-50)' : 'var(--surface)',
                  color: selectedMethod === 'UPI_INTENT' ? 'var(--primary-dark)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Smartphone size={18} />
                <span>GPay/PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('RAZORPAY')}
                style={{
                  padding: '0.65rem 0.2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: selectedMethod === 'RAZORPAY' ? 'var(--primary)' : 'var(--border-light)',
                  background: selectedMethod === 'RAZORPAY' ? 'var(--primary-50)' : 'var(--surface)',
                  color: selectedMethod === 'RAZORPAY' ? 'var(--primary-dark)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <CreditCard size={18} />
                <span>Razorpay</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('CASH')}
                style={{
                  padding: '0.65rem 0.2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: selectedMethod === 'CASH' ? 'var(--primary)' : 'var(--border-light)',
                  background: selectedMethod === 'CASH' ? 'var(--primary-50)' : 'var(--surface)',
                  color: selectedMethod === 'CASH' ? 'var(--primary-dark)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Banknote size={18} />
                <span>Cash</span>
              </button>
            </div>

            {/* Method Details */}
            {selectedMethod === 'UPI_QR' && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    margin: '0 auto 0.75rem auto',
                    background: 'white',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=${encodeURIComponent(
                      upiUri
                    )}`}
                    alt="UPI Payment QR Code"
                    width={144}
                    height={144}
                    style={{ borderRadius: '4px' }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Scan with Google Pay, PhonePe, Paytm, or BHIM app
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  VPA: <code>{upiVpa}</code>
                </div>
              </div>
            )}

            {selectedMethod === 'UPI_INTENT' && (
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Tap to launch UPI app on your phone:
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
                  <a
                    href={upiUri}
                    style={{
                      padding: '0.5rem 0.9rem',
                      background: 'white',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    Google Pay
                  </a>
                  <a
                    href={upiUri}
                    style={{
                      padding: '0.5rem 0.9rem',
                      background: 'white',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    PhonePe
                  </a>
                  <a
                    href={upiUri}
                    style={{
                      padding: '0.5rem 0.9rem',
                      background: 'white',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    Paytm
                  </a>
                </div>
              </div>
            )}

            {selectedMethod === 'RAZORPAY' && (
              <div
                style={{
                  padding: '1rem',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#0369a1',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Razorpay Payment Gateway:</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Supports Credit/Debit Cards, Net Banking (SBI, Andhra Bank / Union, HDFC), and Wallets.
                  Uses <code>RAZORPAY_KEY_ID</code> from environment variables.
                </p>
              </div>
            )}

            {selectedMethod === 'CASH' && (
              <div
                style={{
                  padding: '1rem',
                  background: '#fffbeb',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #fde68a',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#92400e',
                }}
              >
                <strong>Handover Cash to {booking.providerName}:</strong> Hand over exact cash of ₹{amount} to the service professional at your doorstep.
              </div>
            )}

            {/* Split breakdown */}
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span>Provider Net Payout (90%)</span>
                <strong>₹{providerPayout}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sevanta Platform Commission (10%)</span>
                <span>₹{platformFee}</span>
              </div>
            </div>
          </div>
        )}

        {!paymentDone && (
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleProcessPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay ₹{amount}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
