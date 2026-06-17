import { ProviderRecommendationService } from './provider-recommendation.service';

describe('ProviderRecommendationService', () => {
  const service = new ProviderRecommendationService();

  it('ranks available providers and identifies cheapest/fastest labels', () => {
    const result = service.recommend({
      providers: [
        {
          id: 'a',
          name: 'A',
          distanceKm: 2,
          estimatedPrice: 2000,
          available: true,
          rating: 4.8,
          verificationLevel: 1,
          completionRate: 0.95,
          estimatedMinutes: 25,
        },
        {
          id: 'b',
          name: 'B',
          distanceKm: 3,
          estimatedPrice: 1500,
          available: true,
          rating: 4.2,
          verificationLevel: 0.8,
          completionRate: 0.9,
          estimatedMinutes: 40,
        },
      ],
    });

    expect(result.recommendedProviders).toHaveLength(2);
    expect(result.fastest).toBe('a');
    expect(result.cheapest).toBe('b');
    expect(result.bestMatch).toBeDefined();
  });
});
