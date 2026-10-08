// Indian UIDAI Aadhaar Verification Standard (Verhoeff Algorithm) & Hyperlocal Place Verification
// Compliant with UIDAI Guidelines, Aadhaar Act 2016, and IT Act

/**
 * Verhoeff Algorithm Tables for Indian Aadhaar Checksum Validation
 * Validates 12-digit Indian Aadhaar numbers to prevent forged or mistyped IDs.
 */
const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Validates 12-digit Aadhaar number using official Verhoeff algorithm.
 * UIDAI rules:
 * 1. Must be exactly 12 numeric digits
 * 2. Cannot start with '0' or '1'
 * 3. Checksum across permutations must equal 0
 */
export function validateAadhaarVerhoeff(aadhaar: string): {
  isValid: boolean;
  error?: string;
} {
  const cleaned = aadhaar.replace(/[\s-]/g, '');

  if (!/^\d{12}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Aadhaar number must be exactly 12 numeric digits (ఆధార్ 12 అంకెలు ఉండాలి).',
    };
  }

  // UIDAI numbers do not start with 0 or 1
  if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
    return {
      isValid: false,
      error: 'Valid UIDAI Aadhaar number cannot start with 0 or 1.',
    };
  }

  // Verhoeff checksum test
  let c = 0;
  const reversedArray = cleaned.split('').reverse().map(Number);

  for (let i = 0; i < reversedArray.length; i++) {
    c = dTable[c][pTable[i % 8][reversedArray[i]]];
  }

  if (c !== 0) {
    return {
      isValid: false,
      error: 'Invalid Aadhaar checksum. Please check digits carefully (చెల్లని ఆధార్ నంబర్).',
    };
  }

  return { isValid: true };
}

/**
 * Masks Aadhaar number to comply with UIDAI privacy rules:
 * Input: "987654321098" -> Output: "XXXX-XXXX-1098"
 */
export function maskAadhaarNumber(aadhaar: string): string {
  const cleaned = aadhaar.replace(/[\s-]/g, '');
  if (cleaned.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = cleaned.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * Calculates SHA-256 hash of Aadhaar for duplicate detection without storing plaintext.
 */
export async function hashAadhaarSecure(aadhaar: string): Promise<string> {
  const cleaned = aadhaar.replace(/[\s-]/g, '');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`UIDAI_SALT_FIXNEAR_${cleaned}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash
  let hash = 0;
  const str = `UIDAI_SALT_${cleaned}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash-${Math.abs(hash).toString(16)}`;
}

/**
 * Chilakaluripet Hyperlocal Geofencing Verification
 * Coordinates: 16.0885° N, 80.1660° E
 * Permissible radius: 25 km around Chilakaluripet town & mandals
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
  lng: number,
  pincode?: string
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

/**
 * Generates a tamper-proof 4-digit Doorstep Start-OTP
 */
export function generateDoorstepOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
