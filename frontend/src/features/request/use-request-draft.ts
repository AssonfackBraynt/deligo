'use client';

import { useEffect, useState } from 'react';
import { useRequestStore } from './request-store';
import type { RequestDraft } from './request-types';

/**
 * Reads a draft from the persisted Zustand store safely.
 * Returns undefined on the server and on first client render so that
 * the hydrated HTML always matches the server-rendered HTML.
 * After the first useEffect fires (client only), the real draft is returned.
 */
export function useRequestDraft(draftId: string): RequestDraft | undefined {
  const draft = useRequestStore((s) => s.getDraft(draftId));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? draft : undefined;
}
