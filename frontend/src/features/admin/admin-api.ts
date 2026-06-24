import { apiClient } from '@/lib/api-client';

// ── Report types ───────────────────────────────────────────────────────────────

export type ReportPreset = 'day' | '7d' | '15d' | '30d' | '6m' | '1y' | 'custom';

export type AdminReport = {
  period: { from: string; to: string; days: number };
  deliveries: { new: number; completed: number; active: number; cancelled: number; disputed: number };
  users: { newRegistrations: number };
  providers: { newRegistrations: number; verifiedInPeriod: number };
  verifications: { submitted: number; approved: number; rejected: number };
  reviews: { count: number; averageRating: number | null };
};

// ── Chart data ─────────────────────────────────────────────────────────────────

export type AdminChartData = {
  trend: Array<{ day: string; deliveries: number; users: number }>;
  providerBreakdown: Array<{ name: string; value: number }>;
  statusBreakdown: Array<{ name: string; value: number }>;
};

export async function getAdminChartData(): Promise<AdminChartData> {
  return apiClient.get<AdminChartData>('/admin/chart-data');
}

export async function getAdminReport(
  preset: ReportPreset,
  opts?: { date?: string; from?: string; to?: string },
): Promise<AdminReport> {
  const params = new URLSearchParams({ preset });
  if (opts?.date) params.set('date', opts.date);
  if (opts?.from) params.set('from', opts.from);
  if (opts?.to) params.set('to', opts.to);
  return apiClient.get<AdminReport>(`/admin/reports?${params.toString()}`);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalProviders: number;
  pendingVerifications: number;
  verifiedProviders: number;
  activeRequests: number;
  openMarketplaceRequests: number;
  completedDeliveries: number;
  totalRatings: number;
  totalNotifications: number;
  totalUsers: number;
};

export type AdminProvider = {
  id: string;
  displayName: string;
  providerType: string;
  verificationStatus: string;
  availabilityStatus: string;
  baseCity: string | null;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    accountStatus: string;
  };
};

export type VerificationQueueItem = {
  id: string;
  verificationType: string;
  status: string;
  documentFileId: string | null;
  submittedValue: string | null;
  rejectionReason: string | null;
  approvalNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  provider: {
    id: string;
    displayName: string;
    providerType: string;
    verificationStatus: string;
  } | null;
};

export type AdminRequest = {
  id: string;
  trackingCode: string;
  requestStatus: string;
  fulfillmentMode: string;
  deliveryType: string;
  estimatedCost: number | null;
  customerName: string;
  customerWhatsapp: string;
  providerName: string | null;
  pickup: string | null;
  destination: string | null;
  itemCount: number;
  trackingEventCount: number;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  accountStatus: string;
  roles: string[];
  providerProfile: { id: string; displayName: string; verificationStatus: string } | null;
  createdAt: string;
  lastLoginAt: string | null;
};

// ── API calls ─────────────────────────────────────────────────────────────────

export function getAdminStats(): Promise<AdminStats> {
  return apiClient.get<AdminStats>('/admin/stats');
}

export function listAdminProviders(params?: {
  page?: number;
  limit?: number;
  providerType?: string;
  verificationStatus?: string;
  search?: string;
}): Promise<{ items: AdminProvider[]; total: number; page: number; limit: number }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.providerType) q.set('providerType', params.providerType);
  if (params?.verificationStatus) q.set('verificationStatus', params.verificationStatus);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return apiClient.get(`/admin/providers${qs ? `?${qs}` : ''}`);
}

export function listVerificationQueue(status?: string): Promise<VerificationQueueItem[]> {
  const qs = status ? `?status=${status}` : '';
  return apiClient.get<VerificationQueueItem[]>(`/admin/verifications${qs}`);
}

export function reviewVerificationRecord(
  recordId: string,
  dto: { status: 'approved' | 'rejected'; rejectionReason?: string; approvalNotes?: string },
): Promise<{ id: string; status: string }> {
  return apiClient.patch(`/admin/verifications/${recordId}`, dto);
}

export function listAdminRequests(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ items: AdminRequest[]; total: number; page: number; limit: number }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return apiClient.get(`/admin/requests${qs ? `?${qs}` : ''}`);
}

export function listAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ items: AdminUser[]; total: number; page: number; limit: number }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return apiClient.get(`/admin/users${qs ? `?${qs}` : ''}`);
}

export function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'deactivated',
  suspensionReason?: string,
): Promise<{ success: boolean }> {
  return apiClient.patch(`/admin/users/${userId}/status`, { accountStatus: status, suspensionReason });
}

export function suspendProviderUser(
  userId: string,
  reason: string,
): Promise<{ success: boolean }> {
  return updateUserStatus(userId, 'suspended', reason);
}

export function unsuspendProviderUser(
  userId: string,
): Promise<{ success: boolean }> {
  return updateUserStatus(userId, 'active');
}
