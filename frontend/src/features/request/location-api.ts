import { apiClient } from '@/lib/api-client';

export type Region = { id: string; name: string };
export type QuarterResult = { id: string; name: string; town: { id: string; name: string } };

export function listRegions(): Promise<Region[]> {
  return apiClient.get<Region[]>('/locations/regions');
}

export function listQuartersByRegion(regionId: string, search?: string): Promise<QuarterResult[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient.get<QuarterResult[]>(`/locations/regions/${regionId}/quarters${params}`);
}
