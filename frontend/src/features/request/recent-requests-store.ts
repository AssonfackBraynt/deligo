'use client';

const KEY = 'deligo-recent-requests';
const MAX = 10;

export type RecentRequest = {
  requestId: string;
  trackingCode: string;
  deliveryType?: string;
  createdAt: string;
};

export function saveRecentRequest(entry: RecentRequest): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadRecentRequests();
    const updated = [
      entry,
      ...current.filter((r) => r.requestId !== entry.requestId),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function loadRecentRequests(): RecentRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentRequest[]) : [];
  } catch {
    return [];
  }
}

export function clearRecentRequests(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
