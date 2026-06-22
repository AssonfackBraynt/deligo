'use client';

import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrackingEvent = {
  eventType: string;
  statusAfterEvent: string | null;
  provider: string | null;
  notes: string | null;
  occurredAt: string;
};

export type DeliveryOffer = {
  id: string;
  provider: { name: string; rating: number; ratingCount: number } | null;
  amount: number;
  message: string | null;
  status: string;
  submittedAt: string;
};

export type DeliveryRequestPublic = {
  trackingCode: string;
  requestStatus: string;
  fulfillmentMode: string | null;
  deliveryType: string;
  estimatedDeliveryCost: number | null;
  createdAt: string;
  route: {
    pickup: string;
    pickupLandmark: string;
    destination: string;
    destinationLandmark: string;
  } | null;
  itemCount: number;
  hasFragileItems: boolean;
  events: TrackingEvent[];
  offers: DeliveryOffer[];
  review: { rating: number; comment: string | null } | null;
};

export type DeliveryRequestItem = {
  id: string;
  itemName: string;
  itemDescription: string | null;
  category: string | null;
  quantity: number;
  weightKg: number | null;
  sizeLabel: string | null;
  isFragile: boolean;
  specialInstructions: string | null;
};

export type DeliveryRequestPrivate = Omit<DeliveryRequestPublic, 'route'> & {
  id: string;
  customerContactId: string;
  selectedProviderProfileId: string | null;
  desiredRewardAmount: number | null;
  estimatedDeliveryCost: number | null;
  expectedDeliveryDate: string | null;
  route: {
    pickup: string;
    pickupQuarterId: string;
    pickupLandmark: string;
    destination: string;
    destinationQuarterId: string;
    destinationLandmark: string;
  } | null;
  items: DeliveryRequestItem[];
};

export type CreateDeliveryRequestInput = {
  customerContactId: string;
  fulfillmentMode?: string;
  deliveryType: string;
  expectedDeliveryDate?: string;
  desiredRewardAmount?: number;
  selectedProviderProfileId?: string;
  route: {
    pickupQuarterId: string;
    pickupLandmark: string;
    destinationQuarterId: string;
    destinationLandmark: string;
  };
  items: Array<{
    itemName: string;
    itemDescription?: string;
    category?: string;
    quantity?: number;
    weightKg?: number;
    sizeLabel?: string;
    isFragile?: boolean;
    specialInstructions?: string;
  }>;
};

export type RecommendedProvider = {
  id: string;
  displayName: string;
  providerType: string;
  baseCity: string | null;
  ratingAverage: number;
  ratingCount: number;
  verificationStatus: string;
  availabilityStatus: string;
  isFeatured: boolean;
};

// ── API calls ─────────────────────────────────────────────────────────────────

export function createDeliveryRequest(input: CreateDeliveryRequestInput) {
  return apiClient.post<DeliveryRequestPrivate>('/delivery-requests', input);
}

export function getDeliveryRequestByTrackingCode(code: string) {
  return apiClient.get<DeliveryRequestPublic>(`/delivery-requests/track/${encodeURIComponent(code)}`);
}

export function getMyDeliveryRequests() {
  return apiClient.get<DeliveryRequestPrivate[]>('/delivery-requests/me');
}

export function getRecommendedProviders(city?: string) {
  const q = city ? `?city=${encodeURIComponent(city)}` : '';
  return apiClient.get<RecommendedProvider[]>(`/delivery-requests/recommended-providers${q}`);
}

export function acceptOffer(trackingCode: string, offerId: string) {
  return apiClient.post<{ success: boolean }>(`/delivery-requests/track/${encodeURIComponent(trackingCode)}/offers/${offerId}/accept`, {});
}

export function rejectOffer(trackingCode: string, offerId: string) {
  return apiClient.post<{ success: boolean }>(`/delivery-requests/track/${encodeURIComponent(trackingCode)}/offers/${offerId}/reject`, {});
}

export function getReviewEligibility(trackingCode: string) {
  return apiClient.get<{ isEligible: boolean; existingReview: { rating: number; comment: string | null } | null; requestStatus: string }>(
    `/delivery-requests/track/${encodeURIComponent(trackingCode)}/review`,
  );
}

export function submitReview(trackingCode: string, rating: number, comment?: string) {
  return apiClient.post<{ success: boolean }>(`/delivery-requests/track/${encodeURIComponent(trackingCode)}/review`, { rating, comment });
}

export function updateReview(trackingCode: string, rating: number, comment?: string) {
  return apiClient.patch<{ success: boolean }>(`/delivery-requests/track/${encodeURIComponent(trackingCode)}/review`, { rating, comment });
}

export function cancelRequest(trackingCode: string, reason?: string) {
  return apiClient.post<{ success: boolean }>(`/delivery-requests/track/${encodeURIComponent(trackingCode)}/cancel`, { reason });
}

export function getRecommendedProvidersWithQuarters(pickupQuarterId?: string, destinationQuarterId?: string, city?: string) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (pickupQuarterId) params.set('pickupQuarterId', pickupQuarterId);
  if (destinationQuarterId) params.set('destinationQuarterId', destinationQuarterId);
  const qs = params.toString();
  return apiClient.get<Array<{ id: string; displayName: string; providerType: string; ratingAverage: number; ratingCount: number; verificationStatus: string; availabilityStatus: string; nearbyBranchName: string | null }>>(`/delivery-requests/recommended-providers${qs ? '?' + qs : ''}`);
}
