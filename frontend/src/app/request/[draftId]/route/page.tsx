'use client';

import { useParams } from 'next/navigation';
import { Clock, Map } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { useRequestStore } from '@/features/request/request-store';

export default function RouteInformationPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestStore((state) => state.getDraft(draftId));
  const updateDraft = useRequestStore((state) => state.updateDraft);
  const canContinue = Boolean(draft?.pickupAddress && draft?.destinationAddress);

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="route"
      title="Where should the item move?"
      description="Add the pickup and destination details. Landmarks help providers find the exact location faster."
      backHref={routes.requestType(draftId)}
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup Address">
            <Input
              value={draft?.pickupAddress ?? ''}
              onChange={(event) => updateDraft(draftId, { pickupAddress: event.target.value })}
              placeholder="Bonaberi, Douala"
            />
          </Field>
          <Field label="Destination Address">
            <Input
              value={draft?.destinationAddress ?? ''}
              onChange={(event) => updateDraft(draftId, { destinationAddress: event.target.value })}
              placeholder="Akwa, Douala"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup Landmark">
            <Input
              value={draft?.pickupLandmark ?? ''}
              onChange={(event) => updateDraft(draftId, { pickupLandmark: event.target.value })}
              placeholder="Near the pharmacy"
            />
          </Field>
          <Field label="Destination Landmark">
            <Input
              value={draft?.destinationLandmark ?? ''}
              onChange={(event) => updateDraft(draftId, { destinationLandmark: event.target.value })}
              placeholder="Opposite the bank"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expected Delivery Date">
            <Input
              type="date"
              value={draft?.expectedDeliveryDate ?? ''}
              onChange={(event) => updateDraft(draftId, { expectedDeliveryDate: event.target.value })}
            />
          </Field>
          <Field label="Expected Delivery Time">
            <Input
              type="time"
              value={draft?.expectedDeliveryTime ?? ''}
              onChange={(event) => updateDraft(draftId, { expectedDeliveryTime: event.target.value })}
            />
          </Field>
        </div>
        <Card className="shadow-none">
          <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div className="flex min-h-36 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <div className="text-center">
                <Map className="mx-auto mb-2 text-primary" size={28} aria-hidden="true" />
                <p className="text-sm font-semibold">Map preview</p>
              </div>
            </div>
            <Estimate icon={<Map size={18} aria-hidden="true" />} label="Distance" value="8.4 km" />
            <Estimate icon={<Clock size={18} aria-hidden="true" />} label="Duration" value="32 min" />
          </CardContent>
        </Card>
      </div>
      <RequestActions nextHref={routes.requestItem(draftId)} disabled={!canContinue} />
    </RequestFlowLayout>
  );
}

function Estimate({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
