import { Injectable } from '@nestjs/common';
import {
  IntelligenceItemType,
  PredictDeliveryCostDto,
  ProviderRateInputDto,
} from './dto/cost-prediction.dto';
import { CostPredictionResult } from './intelligence.types';
import { clamp, roundMoney } from './intelligence-scoring';

const defaultRates: Record<IntelligenceItemType, ProviderRateInputDto> = {
  [IntelligenceItemType.Document]: { baseFee: 700, pricePerKm: 120, pricePerKg: 0, minPrice: 1000 },
  [IntelligenceItemType.Parcel]: { baseFee: 900, pricePerKm: 150, pricePerKg: 80, minPrice: 1300 },
  [IntelligenceItemType.Food]: { baseFee: 800, pricePerKm: 140, pricePerKg: 50, minPrice: 1200 },
  [IntelligenceItemType.Electronics]: {
    baseFee: 1200,
    pricePerKm: 170,
    pricePerKg: 100,
    fragileItemFee: 500,
    minPrice: 1800,
  },
  [IntelligenceItemType.Business]: { baseFee: 1000, pricePerKm: 150, pricePerKg: 70, minPrice: 1500 },
  [IntelligenceItemType.Intercity]: { baseFee: 2500, pricePerKm: 90, pricePerKg: 120, minPrice: 3500 },
  [IntelligenceItemType.Other]: { baseFee: 900, pricePerKm: 150, pricePerKg: 70, minPrice: 1300 },
};

@Injectable()
export class CostPredictionService {
  predict(input: PredictDeliveryCostDto): CostPredictionResult {
    const rate = input.providerRate ?? defaultRates[input.itemType];
    const weightKg = input.weightKg ?? 0;
    const fragileFee = input.fragile ? rate.fragileItemFee ?? 350 : 0;
    const ruleBasedCost =
      rate.baseFee + input.distanceKm * rate.pricePerKm + weightKg * (rate.pricePerKg ?? 0) + fragileFee;
    const boundedCost = Math.min(
      Math.max(ruleBasedCost, rate.minPrice ?? 0),
      rate.maxPrice ?? Number.POSITIVE_INFINITY,
    );

    const comparableHistory = input.historicalDeliveries?.filter(
      (delivery) => delivery.itemType === input.itemType && delivery.distanceKm > 0,
    );
    const historicalCost = comparableHistory?.length
      ? this.average(
          comparableHistory.map(
            (delivery) => (delivery.finalPrice / delivery.distanceKm) * Math.max(input.distanceKm, 1),
          ),
        )
      : undefined;

    const historyWeight = comparableHistory?.length ? clamp(comparableHistory.length / 20, 0.15, 0.45) : 0;
    const recommendedRaw = historicalCost
      ? boundedCost * (1 - historyWeight) + historicalCost * historyWeight
      : boundedCost;
    const recommendedCost = roundMoney(recommendedRaw);
    const spread = Math.max(250, recommendedCost * (historicalCost ? 0.18 : 0.25));

    const explanation = [
      'Base fee, distance rate, item type, item weight, and fragile handling are combined first.',
      'Provider pricing rules override default city/service pricing when supplied.',
      'Similar historical deliveries adjust the recommendation when available.',
    ];

    return {
      minimumCost: roundMoney(Math.max(rate.minPrice ?? 0, recommendedCost - spread)),
      maximumCost: roundMoney(rate.maxPrice ? Math.min(rate.maxPrice, recommendedCost + spread) : recommendedCost + spread),
      recommendedCost,
      currency: input.currency ?? 'XAF',
      confidence: comparableHistory?.length ? clamp(0.55 + comparableHistory.length / 50, 0.55, 0.86) : 0.48,
      explanation,
    };
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
