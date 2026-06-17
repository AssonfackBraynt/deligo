'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import { useRequestStore } from '@/features/request/request-store';

export default function RequestStartPage() {
  const router = useRouter();
  const createDraft = useRequestStore((state) => state.createDraft);

  useEffect(() => {
    const draftId = createDraft();
    router.replace(routes.requestType(draftId));
  }, [createDraft, router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-sm font-semibold text-muted-foreground">Preparing your request...</p>
    </main>
  );
}
