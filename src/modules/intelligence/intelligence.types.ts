export type CostPredictionResult = {
  minimumCost: number;
  maximumCost: number;
  recommendedCost: number;
  currency: string;
  confidence: number;
  explanation: string[];
};

export type ProviderRecommendationResult = {
  recommendedProviders: Array<{
    providerId: string;
    name: string;
    score: number;
    rank: number;
    labels: string[];
    scoreBreakdown: Record<string, number>;
  }>;
  bestMatch?: string;
  fastest?: string;
  cheapest?: string;
};

export type RouteOpportunityMatchResult = {
  matches: Array<{
    carrierRouteId: string;
    carrierId: string;
    requestId: string;
    matchScore: number;
    pickupDistanceKm: number;
    destinationDistanceKm: number;
    scheduleScore: number;
    rewardAmount?: number;
  }>;
};

export type SmartDispatchResult = {
  suggestedRiders: Array<{
    riderId: string;
    name: string;
    score: number;
    rank: number;
    pickupDistanceKm: number;
    scoreBreakdown: Record<string, number>;
  }>;
  bestRider?: string;
};
