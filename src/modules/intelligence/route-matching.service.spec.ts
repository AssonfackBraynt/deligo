import { RouteMatchingService } from './route-matching.service';

describe('RouteMatchingService', () => {
  const service = new RouteMatchingService();

  it('matches nearby requests to carrier routes', () => {
    const result = service.match({
      minimumScore: 0.5,
      carrierRoutes: [
        {
          id: 'route-1',
          carrierId: 'carrier-1',
          origin: { lat: 4.0833, lng: 9.7 },
          destination: { lat: 4.05, lng: 9.76 },
          preferredRadiusKm: 10,
          scheduleDays: ['monday'],
        },
      ],
      activeRequests: [
        {
          id: 'request-1',
          pickup: { lat: 4.084, lng: 9.701 },
          destination: { lat: 4.051, lng: 9.761 },
          expectedDay: 'monday',
          rewardAmount: 3000,
        },
      ],
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matchScore).toBeGreaterThan(0.8);
  });
});
