import { Injectable } from '@nestjs/common';
import { ActiveRequestInputDto, CarrierRouteInputDto, MatchRoutesDto } from './dto/route-matching.dto';
import { RouteOpportunityMatchResult } from './intelligence.types';
import { clamp, haversineDistanceKm, inverseScore, roundScore } from './intelligence-scoring';

@Injectable()
export class RouteMatchingService {
  match(input: MatchRoutesDto): RouteOpportunityMatchResult {
    const minimumScore = input.minimumScore ?? 0.55;
    const matches = input.carrierRoutes.flatMap((route) =>
      input.activeRequests
        .map((request) => this.scoreMatch(route, request))
        .filter((match) => match.matchScore >= minimumScore),
    );

    return {
      matches: matches.sort((a, b) => b.matchScore - a.matchScore),
    };
  }

  private scoreMatch(route: CarrierRouteInputDto, request: ActiveRequestInputDto) {
    const pickupDistanceKm = haversineDistanceKm(route.origin, request.pickup);
    const destinationDistanceKm = haversineDistanceKm(route.destination, request.destination);
    const pickupScore = inverseScore(pickupDistanceKm, route.preferredRadiusKm);
    const destinationScore = inverseScore(destinationDistanceKm, route.preferredRadiusKm);
    const scheduleScore = this.scheduleScore(route, request);
    const rewardScore = request.rewardAmount ? clamp(request.rewardAmount / 5000) : 0.6;
    const matchScore = roundScore(
      pickupScore * 0.34 + destinationScore * 0.34 + scheduleScore * 0.2 + rewardScore * 0.12,
    );

    return {
      carrierRouteId: route.id,
      carrierId: route.carrierId,
      requestId: request.id,
      matchScore,
      pickupDistanceKm: Number(pickupDistanceKm.toFixed(2)),
      destinationDistanceKm: Number(destinationDistanceKm.toFixed(2)),
      scheduleScore: roundScore(scheduleScore),
      rewardAmount: request.rewardAmount,
    };
  }

  private scheduleScore(route: CarrierRouteInputDto, request: ActiveRequestInputDto): number {
    if (!request.expectedDay || !route.scheduleDays?.length) {
      return 0.65;
    }
    return route.scheduleDays.includes(request.expectedDay.toLowerCase()) ? 1 : 0.25;
  }
}
