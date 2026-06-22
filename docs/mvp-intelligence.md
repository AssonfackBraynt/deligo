# DeliGo MVP Intelligence Layer

This module intentionally avoids advanced AI models. It uses deterministic scoring algorithms and
rules that can be explained to operators, tuned by product teams, and audited during disputes.

## 1. Delivery Cost Prediction

Endpoint: `POST /api/v1/intelligence/cost-prediction`

### Data Inputs

- Distance in kilometers
- Item type
- Weight
- Fragile flag
- Currency
- Optional provider pricing rule
- Optional historical deliveries

### Algorithm

1. Select provider pricing rules when present, otherwise use MVP default service rates.
2. Compute `base fee + distance fee + weight fee + fragile fee`.
3. Apply provider minimum and maximum bounds.
4. Blend in similar historical deliveries when available.
5. Return minimum, maximum, recommended cost, confidence, and explanation.

### Data Outputs

- `minimumCost`
- `maximumCost`
- `recommendedCost`
- `currency`
- `confidence`
- `explanation`

## 2. Provider Recommendation Engine

Endpoint: `POST /api/v1/intelligence/provider-recommendations`

### Data Inputs

- Provider distance from pickup
- Estimated price
- Availability
- Rating
- Verification level
- Completion rate
- Estimated delivery time

### Algorithm

Weighted score:

- Distance: 20%
- Price: 22%
- Availability: 16%
- Rating: 16%
- Verification: 16%
- Reliability: 10%

Providers outside the max distance or currently unavailable are excluded. The service also marks
`Best Match`, `Fastest`, `Cheapest`, `Top Rated`, and `Highly Verified` style labels.

### Data Outputs

- Ranked provider list
- Best match provider id
- Fastest provider id
- Cheapest provider id
- Score breakdown per provider

## 3. Route Opportunity Matching

Endpoint: `POST /api/v1/intelligence/route-matches`

### Data Inputs

- Carrier route origin and destination
- Carrier preferred radius
- Carrier travel days
- Active request pickup and destination
- Request expected day
- Request reward

### Algorithm

Weighted score:

- Pickup proximity to route origin: 34%
- Destination proximity to route destination: 34%
- Schedule compatibility: 20%
- Reward attractiveness: 12%

The module uses Haversine distance for MVP geographic matching. Future database-backed matching can
replace this with PostGIS proximity queries before scoring.

### Data Outputs

- Carrier route id
- Carrier id
- Request id
- Match score
- Pickup distance
- Destination distance
- Schedule score
- Reward amount

## 4. Agency Smart Dispatching

Endpoint: `POST /api/v1/intelligence/dispatch-suggestions`

### Data Inputs

- Request pickup and destination
- Rider availability
- Rider current workload
- Rider current location
- Rider verification level
- Rider rating

### Algorithm

Weighted score:

- Availability: 20%
- Pickup proximity: 34%
- Current workload: 22%
- Verification: 14%
- Rating: 10%

Unavailable riders are excluded. The highest ranked rider is returned as the suggested assignment.

### Data Outputs

- Ranked rider list
- Best rider id
- Pickup distance
- Score breakdown per rider

## Future AI Upgrade Path

The current services produce explainable features and outcomes. That creates a clean upgrade path:

1. Store recommendation inputs, scores, accepted providers, completion outcomes, and
   dispute outcomes.
2. Add analytics tables or event streams for training data.
3. Replace individual rule weights with learned weights after enough completed deliveries.
4. Introduce supervised ML for price prediction and provider ranking.
5. Keep rule-based constraints as safety rails: verification, distance limits, availability, and fraud
   rules should remain deterministic.
6. Add human-readable explanations even when ML models are introduced.
