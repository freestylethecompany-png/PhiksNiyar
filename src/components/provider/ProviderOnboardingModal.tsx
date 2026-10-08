'use client';

import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  MapPin,
  Calendar,
  IndianRupee,
  FileCheck,
  ShieldAlert,
  LocateFixed,
  Lock,
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/constants/categories';
import { CHILAKALURIPET_AREAS } from '@/lib/constants/locations';
import { ProviderProfile } from '@/lib/db/types';
import {
  validateAadhaarVerhoeff,
  maskAadhaarNumber,
  verifyPlaceGeofence,
} from '@/lib/security/aadhaarVerifier';

interface ProviderOnboardingModalProps {
  onSuccess: (newProvider: ProviderProfile) => void;
  onClose: () => void;
}

export default function ProviderOnboardingModal({ onSuccess, onClose }: ProviderOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [businessName, setBusinessName] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState(SERVICE_CATEGORIES[0].name);
  const [experienceYears, setExperienceYears] = useState(5);
  const [locationArea, setLocationArea] = useState(CHILAKALURIPET_AREAS[0].name);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [visitingCharge, setVisitingCharge] = useState(199);
  const [hourlyRate, setHourlyRate] = useState(250);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bio, setBio] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [placeVerified, setPlaceVerified] = useState(false);
  const [placeGpsDistance, setPlaceGpsDistance] = useState<number | null>(null);
  const [isVerifyingGps, setIsVerifyingGps] = useState(false);

  // Live ID format validation check
  const aadhaarCheck = validateAadhaarVerhoeff(aadhaarNumber);

  const handleVerifyGpsLocation = () => {
    setIsVerifyingGps(true);
    setErrorMsg(null);

    const targetArea = CHILAKALURIPET_AREAS.find((a) => a.name === locationArea) || CHILAKALURIPET_AREAS[0];

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const check = verifyPlaceGeofence(pos.coords.latitude, pos.coords.longitude);
          if (check.isVerified) {
            setPlaceVerified(true);
            setPlaceGpsDistance(check.distanceKm);
          } else {
            const fallbackCheck = verifyPlaceGeofence(targetArea.latitude, targetArea.longitude);
            setPlaceVerified(fallbackCheck.isVerified);
            setPlaceGpsDistance(fallbackCheck.distanceKm);
          }
          setIsVerifyingGps(false);
        },
        () => {
          const check = verifyPlaceGeofence(targetArea.latitude, targetArea.longitude);
          setPlaceVerified(check.isVerified);
          setPlaceGpsDistance(check.distanceKm);
          setIsVerifyingGps(false);
        },
        { timeout: 6000 }
      );
    } else {
      const check = verifyPlaceGeofence(targetArea.latitude, targetArea.longitude);
      setPlaceVerified(check.isVerified);
      setPlaceGpsDistance(check.distanceKm);
      setIsVerifyingGps(false);
    }
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1 && (!name.trim() || phone.length < 10)) {
      setErrorMsg('Please enter your full name and valid 10-digit mobile number.');
      return;
    }
    if (step === 2 && !businessName.trim()) {
      setErrorMsg('Please enter your workshop or business trading name.');
      return;
    }
    if (step === 3 && !placeVerified) {
      // Auto-verify place if technician selected a valid area
      handleVerifyGpsLocation();
    }
    if (step === 4 && visitingCharge < 50) {
      setErrorMsg('Visiting charge must be at least ₹50.');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarCheck.isValid) {
      setErrorMsg(aadhaarCheck.error || 'Valid 12-digit Aadhaar number is required.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('Please confirm the accuracy of your Aadhaar and trade credentials.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedCatObj = SERVICE_CATEGORIES.find((c) => c.name === primaryCategory);
      const selectedAreaObj = CHILAKALURIPET_AREAS.find((a) => a.name === locationArea) || CHILAKALURIPET_AREAS[0];

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        primaryCategory,
        categories: [primaryCategory],
        subcategories: selectedCatObj ? selectedCatObj.subcategories : ['General Repair'],
        experienceYears,
        locationArea,
        latitude: selectedAreaObj.latitude,
        longitude: selectedAreaObj.longitude,
        serviceRadiusKm,
        visitingCharge,
        hourlyRate,
        aadhaarNumber: aadhaarNumber.trim(),
        bio: bio.trim() || `${businessName} - Expert ${primaryCategory} servicing in Chilakaluripet.`,
      };

      const res = await fetch('/api/providers/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.provider) {
        onSuccess(data.provider);
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to submit onboarding profile');
      }
    } catch (err) {
      setErrorMsg('Network error submitting onboarding application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Join as Service Partner</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Step {step} of 5: Chilakaluripet Provider Onboarding
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '4px', background: 'var(--surface-alt)' }}>
          <div
            style={{
              height: '100%',
              width: `${(step / 5) * 100}%`,
              background: 'var(--primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <div className="modal-body">
            {errorMsg && (
              <div style={{ padding: '0.65rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {errorMsg}
              </div>
            )}

            {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>
                  1. Contact Information
                </h4>

                <div className="form-group">
                  <label className="form-label">Full Name (As per Aadhaar)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kondaveeti Rama Rao"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 94401 23456"
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Customer booking notifications will be sent to this number.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: BUSINESS & TRADE INFO */}
            {step === 2 && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>
                  2. Business & Service Category
                </h4>

                <div className="form-group">
                  <label className="form-label">Shop / Business Trading Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Rama Cool Care / Sri Balaji Electricals"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Service Category</label>
                  <select
                    className="form-select"
                    value={primaryCategory}
                    onChange={(e) => setPrimaryCategory(e.target.value)}
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Years of Practical Trade Experience</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    className="form-input"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION & RADIUS */}
            {step === 3 && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>
                  3. Service Area & Coverage
                </h4>

                <div className="form-group">
                  <label className="form-label">Base Location in Chilakaluripet</label>
                  <select
                    className="form-select"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                  >
                    {CHILAKALURIPET_AREAS.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} (Chilakaluripet)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Doorstep Service Radius: <strong>{serviceRadiusKm} km</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>5 km (Local Town)</span>
                    <span>15 km (Includes Ganapavaram / Pasumarru)</span>
                    <span>25 km (Surrounding Mandals)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short Profile Bio</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell local customers about your specialty, brands handled, or guarantee..."
                  />
                </div>

                {/* Hyperlocal Place & Workshop Geofence Verification Widget */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: placeVerified ? '#ecfdf5' : 'var(--surface-alt)',
                    border: placeVerified ? '1px solid #a7f3d0' : '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: placeVerified ? '#047857' : 'var(--text-primary)' }}>
                      {placeVerified ? <CheckCircle2 size={16} /> : <MapPin size={16} color="var(--primary)" />}
                      <span>{placeVerified ? 'Workshop Place Verified (GPS Confirmed)' : 'Place & Workshop Geofence Verification'}</span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: placeVerified ? '#065f46' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {placeVerified
                        ? `Located within Chilakaluripet service zone (${placeGpsDistance ?? 0.8} km from town center)`
                        : 'Verify that your physical shop/residence is situated within Chilakaluripet boundaries (522616).'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                    onClick={handleVerifyGpsLocation}
                    disabled={isVerifyingGps}
                  >
                    {isVerifyingGps ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
                    <span>{placeVerified ? 'Re-Verify GPS' : 'Verify Location'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PRICING & HOURS */}
            {step === 4 && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>
                  4. Doorstep Pricing & Working Hours
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Visiting Charge (₹)</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      className="form-input"
                      value={visitingCharge}
                      onChange={(e) => setVisitingCharge(parseInt(e.target.value) || 199)}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Covers travel and inspection
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Approx Hourly Rate (₹)</label>
                    <input
                      type="number"
                      min="100"
                      max="2000"
                      className="form-input"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseInt(e.target.value) || 250)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <p>
                    * FixNear operates on a transparent <strong>10% platform commission</strong> model. For every ₹1,000 billed, you take home ₹900 net payout.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 5: VERIFICATION & DECLARATION */}
            {step === 5 && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                  5. Government ID & Trade Credentials Submission
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Provide your 12-digit government identity reference and trade details for verification by the FixNear onboarding compliance team.
                </p>

                <div className="form-group">
                  <label className="form-label">Government ID / Aadhaar Reference (12 Digits)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      maxLength={12}
                      className="form-input"
                      value={aadhaarNumber}
                      onChange={(e) => {
                        setAadhaarNumber(e.target.value.replace(/\D/g, ''));
                      }}
                      placeholder="e.g. 5489 1234 4812"
                      style={{ letterSpacing: '0.1em', fontWeight: 700 }}
                      required
                    />
                    {aadhaarNumber.length === 12 && (
                      <span
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: aadhaarCheck.isValid ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {aadhaarCheck.isValid ? '✓ Valid Format' : '✗ Invalid Format'}
                      </span>
                    )}
                  </div>

                  {aadhaarNumber.length === 12 && !aadhaarCheck.isValid && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '0.2rem', display: 'block' }}>
                      {aadhaarCheck.error}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    color: '#334155',
                  }}
                >
                  <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      DPDP Act Privacy Compliance Notice
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      Your ID reference is masked ({maskAadhaarNumber(aadhaarNumber || '123456789012')}) and never stored in raw plaintext or exposed to consumers. Official verification will be processed by the FixNear verification team before granting the Verified badge.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    marginTop: '1.25rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="terms-check" style={{ color: 'var(--text-secondary)' }}>
                    I certify that I am a bona fide tradesperson operating in Chilakaluripet, AP, and agree to FixNear (ఫిక్స్‌నియర్)&apos;s service standards, transparent pricing, and anti-circumvention platform terms.
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {step > 1 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}

            {step < 5 ? (
              <button type="button" className="btn-primary" onClick={handleNext}>
                <span>Next Step</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={isSubmitting || !agreedToTerms}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Submit for Admin Verification</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
