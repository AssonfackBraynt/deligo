'use client';

import { useParams } from 'next/navigation';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { RadioCard } from '@/components/ui/radio-card';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { deliveryTypes } from '@/features/request/request-data';
import { useRequestStore } from '@/features/request/request-store';
import { useRequestDraft } from '@/features/request/use-request-draft';
import type { DeliveryType } from '@/features/request/request-types';

export default function DeliveryTypePage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestDraft(draftId);
  const updateDraft = useRequestStore((state) => state.updateDraft);

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="type"
      title="What do you need delivered?"
      description="Choose the delivery category that best matches your request."
      backHref="/"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {deliveryTypes.map((type) => (
          <RadioCard
            key={type.value}
            title={type.title}
            description={type.description}
            icon={type.icon}
            selected={draft?.deliveryType === type.value}
            onClick={() => updateDraft(draftId, { deliveryType: type.value as DeliveryType })}
          />
        ))}
      </div>
      <RequestActions nextHref={routes.requestRoute(draftId)} disabled={!draft?.deliveryType} />
    </RequestFlowLayout>
  );
}
