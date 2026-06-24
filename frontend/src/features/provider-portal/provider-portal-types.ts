export type MarketplacePost = {
  id: string;
  trackingCode: string;
  deliveryType: string;
  desiredRewardAmount: number | null;
  estimatedDeliveryCost: number | null;
  createdAt: string;
  route: {
    pickup: string;
    pickupLandmark: string;
    destination: string;
    destinationLandmark: string;
  } | null;
  items: {
    count: number;
    hasFragile: boolean;
    categories: string[];
    summary: string;
    photoFileId: string | null;
  };
  _hasBid?: boolean;
};

export type ProviderStats = {
  activeRequests: number;
  completedRequests: number;
  totalRequests: number;
  pendingOffers: number;
  ratingAverage: number;
  ratingCount: number;
  providerType: string;
  availabilityStatus: string;
};

export type ProviderAssignedRequest = {
  id: string;
  trackingCode: string;
  requestStatus: string;
  deliveryType: string;
  estimatedDeliveryCost: number | null;
  desiredRewardAmount: number | null;
  providerAssignedAt: string | null;
  createdAt: string;
  route: {
    pickup: string;
    pickupLandmark: string;
    destination: string;
    destinationLandmark: string;
  } | null;
  items: Array<{
    id: string;
    itemName: string;
    category: string | null;
    quantity: number;
    isFragile: boolean;
    photoFileId: string | null;
  }>;
};

export type ProviderOffer = {
  id: string;
  offerAmount: number;
  message: string | null;
  submittedAt: string;
  request: MarketplacePost;
};

export type AgentSummary = {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: string | null;
  availabilityStatus: string;
  verificationStatus: string;
  currentWorkload: number;
  activeDispatches: number;
  lastSeenAt: string | null;
};
