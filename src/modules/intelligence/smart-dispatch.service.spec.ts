import { SmartDispatchService } from './smart-dispatch.service';

describe('SmartDispatchService', () => {
  const service = new SmartDispatchService();

  it('prioritizes nearby available riders with lower workload', () => {
    const result = service.suggest({
      request: {
        id: 'request-1',
        pickup: { lat: 4.05, lng: 9.76 },
        destination: { lat: 4.06, lng: 9.77 },
      },
      riders: [
        {
          id: 'far-busy',
          name: 'Far Busy',
          available: true,
          currentWorkload: 6,
          currentLocation: { lat: 4.2, lng: 9.9 },
          verificationLevel: 1,
          rating: 5,
        },
        {
          id: 'near-free',
          name: 'Near Free',
          available: true,
          currentWorkload: 1,
          currentLocation: { lat: 4.051, lng: 9.761 },
          verificationLevel: 0.9,
          rating: 4.5,
        },
      ],
    });

    expect(result.bestRider).toBe('near-free');
    expect(result.suggestedRiders[0].rank).toBe(1);
  });
});
