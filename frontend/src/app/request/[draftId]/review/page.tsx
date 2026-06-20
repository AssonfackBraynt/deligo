'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Edit3 } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import { ApiError } from '@/lib/api-client';
import { createDeliveryRequest } from '@/features/request/delivery-request-api';
import { saveRecentRequest } from '@/features/request/recent-requests-store';
import { deliveryTypes } from '@/features/request/request-data';
import { useRequestStore } from '@/features/request/request-store';

export default function RequestReviewPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const router = useRouter();
  const draft = useRequestStore((s) => s.getDraft(draftId));
  const updateDraft = useRequestStore((s) => s.updateDraft);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const canSubmit = Boolean(
    draft?.customerContactId &&
    draft?.pickupQuarterId &&
    draft?.pickupLandmark &&
    draft?.destinationQuarterId &&
    draft?.destinationLandmark &&
    draft?.deliveryType &&
    draft?.itemName,
  );

  const isProviderSelected =
    (draft?.providerMode === 'recommended_provider' || draft?.providerMode === 'search_provider') &&
    Boolean(draft?.selectedProviderId);

  async function handlePostRequest() {
    if (!draft?.customerContactId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await createDeliveryRequest({
        customerContactId: draft.customerContactId,
        fulfillmentMode: draft.providerMode ?? 'open_marketplace',
        deliveryType: draft.deliveryType!,
        expectedDeliveryDate: draft.expectedDeliveryDate || undefined,
        desiredRewardAmount: draft.desiredRewardAmount || undefined,
        selectedProviderProfileId:
          draft.selectedProviderId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            draft.selectedProviderId,
          )
            ? draft.selectedProviderId
            : undefined,
        route: {
          pickupQuarterId: draft.pickupQuarterId!,
          pickupLandmark: draft.pickupLandmark!,
          destinationQuarterId: draft.destinationQuarterId!,
          destinationLandmark: draft.destinationLandmark!,
        },
        items: [
          {
            itemName: draft.itemName!,
            itemDescription: draft.itemDescription || undefined,
            category: draft.category || undefined,
            quantity: draft.quantity ?? 1,
            weightKg: draft.weightKg || undefined,
            sizeLabel: draft.sizeLabel || undefined,
            isFragile: draft.isFragile ?? false,
            specialInstructions: draft.specialInstructions || undefined,
          },
        ],
      });

      updateDraft(draftId, {
        publicTrackingCode: result.trackingCode,
        requestId: result.id,
      });

      saveRecentRequest({
        requestId: result.id,
        trackingCode: result.trackingCode,
        deliveryType: result.deliveryType,
        createdAt: String(result.createdAt),
      });

      router.push(routes.requestSuccess(draftId));
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : 'Failed to post request. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Helper: format quarter location string
  const pickupLocation = draft?.pickupQuarterName
    ? `${draft.pickupQuarterName}, ${draft.pickupTownName}, ${draft.pickupRegionName}`
    : null;

  const destinationLocation = draft?.destinationQuarterName
    ? `${draft.destinationQuarterName}, ${draft.destinationTownName}, ${draft.destinationRegionName}`
    : null;

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="review"
      title="Review your request"
      description="Check the details below. The request goes live immediately — providers can see it right away."
      backHref={routes.requestContact(draftId)}
    >
      {serverError && (
        <div className="rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">Request Summary</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={routes.requestType(draftId)}>
                <Edit3 size={16} aria-hidden="true" />
                Edit
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          <ReviewRow
            label="Delivery type"
            value={deliveryTypes.find((t) => t.value === draft?.deliveryType)?.title}
          />

          {/* Pickup */}
          {pickupLocation && (
            <>
              <ReviewRow label="Pickup" value={pickupLocation} />
              <ReviewRow label="Pickup landmark" value={draft?.pickupLandmark} />
            </>
          )}

          {/* Destination */}
          {destinationLocation && (
            <>
              <ReviewRow label="Destination" value={destinationLocation} />
              <ReviewRow label="Destination landmark" value={draft?.destinationLandmark} />
            </>
          )}

          <ReviewRow label="Item" value={draft?.itemName} />
          {draft?.isFragile && <ReviewRow label="Fragile" value="Yes" />}

          <ReviewRow
            label="Fulfillment"
            value={
              isProviderSelected
                ? 'Direct to provider'
                : (draft?.providerMode?.replaceAll('_', ' ') ?? 'open marketplace')
            }
          />
          {draft?.selectedProviderName && (
            <ReviewRow label="Provider" value={draft.selectedProviderName} />
          )}
          {draft?.desiredRewardAmount ? (
            <ReviewRow
              label="Desired reward"
              value={`${draft.desiredRewardAmount.toLocaleString()} FCFA`}
            />
          ) : null}
          {draft?.expectedDeliveryDate && (
            <ReviewRow label="Expected date" value={draft.expectedDeliveryDate} />
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="mt-4 w-full"
        disabled={!canSubmit || submitting}
        onClick={handlePostRequest}
      >
        {submitting
          ? isProviderSelected
            ? 'Notifying provider…'
            : 'Posting request…'
          : isProviderSelected
            ? 'Confirm Provider Request'
            : 'Post Request'}
        {!submitting && <ArrowRight size={19} aria-hidden="true" />}
      </Button>

      {!draft?.customerContactId && (
        <p className="mt-2 text-center text-sm text-danger">
          Contact information is missing.{' '}
          <Link href={routes.requestContact(draftId)} className="underline">
            Go back to add it.
          </Link>
        </p>
      )}
    </RequestFlowLayout>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-[200px_1fr] sm:gap-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm capitalize text-foreground">{value || '—'}</p>
    </div>
  );
}
