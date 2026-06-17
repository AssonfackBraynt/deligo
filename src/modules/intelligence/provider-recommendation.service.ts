import { Injectable } from '@nestjs/common';
import { ProviderCandidateDto, RecommendProvidersDto } from './dto/provider-recommendation.dto';
import { ProviderRecommendationResult } from './intelligence.types';
import { clamp, inverseScore, roundScore } from './intelligence-scoring';

@Injectable()
export class ProviderRecommendationService {
  recommend(input: RecommendProvidersDto): ProviderRecommendationResult {
    const maxDistance = input.maxDistanceKm ?? 25;
    const availableProviders = input.providers.filter(
      (provider) => provider.available && provider.distanceKm <= maxDistance,
    );
    const cheapestPrice = Math.min(...availableProviders.map((provider) => provider.estimatedPrice), Infinity);
    const fastestMinutes = Math.min(
      ...availableProviders.map((provider) => provider.estimatedMinutes ?? 9999),
      Infinity,
    );

    const ranked = availableProviders
      .map((provider) => {
        const scoreBreakdown = this.scoreProvider(provider, {
          maxDistance,
          cheapestPrice,
          fastestMinutes,
        });
        const score = roundScore(
          scoreBreakdown.distance * 0.2 +
            scoreBreakdown.price * 0.22 +
            scoreBreakdown.availability * 0.16 +
            scoreBreakdown.rating * 0.16 +
            scoreBreakdown.verification * 0.16 +
            scoreBreakdown.reliability * 0.1,
        );

        return {
          providerId: provider.id,
          name: provider.name,
          score,
          rank: 0,
          labels: this.labelsFor(provider, cheapestPrice, fastestMinutes),
          scoreBreakdown,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit ?? 10)
      .map((provider, index) => ({ ...provider, rank: index + 1 }));

    return {
      recommendedProviders: ranked,
      bestMatch: ranked[0]?.providerId,
      fastest: this.pickFastest(availableProviders),
      cheapest: this.pickCheapest(availableProviders),
    };
  }

  private scoreProvider(
    provider: ProviderCandidateDto,
    context: { maxDistance: number; cheapestPrice: number; fastestMinutes: number },
  ): Record<string, number> {
    const priceRatio = context.cheapestPrice / Math.max(provider.estimatedPrice, 1);
    const speedScore = provider.estimatedMinutes
      ? context.fastestMinutes / Math.max(provider.estimatedMinutes, 1)
      : 0.65;

    return {
      distance: roundScore(inverseScore(provider.distanceKm, context.maxDistance)),
      price: roundScore(clamp(priceRatio)),
      availability: provider.available ? 1 : 0,
      rating: roundScore(clamp(provider.rating / 5)),
      verification: roundScore(provider.verificationLevel),
      reliability: roundScore(provider.completionRate ?? 0.65),
      speed: roundScore(clamp(speedScore)),
    };
  }

  private labelsFor(
    provider: ProviderCandidateDto,
    cheapestPrice: number,
    fastestMinutes: number,
  ): string[] {
    const labels: string[] = [];
    if (provider.estimatedPrice === cheapestPrice) labels.push('Cheapest');
    if (provider.estimatedMinutes === fastestMinutes) labels.push('Fastest');
    if (provider.verificationLevel >= 0.9) labels.push('Highly Verified');
    if (provider.rating >= 4.5) labels.push('Top Rated');
    return labels;
  }

  private pickFastest(providers: ProviderCandidateDto[]): string | undefined {
    return providers
      .filter((provider) => provider.estimatedMinutes !== undefined)
      .sort((a, b) => (a.estimatedMinutes ?? Infinity) - (b.estimatedMinutes ?? Infinity))[0]?.id;
  }

  private pickCheapest(providers: ProviderCandidateDto[]): string | undefined {
    return providers.sort((a, b) => a.estimatedPrice - b.estimatedPrice)[0]?.id;
  }
}
