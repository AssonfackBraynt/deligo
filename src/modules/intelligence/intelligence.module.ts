import { Module } from '@nestjs/common';
import { CostPredictionService } from './cost-prediction.service';
import { IntelligenceController } from './intelligence.controller';
import { ProviderRecommendationService } from './provider-recommendation.service';
import { RouteMatchingService } from './route-matching.service';
import { SmartDispatchService } from './smart-dispatch.service';

@Module({
  controllers: [IntelligenceController],
  providers: [
    CostPredictionService,
    ProviderRecommendationService,
    RouteMatchingService,
    SmartDispatchService,
  ],
  exports: [
    CostPredictionService,
    ProviderRecommendationService,
    RouteMatchingService,
    SmartDispatchService,
  ],
})
export class IntelligenceModule {}
