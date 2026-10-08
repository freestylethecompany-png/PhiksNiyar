import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { rankProvidersForRequest } from '@/lib/ai/matchEngine';
import { CHILAKALURIPET_AREAS } from '@/lib/constants/locations';
import { ProviderProfile } from '@/lib/db/types';

// Strips sensitive internal risk scores and private contact details from public listings
function sanitizePublicProvider(p: ProviderProfile) {
  const user = db.getUserById(p.userId);
  return {
    id: p.id,
    businessName: p.businessName,
    primaryCategory: p.primaryCategory,
    categories: p.categories,
    subcategories: p.subcategories,
    experienceYears: p.experienceYears,
    bio: p.bio,
    serviceRadiusKm: p.serviceRadiusKm,
    locationArea: p.locationArea,
    latitude: p.latitude,
    longitude: p.longitude,
    verificationStatus: p.verificationStatus,
    workingHours: p.workingHours,
    pricingModel: p.pricingModel,
    metrics: p.metrics,
    portfolioImages: p.portfolioImages || [],
    user: user
      ? {
          name: user.name,
          avatarUrl: user.avatarUrl,
        }
      : null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory') || undefined;
    const areaName = searchParams.get('area') || 'Kalamandir Center';
    const urgency = (searchParams.get('urgency') as any) || 'normal';
    const budgetStr = searchParams.get('budget');
    const targetBudget = budgetStr ? parseFloat(budgetStr) : undefined;

    // Find area coordinates
    const selectedArea = CHILAKALURIPET_AREAS.find(
      (a) => a.name.toLowerCase() === areaName.toLowerCase()
    ) || CHILAKALURIPET_AREAS[0];

    if (category) {
      const rankedMatches = rankProvidersForRequest({
        category,
        subcategory,
        customerLat: selectedArea.latitude,
        customerLon: selectedArea.longitude,
        urgency,
        targetBudget,
      });

      // Sanitize provider representations
      const sanitizedMatches = rankedMatches.map((m) => ({
        ...m,
        provider: sanitizePublicProvider(m.provider),
        user: {
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
        },
      }));

      return NextResponse.json({
        success: true,
        count: sanitizedMatches.length,
        area: selectedArea,
        matches: sanitizedMatches,
      });
    }

    // Default: list active providers with sanitized public details
    const allProviders = db.getProviders().map((p) => {
      const reviews = db.getReviewsForProvider(p.id);
      return {
        ...sanitizePublicProvider(p),
        reviews,
      };
    });

    return NextResponse.json({
      success: true,
      count: allProviders.length,
      providers: allProviders,
    });
  } catch (error) {
    console.error('Error in GET /api/providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
