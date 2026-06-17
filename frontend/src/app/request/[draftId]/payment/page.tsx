'use client';

import { useParams, useRouter } from 'next/navigation';
import { Smartphone, WalletCards } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { useRequestStore } from '@/features/request/request-store';

export default function PaymentPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const router = useRouter();
  const draft = useRequestStore((state) => state.getDraft(draftId));
  const amount = draft?.finalPrice ?? 0;

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="payment"
      title="Complete payment"
      description="Payment prevents fake requests. DeliGo holds the funds until delivery is confirmed."
      backHref={routes.requestReview(draftId)}
    >
      <Card>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Amount due</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">
              {amount.toLocaleString()} FCFA
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PaymentOption icon={<Smartphone size={22} />} title="Mobile Money" selected />
            <PaymentOption icon={<WalletCards size={22} />} title="Orange Money" />
          </div>
          <Field label="Payment Number">
            <Input type="tel" value={draft?.paymentNumber ?? draft?.whatsappNumber ?? ''} readOnly />
          </Field>
          <Button size="lg" className="w-full" onClick={() => router.push(routes.requestSuccess(draftId))}>
            Pay Now
          </Button>
        </CardContent>
      </Card>
    </RequestFlowLayout>
  );
}

function PaymentOption({
  icon,
  title,
  selected,
}: {
  icon: React.ReactNode;
  title: string;
  selected?: boolean;
}) {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-surface p-4 data-[selected=true]:border-primary data-[selected=true]:ring-2 data-[selected=true]:ring-primary/20" data-selected={selected}>
      <span className="text-primary">{icon}</span>
      <span className="font-semibold text-foreground">{title}</span>
    </div>
  );
}
