import { apiClient } from '@/lib/api-client';
import type {
  AgentSummary,
  MarketplacePost,
  ProviderAssignedRequest,
  ProviderOffer,
  ProviderStats,
} from './provider-portal-types';
import type { ProviderProfilePrivate } from '@/features/provider-profile/profile-types';

// ── Provider profile ──────────────────────────────────────────────────────────

export function getMyProfile(): Promise<ProviderProfilePrivate> {
  return apiClient.get<ProviderProfilePrivate>('/provider-profiles/me');
}

export function getStats(): Promise<ProviderStats> {
  return apiClient.get<ProviderStats>('/provider-profiles/me/stats');
}

export function updateAvailability(availabilityStatus: string): Promise<ProviderProfilePrivate> {
  return apiClient.patch<ProviderProfilePrivate>('/provider-profiles/me/availability', {
    availabilityStatus,
  });
}

export function getMyAgents(): Promise<AgentSummary[]> {
  return apiClient.get<AgentSummary[]>('/provider-profiles/me/agents');
}

// ── Marketplace ───────────────────────────────────────────────────────────────

export function listMarketplace(): Promise<MarketplacePost[]> {
  return apiClient.get<MarketplacePost[]>('/delivery-requests/marketplace');
}

export function takeRequest(requestId: string): Promise<ProviderAssignedRequest> {
  return apiClient.post<ProviderAssignedRequest>(`/delivery-requests/${requestId}/take`, {});
}

export function bidOnRequest(
  requestId: string,
  offerAmount: number,
  message?: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.post(`/delivery-requests/${requestId}/bid`, { offerAmount, message });
}

// ── My requests & offers ──────────────────────────────────────────────────────

export function getMyProviderRequests(): Promise<ProviderAssignedRequest[]> {
  return apiClient.get<ProviderAssignedRequest[]>('/delivery-requests/provider/my-requests');
}

export function getMyOffers(): Promise<ProviderOffer[]> {
  return apiClient.get<ProviderOffer[]>('/delivery-requests/provider/my-offers');
}

// ── Company: assign rider ─────────────────────────────────────────────────────

export function assignRider(
  requestId: string,
  riderId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.post(`/delivery-requests/${requestId}/assign-rider`, { riderId });
}

// ── Workflow actions ──────────────────────────────────────────────────────────

export type WorkflowAction = 'collect' | 'start_transit' | 'arrive' | 'deliver';

export function recordWorkflowAction(
  requestId: string,
  action: WorkflowAction,
): Promise<{ success: boolean; message: string; requestStatus: string }> {
  return apiClient.post(`/delivery-requests/${requestId}/workflow/${action}`, {});
}

export function acceptDirectRequest(
  requestId: string,
): Promise<{ success: boolean }> {
  return apiClient.post(`/delivery-requests/${requestId}/accept`, {});
}

export function rejectDirectRequest(
  requestId: string,
): Promise<{ success: boolean }> {
  return apiClient.post(`/delivery-requests/${requestId}/reject`, {});
}

export function getDirectRequests(): Promise<ProviderAssignedRequest[]> {
  return apiClient.get<ProviderAssignedRequest[]>('/delivery-requests/provider/direct-requests');
}

// ── Verification records ──────────────────────────────────────────────────────

export type VerificationRecord = {
  id: string;
  verificationType: string;
  status: string;
  documentFileId: string | null;
  submittedValue: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export function getMyVerificationRecords(): Promise<VerificationRecord[]> {
  return apiClient.get<VerificationRecord[]>('/provider-profiles/me/verification-records');
}

export function submitVerificationRecord(dto: {
  verificationType: string;
  fileId: string;
  submittedValue?: string;
}): Promise<VerificationRecord> {
  return apiClient.post<VerificationRecord>('/provider-profiles/me/verification-records', dto);
}
