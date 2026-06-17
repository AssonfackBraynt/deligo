'use client';

import { useParams } from 'next/navigation';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { FileUploadHint } from '@/components/ui/file-upload';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { useRequestStore } from '@/features/request/request-store';

export default function ItemInformationPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestStore((state) => state.getDraft(draftId));
  const updateDraft = useRequestStore((state) => state.updateDraft);

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="item"
      title="What is being delivered?"
      description="Give providers enough item detail to price and handle the delivery responsibly."
      backHref={routes.requestRoute(draftId)}
    >
      <div className="grid gap-4">
        <Field label="Item Name">
          <Input
            value={draft?.itemName ?? ''}
            onChange={(event) => updateDraft(draftId, { itemName: event.target.value })}
            placeholder="Documents, package, groceries"
          />
        </Field>
        <Field label="Item Description">
          <Textarea
            value={draft?.itemDescription ?? ''}
            onChange={(event) => updateDraft(draftId, { itemDescription: event.target.value })}
            placeholder="Describe the item and handling needs"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            <Select
              value={draft?.category ?? ''}
              onChange={(event) => updateDraft(draftId, { category: event.target.value })}
            >
              <option value="">Select</option>
              <option value="documents">Documents</option>
              <option value="parcel">Parcel</option>
              <option value="food">Food</option>
              <option value="electronics">Electronics</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Weight">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={draft?.weightKg ?? ''}
              onChange={(event) => updateDraft(draftId, { weightKg: Number(event.target.value) })}
              placeholder="kg"
            />
          </Field>
          <Field label="Quantity">
            <Input
              type="number"
              min="1"
              value={draft?.quantity ?? 1}
              onChange={(event) => updateDraft(draftId, { quantity: Number(event.target.value) })}
            />
          </Field>
        </div>
        <Field label="Size">
          <Select
            value={draft?.sizeLabel ?? ''}
            onChange={(event) => updateDraft(draftId, { sizeLabel: event.target.value })}
          >
            <option value="">Select size</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="oversized">Oversized</option>
          </Select>
        </Field>
        <FileUploadHint />
        <label className="flex min-h-12 items-center justify-between rounded-lg border border-border bg-surface px-4">
          <span className="font-semibold text-foreground">Fragile Item</span>
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={draft?.isFragile ?? false}
            onChange={(event) => updateDraft(draftId, { isFragile: event.target.checked })}
          />
        </label>
        <Field label="Special Instructions">
          <Textarea
            value={draft?.specialInstructions ?? ''}
            onChange={(event) => updateDraft(draftId, { specialInstructions: event.target.value })}
            placeholder="Pickup notes, delivery notes, safety instructions"
          />
        </Field>
      </div>
      <RequestActions nextHref={routes.requestProvider(draftId)} disabled={!draft?.itemName} />
    </RequestFlowLayout>
  );
}
