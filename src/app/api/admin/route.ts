import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { VerificationStatus } from '@/lib/db/types';
import { getAuthSession } from '@/lib/auth/session';
import { canTransitionVerification } from '@/lib/db/stateMachine';

export async function GET() {
  try {
    const session = await getAuthSession();
    // Verify admin role if session is present
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Forbidden: Admin authentication required',
          requiresAdminAuth: true,
        },
        { status: 403 }
      );
    }

    const providers = db.getProviders();
    const bookings = db.getBookings();
    const settings = db.getSettings();
    const auditLogs = db.getAuditLogs(15);

    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
    const totalGrossRevenue = completedBookings.reduce(
      (sum, b) => sum + (b.pricing.finalAmount || b.pricing.estimatedAmount),
      0
    );
    const totalPlatformCommission = completedBookings.reduce(
      (sum, b) => sum + b.pricing.platformCommissionAmount,
      0
    );

    const pendingProviders = providers.filter((p) => p.verificationStatus === 'PENDING');
    const verifiedProviders = providers.filter((p) => p.verificationStatus === 'VERIFIED');

    const categoryCounts: Record<string, number> = {};
    for (const b of bookings) {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalCustomers: 1,
        totalProviders: providers.length,
        verifiedProviders: verifiedProviders.length,
        pendingVerifications: pendingProviders.length,
        totalBookings: bookings.length,
        completedJobs: completedBookings.length,
        grossRevenue: totalGrossRevenue,
        platformCommission: totalPlatformCommission,
        commissionPercent: settings.platformCommissionPercent,
        disputesCount: 0,
      },
      verificationQueue: pendingProviders.map((p) => ({
        ...p,
        user: db.getUserById(p.userId),
      })),
      allProviders: providers.map((p) => ({
        ...p,
        user: db.getUserById(p.userId),
      })),
      recentBookings: bookings.slice(0, 10),
      settings,
      categoryDistribution: categoryCounts,
      auditLogs,
    });
  } catch (error) {
    console.error('Error in GET /api/admin:', error);
    return NextResponse.json({ error: 'Failed to fetch admin dashboard data' }, { status: 500 });
  }
}

// Action: Provider Verification
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin authentication required' }, { status: 403 });
    }

    const body = await request.json();
    const { providerId, status: newStatus, notes } = body;

    const provider = db.getProviderById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const previousStatus = provider.verificationStatus;
    const transitionCheck = canTransitionVerification(previousStatus, newStatus as VerificationStatus, session.role);
    if (!transitionCheck.allowed) {
      return NextResponse.json({ error: transitionCheck.reason }, { status: 400 });
    }

    provider.verificationStatus = newStatus as VerificationStatus;
    provider.updatedAt = new Date().toISOString();
    db.saveProvider(provider);

    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session.userId,
      actorRole: 'ADMIN',
      action: `PROVIDER_VERIFICATION_${newStatus}`,
      targetEntity: 'PROVIDER',
      targetId: provider.id,
      details: { previousStatus, newStatus, notes, adminName: session.name },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Provider ${provider.businessName} status changed to ${newStatus}`,
      provider,
    });
  } catch (error) {
    console.error('Error in POST /api/admin (Verification):', error);
    return NextResponse.json({ error: 'Failed to update provider status' }, { status: 500 });
  }
}

// Action: Update Platform Settings
export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin authentication required' }, { status: 403 });
    }

    const body = await request.json();
    const { commissionPercent, matchingWeights, defaultSearchRadiusKm } = body;

    const updates: any = {};
    if (commissionPercent !== undefined) updates.platformCommissionPercent = Number(commissionPercent);
    if (matchingWeights) updates.matchingWeights = matchingWeights;
    if (defaultSearchRadiusKm !== undefined) updates.defaultSearchRadiusKm = Number(defaultSearchRadiusKm);

    db.updateSettings(updates);

    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session.userId,
      actorRole: 'ADMIN',
      action: 'PLATFORM_SETTINGS_UPDATED',
      targetEntity: 'PLATFORM_SETTINGS',
      targetId: 'settings',
      details: { ...updates, adminName: session.name },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, settings: db.getSettings() });
  } catch (error) {
    console.error('Error in PATCH /api/admin (Settings):', error);
    return NextResponse.json({ error: 'Failed to update platform settings' }, { status: 500 });
  }
}
