'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Edit3 } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { deliveryTypes } from '@/features/request/request-data';
import { useRequestStore } from '@/features/request/request-store';

export default function RequestReviewPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestStore((state) => state.getDraft(draftId));
  const platformFee = 300;
  const deliveryCost = draft?.finalPrice ? Math.max(draft.finalPrice - platformFee, 0) : 0;
  const total = draft?.finalPrice ?? 0;

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="review"
      title="Review your request"
      description="Check your delivery details before payment. The request becomes active only after payment is confirmed."
      backHref={routes.requestContact(draftId)}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">Request Summary</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={routes.requestType(draftId)}>
                <Edit3 size={16} aria-hidden="true" />
                Edit Request
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          <ReviewRow label="Delivery Type" value={deliveryTypes.find((type) => type.value === draft?.deliveryType)?.title} />
          <ReviewRow label="Pickup" value={draft?.pickupAddress} />
          <ReviewRow label="Destination" value={draft?.destinationAddress} />
          <ReviewRow label="Item" value={draft?.itemName} />
          <ReviewRow label="Selected Provider" value={draft?.selectedProviderName ?? draft?.providerMode?.replaceAll('_', ' ')} />
          <ReviewRow label="Delivery Cost" value={`${deliveryCost.toLocaleString()} FCFA`} />
          <ReviewRow label="Platform Fee" value={`${platformFee.toLocaleString()} FCFA`} />
          <ReviewRow label="Total Amount" value={`${total.toLocaleString()} FCFA`} strong />
          <ReviewRow label="Billing Account" value={draft?.paymentNumber ?? draft?.whatsappNumber} />
          <ReviewRow label="Expected Delivery Date" value={draft?.expectedDeliveryDate} />
        </CardContent>
      </Card>
      <RequestActions nextHref={routes.requestPayment(draftId)} disabled={!total} label="Proceed to Payment" />
    </RequestFlowLayout>
  );
}

function ReviewRow({ label, value, strong }: { label: string; value?: string; strong?: boolean }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-[220px_1fr] sm:gap-4 sm:p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={strong ? 'text-lg font-semibold text-foreground' : 'text-sm text-foreground'}>
        {value || 'Not provided'}
      </p>
    </div>
  );
}
