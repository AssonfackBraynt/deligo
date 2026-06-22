export type ProviderType = 'independent_rider' | 'courier_company' | 'logistics_company';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended';
export type AvailabilityStatus = 'available' | 'unavailable' | 'busy' | 'offline';

export type ProviderProfilePublic = {
  id: string;
  providerType: ProviderType;
  displayName: string;
  description?: string | null;
  baseCity?: string | null;
  baseCountry?: string | null;
  serviceCoverage?: string | null;
  businessAddress?: string | null;
  businessLat?: number | null;
  businessLng?: number | null;
  priceInTown?: number | null;
  priceInRegion?: number | null;
  ratingAverage: number;
  ratingCount: number;
  verificationStatus: VerificationStatus;
  availabilityStatus: AvailabilityStatus;
  isFeatured: boolean;
  phoneNumber?: string | null;
  recentReviews?: { rating: number; comment: string | null; createdAt: string }[];
};

export type ProviderProfilePrivate = ProviderProfilePublic & {
  userId?: string | null;
  agencyId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProviderBranch = {
  id: string;
  name: string;
  phoneNumber: string | null;
  isHeadquarters: boolean;
  isActive: boolean;
  quarterId: string;
  quarterName: string;
  townName: string;
  regionName: string;
  location: string;
  createdAt: string;
};

export type BranchStats = {
  branchId: string;
  name: string;
  isHeadquarters: boolean;
  isActive: boolean;
  phoneNumber: string | null;
  location: string;
  townId: string;
  activeRequests: number;
  completedDeliveries: number;
};

export type RiderRoute = {
  id: string;
  originQuarterId: string;
  originQuarterName: string;
  originTownName: string;
  originRegionName: string;
  originLabel: string;
  destinationQuarterId: string;
  destinationQuarterName: string;
  destinationTownName: string;
  destinationRegionName: string;
  destinationLabel: string;
  departureTime: string | null;
  isRecurring: boolean;
  recurringDays: string[];
  isActive: boolean;
  createdAt: string;
};

export type RouteMatchingJobs = {
  routeId: string;
  originTown: string;
  destinationTown: string;
  matchingJobs: Array<{
    id: string;
    trackingCode: string;
    requestStatus: string;
    deliveryType: string;
    desiredRewardAmount: number | null;
    estimatedDeliveryCost: number | null;
    createdAt: string;
    route: { pickup: string; pickupLandmark: string; destination: string; destinationLandmark: string } | null;
    items: { count: number; hasFragile: boolean; summary: string };
  }>;
};
