import { CostPredictionService } from './cost-prediction.service';
import { IntelligenceItemType } from './dto/cost-prediction.dto';

describe('CostPredictionService', () => {
  const service = new CostPredictionService();

  it('predicts a bounded recommended cost from provider rates', () => {
    const result = service.predict({
      distanceKm: 10,
      itemType: IntelligenceItemType.Parcel,
      weightKg: 2,
      fragile: true,
      providerRate: {
        baseFee: 1000,
        pricePerKm: 100,
        pricePerKg: 50,
        fragileItemFee: 300,
        minPrice: 2000,
        maxPrice: 5000,
      },
    });

    expect(result.recommendedCost).toBeGreaterThanOrEqual(2000);
    expect(result.maximumCost).toBeLessThanOrEqual(5000);
    expect(result.currency).toBe('XAF');
  });
});
