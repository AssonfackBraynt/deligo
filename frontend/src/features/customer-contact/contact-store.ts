'use client';

// ── Contact ID ────────────────────────────────────────────────────────────────

const ID_KEY = 'deligo-contact-id';

export function saveContactId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ID_KEY, id);
}

export function loadContactId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ID_KEY);
}

export function clearContactId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ID_KEY);
}

// ── Contact cache (stores name + numbers so the contact step can show a summary) ──

const CACHE_KEY = 'deligo-contact-cache';

export type CachedContact = {
  id: string;
  fullName: string;
  whatsappNumber: string;
  paymentNumber: string | null;
};

export function saveContactCache(contact: CachedContact): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(contact));
}

export function loadContactCache(): CachedContact | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedContact) : null;
  } catch {
    return null;
  }
}

export function clearContactCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
}
