// FixNear Identity Validation & Geofencing Module
// Compliant with DPDP Act 2023: Raw identity documents are NOT stored in plaintext.
// Pre-flight validation checks numerical formatting only; official verification requires
// authorized KYC review or manual administrative audit.

import {
  generateSecureDoorstepOtp,
  maskIdentityNumber,
  hashIdentitySecure,
  validateIdentityFormatOnly,
  verifyPlaceGeofence,
  CHILAKALURIPET_CENTER,
} from './cryptoUtils';

export {
  generateSecureDoorstepOtp,
  maskIdentityNumber,
  hashIdentitySecure,
  validateIdentityFormatOnly,
  verifyPlaceGeofence,
  CHILAKALURIPET_CENTER,
};

/**
 * Backward compatibility alias for Doorstep Start-OTP.
 * Uses cryptographically secure random integers.
 */
export function generateDoorstepOtp(): string {
  return generateSecureDoorstepOtp();
}

/**
 * Backward compatibility alias for identity masking.
 */
export function maskAadhaarNumber(idNumber: string): string {
  return maskIdentityNumber(idNumber);
}

/**
 * Backward compatibility alias for identity hashing.
 */
export async function hashAadhaarSecure(idNumber: string): Promise<string> {
  return hashIdentitySecure(idNumber);
}

/**
 * Pre-flight Verhoeff format check.
 * NOTE: This validates digit syntax mathematically.
 * It DOES NOT verify identity or confer VERIFIED status.
 */
export function validateAadhaarVerhoeff(idNumber: string): {
  isValid: boolean;
  error?: string;
} {
  const result = validateIdentityFormatOnly(idNumber);
  return {
    isValid: result.isValidFormat,
    error: result.error,
  };
}
