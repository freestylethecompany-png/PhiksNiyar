import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { ProviderProfile } from '@/lib/db/types';
import { CHILAKALURIPET_AREAS } from '@/lib/constants/locations';
import {
  validateIdentityFormatOnly,
  maskIdentityNumber,
  hashIdentitySecure,
  verifyPlaceGeofence,
} from '@/lib/security/cryptoUtils';
import { getAuthSession } from '@/lib/auth/session';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimiter';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`onboard-ip:${clientIp}`, 10, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const session = await getAuthSession();
    const body = await request.json();
    const {
      name,
      phone,
      businessName,
      primaryCategory,
      categories,
      subcategories,
      experienceYears,
      locationArea,
      serviceRadiusKm,
      visitingCharge,
      hourlyRate,
      workingDays,
      startTime,
      endTime,
      idNumber,
      aadhaarNumber,
      bio,
      latitude: clientLat,
      longitude: clientLng,
    } = body;

    const rawIdInput = idNumber || aadhaarNumber;

    if (!name || !phone || !businessName || !primaryCategory) {
      return NextResponse.json(
        { error: 'Missing required onboarding fields (name, phone, businessName, primaryCategory)' },
        { status: 400 }
      );
    }

    // 1. Pre-flight format validation (NOTE: Format check only; does NOT verify identity)
    if (!rawIdInput) {
      return NextResponse.json(
        { error: 'Government ID reference is required for provider application (గుర్తింపు కార్డు వివరాలు తప్పనిసరి).' },
        { status: 400 }
      );
    }

    const formatCheck = validateIdentityFormatOnly(rawIdInput);
    if (!formatCheck.isValidFormat) {
      return NextResponse.json(
        { error: formatCheck.error || 'Invalid 12-digit government ID format.' },
        { status: 400 }
      );
    }

    // 2. DPDP Act 2023 Compliance: Mask ID for storage and hash for deduplication
    // NEVER store raw unmasked government IDs in the database.
    const maskedIdentity = maskIdentityNumber(rawIdInput);
    const identityHash = hashIdentitySecure(rawIdInput);

    // Clean phone
    let cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (!cleanPhone.startsWith('+91')) {
      if (cleanPhone.length === 10) cleanPhone = `+91${cleanPhone}`;
    }

    // Rate limit per phone
    const phoneCheck = checkRateLimit(`onboard-phone:${cleanPhone}`, 3, 24 * 60 * 60 * 1000);
    if (!phoneCheck.allowed) {
      return NextResponse.json(
        { error: 'An onboarding submission was already received for this phone number.' },
        { status: 429 }
      );
    }

    // 3. Hyperlocal Workshop Geofence Verification for Chilakaluripet
    const selectedArea = CHILAKALURIPET_AREAS.find(
      (a) => a.name.toLowerCase() === (locationArea || '').toLowerCase()
    ) || CHILAKALURIPET_AREAS[0];

    const latToVerify = Number(clientLat) || selectedArea.latitude;
    const lngToVerify = Number(clientLng) || selectedArea.longitude;
    const placeCheck = verifyPlaceGeofence(latToVerify, lngToVerify);

    if (!placeCheck.isVerified) {
      return NextResponse.json(
        { error: `Workshop location check: ${placeCheck.message}` },
        { status: 400 }
      );
    }

    // 4. Create or Update User record
    let user = session?.userId ? db.getUserById(session.userId) : null;
    if (!user) {
      user = db.getUserByPhone(cleanPhone);
    }

    if (!user) {
      user = {
        id: `usr-prov-${Date.now()}`,
        name: name.trim().slice(0, 100),
        phone: cleanPhone,
        role: 'PROVIDER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveUser(user);
    } else {
      user.name = name.trim().slice(0, 100);
      user.role = 'PROVIDER';
      user.updatedAt = new Date().toISOString();
      db.saveUser(user);
    }

    // Check if provider profile already exists
    let existingProfile = db.getProviderByUserId(user.id);
    const providerId = existingProfile?.id || `prov-${Date.now()}`;

    // 5. Create Provider Profile with DOCUMENT_SUBMITTED status
    // Client can NEVER self-grant VERIFIED status. Verification requires administrator approval.
    const newProvider: ProviderProfile = {
      id: providerId,
      userId: user.id,
      businessName: businessName.trim().slice(0, 150),
      primaryCategory,
      categories: Array.isArray(categories) && categories.length > 0 ? categories.slice(0, 5) : [primaryCategory],
      subcategories: Array.isArray(subcategories) && subcategories.length > 0 ? subcategories.slice(0, 10) : ['Standard Service'],
      experienceYears: Math.min(Math.max(Number(experienceYears) || 1, 0), 50),
      bio: bio ? bio.trim().slice(0, 500) : `${businessName} providing professional ${primaryCategory} in Chilakaluripet.`,
      serviceRadiusKm: Math.min(Math.max(Number(serviceRadiusKm) || 10, 1), 25),
      locationArea: selectedArea.name,
      latitude: latToVerify,
      longitude: lngToVerify,
      verificationStatus: 'DOCUMENT_SUBMITTED', // MUST be DOCUMENT_SUBMITTED, never VERIFIED
      verificationProvider: 'FIXNEAR_ADMIN_REVIEW',
      providerReferenceId: identityHash.slice(0, 16),
      verificationTimestamp: new Date().toISOString(),
      maskedIdentityReference: maskedIdentity,
      placeVerified: placeCheck.isVerified,
      placeVerifiedAt: new Date().toISOString(),
      workshopGpsVerified: true,
      circumventionRiskScore: 0,
      circumventionStrikes: 0,
      verificationDocuments: {
        idDocumentUploaded: true,
        tradeLicenseUploaded: Boolean(body.tradeLicenseUploaded),
        certificateUploaded: Boolean(body.certificateUploaded),
        idNumberMasked: maskedIdentity,
        workshopPhotoUploaded: Boolean(body.workshopPhotoUploaded),
      },
      workingHours: {
        days: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: startTime || '08:30',
        endTime: endTime || '20:00',
        isAvailableToday: true,
      },
      pricingModel: {
        visitingCharge: Math.min(Math.max(Number(visitingCharge) || 199, 49), 999),
        hourlyRate: hourlyRate ? Math.min(Math.max(Number(hourlyRate), 99), 1999) : undefined,
      },
      metrics: {
        rating: 5.0,
        totalReviews: 0, // Starts at 0 genuine reviews
        completedJobs: 0, // Starts at 0 genuine jobs
        cancellationRate: 0,
        responseRate: 100,
        avgResponseMinutes: 15,
      },
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveProvider(newProvider);

    // 6. Security Audit Trail
    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: user.id,
      actorRole: 'PROVIDER',
      action: 'PROVIDER_APPLICATION_SUBMITTED',
      targetEntity: 'PROVIDER',
      targetId: newProvider.id,
      details: {
        businessName: newProvider.businessName,
        primaryCategory,
        area: selectedArea.name,
        maskedIdentity,
        initialStatus: 'DOCUMENT_SUBMITTED',
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully! Your documents and trade details will be verified by the FixNear verification team before receiving the Verified badge.',
      provider: newProvider,
    });
  } catch (error) {
    console.error('Error in /api/providers/onboard:', error);
    return NextResponse.json({ error: 'Failed to complete provider onboarding' }, { status: 500 });
  }
}
