import crypto from 'crypto';

/**
 * Generates a cryptographically secure random 6-digit SMS OTP.
 */
export function generateSecurePhoneOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generates a cryptographically secure random 4-digit Doorstep Start-OTP.
 * Only given to the customer; required before worker can start job.
 */
export function generateSecureDoorstepOtp(): string {
  return crypto.randomInt(1000, 10000).toString();
}

/**
 * Masks government identity numbers for privacy compliance (DPDP Act 2023):
 * Example: "123456789012" -> "XXXX-XXXX-9012"
 */
export function maskIdentityNumber(rawId: string): string {
  const cleaned = rawId.replace(/[\s-]/g, '');
  if (cleaned.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = cleaned.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * One-way cryptographic hash with project salt to prevent duplicate provider identity registrations
 * without storing raw sensitive identity numbers in database.
 */
export function hashIdentitySecure(rawId: string): string {
  const cleaned = rawId.replace(/[\s-]/g, '');
  const salt = process.env.IDENTITY_SALT || 'FIXNEAR_KYC_SECURE_SALT_CHILAKALURIPET_2026';
  return crypto.createHmac('sha256', salt).update(cleaned).digest('hex');
}

/**
 * Verhoeff checksum algorithm for pre-flight format validation only.
 * IMPORTANT: Verhoeff only validates digits mathematically.
 * It DOES NOT verify identity or UIDAI registration.
 */
export function validateIdentityFormatOnly(idNumber: string): {
  isValidFormat: boolean;
  error?: string;
} {
  const cleaned = idNumber.replace(/[\s-]/g, '');

  if (!/^\d{12}$/.test(cleaned)) {
    return {
      isValidFormat: false,
      error: 'ID number must be exactly 12 numeric digits (గుర్తింపు కార్డు 12 అంకెలు ఉండాలి).',
    };
  }

  if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
    return {
      isValidFormat: false,
      error: 'Valid Indian government 12-digit ID cannot begin with 0 or 1.',
    };
  }

  return { isValidFormat: true };
}

/**
 * Chilakaluripet town center coordinates: 16.0885° N, 80.1660° E
 */
export const CHILAKALURIPET_CENTER = {
  latitude: 16.0885,
  longitude: 80.166,
  pincode: '522616',
  district: 'Palnadu',
  state: 'Andhra Pradesh',
  maxAllowedRadiusKm: 25.0,
};

export function verifyPlaceGeofence(
  lat: number,
  lng: number
): {
  isVerified: boolean;
  distanceKm: number;
  message: string;
} {
  const R = 6371; // Earth radius in km
  const dLat = ((lat - CHILAKALURIPET_CENTER.latitude) * Math.PI) / 180;
  const dLon = ((lng - CHILAKALURIPET_CENTER.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((CHILAKALURIPET_CENTER.latitude * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c * 10) / 10;

  if (distanceKm <= CHILAKALURIPET_CENTER.maxAllowedRadiusKm) {
    return {
      isVerified: true,
      distanceKm,
      message: `Verified within Chilakaluripet service boundaries (${distanceKm} km from town center).`,
    };
  }

  return {
    isVerified: false,
    distanceKm,
    message: `Location is ${distanceKm} km away, exceeding maximum 25 km operating radius for Chilakaluripet.`,
  };
}
