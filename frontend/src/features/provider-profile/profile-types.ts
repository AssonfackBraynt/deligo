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
