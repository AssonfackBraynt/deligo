'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ImagePlus, Pill, X } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { useRequestStore } from '@/features/request/request-store';
import { useRequestDraft } from '@/features/request/use-request-draft';
import { setPendingPhoto, getPendingPhotoUrl, clearPendingPhoto } from '@/features/request/pending-item-photo';

export default function ItemInformationPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestDraft(draftId);
  const updateDraft = useRequestStore((state) => state.updateDraft);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    () => getPendingPhotoUrl(draftId) ?? null,
  );

  const isMedication = draft?.deliveryType === 'medication_delivery';
  const canContinue = isMedication
    ? Boolean(draft?.medicationDescription?.trim())
    : Boolean(draft?.itemName?.trim());

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="item"
      title={isMedication ? 'What medication do you need?' : 'What is being delivered?'}
      description={
        isMedication
          ? 'Describe the medication or prescription so the provider can source it correctly from a pharmacy.'
          : 'Give providers enough item detail to price and handle the delivery responsibly.'
      }
      backHref={routes.requestRoute(draftId)}
    >
      <div className="grid gap-4">
        {/* Medication-specific fields */}
        {isMedication && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Pill size={15} className="text-warning" />
              Medication Request
            </div>
            <Field label="Medication / Prescription Description *">
              <Textarea
                value={draft?.medicationDescription ?? ''}
                onChange={(e) => updateDraft(draftId, { medicationDescription: e.target.value })}
                placeholder="E.g. Doliprane 500mg (2 boxes), Amoxicillin 500mg as per prescription from Dr. Nkolo — any pharmacy in Yaoundé Centre"
                rows={4}
              />
            </Field>
            <p className="mt-2 text-xs text-muted-foreground">
              Be as specific as possible — include dosage, quantity, and whether you have a prescription. The provider will contact you to confirm before purchasing.
            </p>
          </div>
        )}

        {/* Standard fields */}
        {!isMedication && (
          <>
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
          </>
        )}
        {/* Physical item properties — hidden for medication */}
        {!isMedication && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category">
                <Select
                  value={draft?.category ?? ''}
                  onChange={(event) => updateDraft(draftId, { category: event.target.value })}
                >
                  <option value="">Select</option>
                  <option value="document">Document</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="food">Food</option>
                  <option value="medical">Medical</option>
                  <option value="fragile">Fragile</option>
                  <option value="vehicle_parts">Vehicle Parts</option>
                  <option value="furniture">Furniture</option>
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
                <option value="small">Small (&lt;40 cm)</option>
                <option value="medium">Medium (40–70 cm)</option>
                <option value="large">Large (70–120 cm)</option>
                <option value="oversized">Oversized (&gt;120 cm)</option>
              </Select>
            </Field>
            {/* Item photo — stored locally until form is submitted */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Item Photo <span className="font-normal text-muted-foreground">(optional)</span></p>
              {previewUrl ? (
                <div className="relative w-fit">
                  <img
                    src={previewUrl}
                    alt="Item preview"
                    className="h-40 w-40 rounded-xl border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingPhoto(draftId);
                      setPreviewUrl(null);
                      updateDraft(draftId, { itemImageFileId: undefined });
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-danger text-white shadow"
                    aria-label="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary/50 hover:bg-muted/70"
                >
                  <ImagePlus size={28} />
                  <span className="text-xs">Add photo</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = setPendingPhoto(draftId, file);
                  setPreviewUrl(url);
                }}
              />
              <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 10 MB · helps provider identify the item</p>
            </div>
            <label className="flex min-h-12 items-center justify-between rounded-lg border border-border bg-surface px-4">
              <span className="font-semibold text-foreground">Fragile Item</span>
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={draft?.isFragile ?? false}
                onChange={(event) => updateDraft(draftId, { isFragile: event.target.checked })}
              />
            </label>
          </>
        )}
        <Field label={isMedication ? 'Additional Instructions' : 'Special Instructions'}>
          <Textarea
            value={draft?.specialInstructions ?? ''}
            onChange={(event) => updateDraft(draftId, { specialInstructions: event.target.value })}
            placeholder={
              isMedication
                ? 'Delivery notes, door code, preferred pharmacy brand, etc.'
                : 'Pickup notes, delivery notes, safety instructions'
            }
          />
        </Field>
      </div>
      <RequestActions nextHref={routes.requestProvider(draftId)} disabled={!canContinue} />
    </RequestFlowLayout>
  );
}
