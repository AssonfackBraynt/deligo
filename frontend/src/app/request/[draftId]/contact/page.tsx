'use client';

import { useParams } from 'next/navigation';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Field, Input } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { useRequestStore } from '@/features/request/request-store';

export default function ContactBillingPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestStore((state) => state.getDraft(draftId));
  const updateDraft = useRequestStore((state) => state.updateDraft);
  const sameNumber = draft?.isPaymentNumberSame ?? true;
  const canContinue = Boolean(draft?.customerName && draft?.whatsappNumber && (sameNumber || draft?.paymentNumber));

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="contact"
      title="Contact and billing information"
      description="No customer account is required. We use this information to send payment, offer, and tracking updates."
      backHref={routes.requestProvider(draftId)}
    >
      <div className="grid gap-4">
        <Field label="Name">
          <Input
            value={draft?.customerName ?? ''}
            onChange={(event) => updateDraft(draftId, { customerName: event.target.value })}
            placeholder="Your name"
          />
        </Field>
        <Field label="WhatsApp Number">
          <Input
            type="tel"
            value={draft?.whatsappNumber ?? ''}
            onChange={(event) =>
              updateDraft(draftId, {
                whatsappNumber: event.target.value,
                paymentNumber: sameNumber ? event.target.value : draft?.paymentNumber,
              })
            }
            placeholder="+237600000000"
          />
        </Field>
        <fieldset className="rounded-lg border border-border bg-surface p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">
            Is this number also your payment number?
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3">
              <input
                type="radio"
                name="sameNumber"
                className="size-5 accent-primary"
                checked={sameNumber}
                onChange={() =>
                  updateDraft(draftId, {
                    isPaymentNumberSame: true,
                    paymentNumber: draft?.whatsappNumber,
                  })
                }
              />
              <span className="font-semibold">Yes</span>
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3">
              <input
                type="radio"
                name="sameNumber"
                className="size-5 accent-primary"
                checked={!sameNumber}
                onChange={() => updateDraft(draftId, { isPaymentNumberSame: false })}
              />
              <span className="font-semibold">No</span>
            </label>
          </div>
        </fieldset>
        {!sameNumber ? (
          <Field label="Payment Number">
            <Input
              type="tel"
              value={draft?.paymentNumber ?? ''}
              onChange={(event) => updateDraft(draftId, { paymentNumber: event.target.value })}
              placeholder="+237600000000"
            />
          </Field>
        ) : null}
        <Field label="Optional Email">
          <Input
            type="email"
            value={draft?.email ?? ''}
            onChange={(event) => updateDraft(draftId, { email: event.target.value })}
            placeholder="you@example.com"
          />
        </Field>
      </div>
      <RequestActions nextHref={routes.requestReview(draftId)} disabled={!canContinue} label="Review Request" />
    </RequestFlowLayout>
  );
}
