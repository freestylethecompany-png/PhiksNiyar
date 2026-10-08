import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { rankProvidersForRequest } from '@/lib/ai/matchEngine';
import { CHILAKALURIPET_AREAS } from '@/lib/constants/locations';

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

      return NextResponse.json({
        success: true,
        count: rankedMatches.length,
        area: selectedArea,
        matches: rankedMatches,
      });
    }

    // Default: list all active providers with basic details
    const allProviders = db.getProviders().map((p) => {
      const user = db.getUserById(p.userId);
      const reviews = db.getReviewsForProvider(p.id);
      return {
        ...p,
        user,
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
