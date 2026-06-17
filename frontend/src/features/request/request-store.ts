'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RequestDraft } from './request-types';

type RequestState = {
  drafts: Record<string, RequestDraft>;
  createDraft: (initial?: Partial<RequestDraft>) => string;
  updateDraft: (draftId: string, patch: Partial<RequestDraft>) => void;
  getDraft: (draftId: string) => RequestDraft | undefined;
};

function createDraftId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      drafts: {},
      createDraft: (initial) => {
        const id = createDraftId();
        set((state) => ({
          drafts: {
            ...state.drafts,
            [id]: { id, ...initial },
          },
        }));
        return id;
      },
      updateDraft: (draftId, patch) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [draftId]: {
              ...state.drafts[draftId],
              ...patch,
              id: draftId,
            },
          },
        }));
      },
      getDraft: (draftId) => get().drafts[draftId],
    }),
    {
      name: 'deligo-request-drafts',
    },
  ),
);
