// 10-Factor Smart Provider Matching Engine
import { ProviderProfile, ProviderMatchResult, User, PlatformSettings } from '../db/types';
import { calculateDistanceKm } from '../constants/locations';
import { db } from '../db/database';

export interface MatchCriteria {
  category: string;
  subcategory?: string;
  customerLat: number;
  customerLon: number;
  maxRadiusKm?: number;
  urgency?: 'low' | 'normal' | 'urgent';
  targetBudget?: number;
}

/**
 * Executes the 10-Factor Provider Matching Engine with configurable admin weights
 */
export function rankProvidersForRequest(
  criteria: MatchCriteria,
  customSettings?: PlatformSettings
): ProviderMatchResult[] {
  const settings = customSettings || db.settings;
  const weights = settings.matchingWeights;
  const providers = db.getProviders();

  const results: ProviderMatchResult[] = [];

  for (const provider of providers) {
    // Check if provider is suspended or rejected
    if (provider.verificationStatus === 'SUSPENDED' || provider.verificationStatus === 'REJECTED') {
      continue;
    }

    const user = db.getUserById(provider.userId);
    if (!user) continue;

    // 1. Category & Subcategory Match (30% weight)
    let categoryScore = 0;
    const isPrimaryCat = provider.primaryCategory.toLowerCase() === criteria.category.toLowerCase();
    const hasCategory = provider.categories.some(
      (c) => c.toLowerCase() === criteria.category.toLowerCase()
    );

    if (isPrimaryCat) {
      categoryScore = 80;
    } else if (hasCategory) {
      categoryScore = 60;
    } else {
      // Not a category match at all
      continue;
    }

    if (criteria.subcategory) {
      const hasSubcat = provider.subcategories.some(
        (s) => s.toLowerCase().includes(criteria.subcategory!.toLowerCase()) ||
               criteria.subcategory!.toLowerCase().includes(s.toLowerCase())
      );
      if (hasSubcat) {
        categoryScore += 20; // 100/100
      }
    } else {
      categoryScore += 20;
    }

    // 2. Distance Score (20% weight)
    const distanceKm = calculateDistanceKm(
      criteria.customerLat,
      criteria.customerLon,
      provider.latitude,
      provider.longitude
    );

    // If beyond provider's maximum service radius, penalize heavily or filter
    const maxRadius = provider.serviceRadiusKm || settings.defaultSearchRadiusKm;
    let distanceScore = 0;
    if (distanceKm <= 2.0) {
      distanceScore = 100; // Hyper-local within Chilakaluripet center
    } else if (distanceKm <= 5.0) {
      distanceScore = 85;
    } else if (distanceKm <= 10.0) {
      distanceScore = 70;
    } else if (distanceKm <= maxRadius) {
      distanceScore = Math.max(30, Math.round(100 - (distanceKm / maxRadius) * 60));
    } else {
      distanceScore = 10; // Exceeds standard radius
    }

    // 3. Availability Score (15% weight)
    let availabilityScore = 70;
    if (provider.workingHours.isAvailableToday) {
      availabilityScore += 30; // 100
    }
    if (criteria.urgency === 'urgent' && !provider.workingHours.isAvailableToday) {
      availabilityScore = 20;
    }

    // 4. Rating Score (10% weight)
    // Scaled from 0-5 stars to 0-100
    const ratingScore = Math.min(100, Math.round((provider.metrics.rating / 5.0) * 100));

    // 5. Completion Rate Score (10% weight)
    // 100% completion = 100, penalize for cancellations
    const effectiveCompletionRate = Math.max(0, 100 - provider.metrics.cancellationRate * 3);
    const completionRateScore = Math.min(100, Math.round(effectiveCompletionRate));

    // 6. Response Rate & Speed Score (5% weight)
    const responseSpeedBonus = provider.metrics.avgResponseMinutes <= 10 ? 10 : 0;
    const responseRateScore = Math.min(100, Math.round(provider.metrics.responseRate * 0.9 + responseSpeedBonus));

    // 7. Price Compatibility Score (10% weight)
    let priceScore = 85;
    if (criteria.targetBudget && criteria.targetBudget > 0) {
      if (provider.pricingModel.visitingCharge <= criteria.targetBudget) {
        priceScore = 100;
      } else {
        const ratio = criteria.targetBudget / provider.pricingModel.visitingCharge;
        priceScore = Math.max(20, Math.round(ratio * 100));
      }
    } else {
      // Reasonable visiting charge in Chilakaluripet (<= ₹250 gets high score)
      if (provider.pricingModel.visitingCharge <= 200) priceScore = 95;
      else if (provider.pricingModel.visitingCharge <= 300) priceScore = 85;
      else priceScore = 70;
    }

    // Trust modifier: Verified providers get a reliability boost
    const verificationMultiplier = provider.verificationStatus === 'VERIFIED' ? 1.05 : 0.95;

    // Calculate Overall Weighted Match Score (0 - 100)
    const weightedSum =
      categoryScore * weights.categoryMatch +
      distanceScore * weights.distance +
      availabilityScore * weights.availability +
      ratingScore * weights.rating +
      completionRateScore * weights.completionRate +
      responseRateScore * weights.responseRate +
      priceScore * weights.priceCompatibility;

    const overallScore = Math.min(99, Math.round(weightedSum * verificationMultiplier));

    results.push({
      provider,
      user,
      overallScore,
      breakdown: {
        categoryMatchScore: categoryScore,
        distanceScore,
        distanceKm,
        availabilityScore,
        ratingScore,
        completionRateScore,
        responseRateScore,
        priceScore,
      },
    });
  }

  // Sort descending by overall match score
  return results.sort((a, b) => b.overallScore - a.overallScore);
}
