import { Injectable } from '@nestjs/common';
import { DispatchRiderDto, SmartDispatchDto } from './dto/dispatch.dto';
import { SmartDispatchResult } from './intelligence.types';
import { haversineDistanceKm, inverseScore, roundScore } from './intelligence-scoring';

@Injectable()
export class SmartDispatchService {
  suggest(input: SmartDispatchDto): SmartDispatchResult {
    const suggestedRiders = input.riders
      .filter((rider) => rider.available)
      .map((rider) => this.scoreRider(rider, input.request.pickup))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit ?? 5)
      .map((rider, index) => ({ ...rider, rank: index + 1 }));

    return {
      suggestedRiders,
      bestRider: suggestedRiders[0]?.riderId,
    };
  }

  private scoreRider(rider: DispatchRiderDto, pickup: { lat: number; lng: number }) {
    const pickupDistanceKm = haversineDistanceKm(rider.currentLocation, pickup);
    const scoreBreakdown = {
      availability: rider.available ? 1 : 0,
      proximity: roundScore(inverseScore(pickupDistanceKm, 15)),
      workload: roundScore(inverseScore(rider.currentWorkload, 8)),
      verification: roundScore(rider.verificationLevel ?? 0.65),
      rating: roundScore((rider.rating ?? 3.5) / 5),
    };
    const score = roundScore(
      scoreBreakdown.availability * 0.2 +
        scoreBreakdown.proximity * 0.34 +
        scoreBreakdown.workload * 0.22 +
        scoreBreakdown.verification * 0.14 +
        scoreBreakdown.rating * 0.1,
    );

    return {
      riderId: rider.id,
      name: rider.name,
      score,
      rank: 0,
      pickupDistanceKm: Number(pickupDistanceKm.toFixed(2)),
      scoreBreakdown,
    };
  }
}
