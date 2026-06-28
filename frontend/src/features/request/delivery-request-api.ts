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

export function counterOffer(trackingCode: string, offerId: string, amount: number, message?: string) {
  return apiClient.post<{ success: boolean }>(
    `/delivery-requests/track/${encodeURIComponent(trackingCode)}/offers/${encodeURIComponent(offerId)}/counter`,
    { amount, message },
  );
}

export type DeliveryRequestPublic = {
  trackingCode: string;
  requestStatus: string;
  fulfillmentMode: string | null;
  deliveryType: string;
  estimatedDeliveryCost: number | null;
  desiredRewardAmount: number | null;
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
  photoFileId: string | null;
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
    photoFileId?: string;
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
  nearbyBranchName: string | null;
  estimatedPrice: number | null;
};

export type EstimateDeliveryInput = {
  pickupQuarterId: string;
  destinationQuarterId: string;
  items: Array<{
    itemName: string;
    weightKg?: number;
    sizeLabel?: string;
    category?: string;
    quantity?: number;
    isFragile?: boolean;
  }>;
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

export function getRecommendedProviders(
  city?: string,
  itemHints?: { weightKg?: number; sizeLabel?: string; category?: string; quantity?: number; isFragile?: boolean },
  pickupQuarterId?: string,
  destinationQuarterId?: string,
) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (pickupQuarterId) params.set('pickupQuarterId', pickupQuarterId);
  if (destinationQuarterId) params.set('destinationQuarterId', destinationQuarterId);
  if (itemHints?.weightKg != null) params.set('weightKg', String(itemHints.weightKg));
  if (itemHints?.sizeLabel) params.set('sizeLabel', itemHints.sizeLabel);
  if (itemHints?.category) params.set('category', itemHints.category);
  if (itemHints?.quantity != null) params.set('quantity', String(itemHints.quantity));
  if (itemHints?.isFragile != null) params.set('isFragile', String(itemHints.isFragile));
  const qs = params.toString();
  return apiClient.get<RecommendedProvider[]>(`/delivery-requests/recommended-providers${qs ? '?' + qs : ''}`);
}

export function estimateDelivery(input: EstimateDeliveryInput) {
  return apiClient.post<{ estimatedCost: number; isSameTown: boolean }>('/delivery-requests/estimate', input);
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

