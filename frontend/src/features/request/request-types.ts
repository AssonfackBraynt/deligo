export type RequestStep = 'type' | 'route' | 'item' | 'provider' | 'contact' | 'review' | 'payment';

export type DeliveryType =
  | 'agency_pickup'
  | 'document_delivery'
  | 'product_delivery'
  | 'purchase_delivery'
  | 'business_delivery'
  | 'intercity_delivery'
  | 'other';

export type ProviderSelectionMode = 'open_marketplace' | 'recommended_provider' | 'search_provider';

export type RequestDraft = {
  id: string;
  deliveryType?: DeliveryType;
  pickupAddress?: string;
  destinationAddress?: string;
  pickupLandmark?: string;
  destinationLandmark?: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  estimatedDistanceKm?: number;
  estimatedDurationMinutes?: number;
  itemName?: string;
  itemDescription?: string;
  category?: string;
  weightKg?: number;
  sizeLabel?: string;
  quantity?: number;
  isFragile?: boolean;
  specialInstructions?: string;
  providerMode?: ProviderSelectionMode;
  desiredRewardAmount?: number;
  selectedProviderId?: string;
  selectedProviderName?: string;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  finalPrice?: number;
  customerName?: string;
  whatsappNumber?: string;
  isPaymentNumberSame?: boolean;
  paymentNumber?: string;
  email?: string;
};
