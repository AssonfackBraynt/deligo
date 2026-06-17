import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { ok } from '@common/dto/api-response.dto';
import { CostPredictionService } from './cost-prediction.service';
import { PredictDeliveryCostDto } from './dto/cost-prediction.dto';
import { RecommendProvidersDto } from './dto/provider-recommendation.dto';
import { MatchRoutesDto } from './dto/route-matching.dto';
import { SmartDispatchDto } from './dto/dispatch.dto';
import { ProviderRecommendationService } from './provider-recommendation.service';
import { RouteMatchingService } from './route-matching.service';
import { SmartDispatchService } from './smart-dispatch.service';

@ApiTags('MVP Intelligence')
@Controller('intelligence')
export class IntelligenceController {
  constructor(
    private readonly costPredictionService: CostPredictionService,
    private readonly providerRecommendationService: ProviderRecommendationService,
    private readonly routeMatchingService: RouteMatchingService,
    private readonly smartDispatchService: SmartDispatchService,
  ) {}

  @Public()
  @Post('cost-prediction')
  predictCost(@Body() dto: PredictDeliveryCostDto) {
    return ok(this.costPredictionService.predict(dto));
  }

  @Public()
  @Post('provider-recommendations')
  recommendProviders(@Body() dto: RecommendProvidersDto) {
    return ok(this.providerRecommendationService.recommend(dto));
  }

  @Public()
  @Post('route-matches')
  matchRoutes(@Body() dto: MatchRoutesDto) {
    return ok(this.routeMatchingService.match(dto));
  }

  @Public()
  @Post('dispatch-suggestions')
  suggestDispatch(@Body() dto: SmartDispatchDto) {
    return ok(this.smartDispatchService.suggest(dto));
  }
}
