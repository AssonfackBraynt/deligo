export type RequestStep = 'type' | 'route' | 'item' | 'provider' | 'contact' | 'review' | 'payment';

export type DeliveryType =
  | 'agency_pickup'
  | 'document_delivery'
  | 'product_delivery'
  | 'purchase_delivery'
  | 'business_delivery'
  | 'intercity_delivery'
  | 'medication_delivery'
  | 'other';

export type ProviderSelectionMode = 'open_marketplace' | 'recommended_provider' | 'search_provider';

export type RequestDraft = {
  id: string;
  deliveryType?: DeliveryType;

  // Structured pickup location (set via LocationPickerModal)
  pickupQuarterId?: string;
  pickupQuarterName?: string;
  pickupTownName?: string;
  pickupRegionId?: string;
  pickupRegionName?: string;
  pickupLandmark?: string;

  // Structured destination location (set via LocationPickerModal)
  destinationQuarterId?: string;
  destinationQuarterName?: string;
  destinationTownName?: string;
  destinationRegionId?: string;
  destinationRegionName?: string;
  destinationLandmark?: string;

  // Medication delivery specific
  medicationDescription?: string;

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

  // Set after contact step
  customerContactId?: string;
  // Set after successful API submission
  publicTrackingCode?: string;
  requestId?: string;
};
