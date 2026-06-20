'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, MapPin, Pencil } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { LocationPickerModal } from '@/components/ui/location-picker-modal';
import type { LocationSelection } from '@/components/ui/location-picker-modal';
import { Field, Input } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { useRequestStore } from '@/features/request/request-store';

type PickerTarget = 'pickup' | 'destination' | null;

export default function RouteInformationPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestStore((state) => state.getDraft(draftId));
  const updateDraft = useRequestStore((state) => state.updateDraft);
  const [pickerOpen, setPickerOpen] = useState<PickerTarget>(null);

  const canContinue = Boolean(
    draft?.pickupQuarterId && draft?.pickupLandmark &&
    draft?.destinationQuarterId && draft?.destinationLandmark,
  );

  function handleSaveLocation(target: PickerTarget, sel: LocationSelection) {
    if (target === 'pickup') {
      updateDraft(draftId, {
        pickupQuarterId: sel.quarterId,
        pickupQuarterName: sel.quarterName,
        pickupTownName: sel.townName,
        pickupRegionName: sel.regionName,
        pickupLandmark: sel.landmark,
      });
    } else {
      updateDraft(draftId, {
        destinationQuarterId: sel.quarterId,
        destinationQuarterName: sel.quarterName,
        destinationTownName: sel.townName,
        destinationRegionName: sel.regionName,
        destinationLandmark: sel.landmark,
      });
    }
    setPickerOpen(null);
  }

  const pickupSelection: LocationSelection | undefined =
    draft?.pickupQuarterId
      ? {
          quarterId: draft.pickupQuarterId,
          quarterName: draft.pickupQuarterName ?? '',
          townName: draft.pickupTownName ?? '',
          regionName: draft.pickupRegionName ?? '',
          landmark: draft.pickupLandmark ?? '',
        }
      : undefined;

  const destinationSelection: LocationSelection | undefined =
    draft?.destinationQuarterId
      ? {
          quarterId: draft.destinationQuarterId,
          quarterName: draft.destinationQuarterName ?? '',
          townName: draft.destinationTownName ?? '',
          regionName: draft.destinationRegionName ?? '',
          landmark: draft.destinationLandmark ?? '',
        }
      : undefined;

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="route"
      title="Where should the item move?"
      description="Select a quarter for pickup and destination, then enter a landmark so the provider can find you."
      backHref={routes.requestType(draftId)}
    >
      <div className="grid gap-4">
        {/* Pickup */}
        <LocationButton
          label="Pickup Location"
          selection={pickupSelection}
          onOpen={() => setPickerOpen('pickup')}
        />

        {/* Destination */}
        <LocationButton
          label="Destination"
          selection={destinationSelection}
          onOpen={() => setPickerOpen('destination')}
        />

        {/* Optional date/time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expected Delivery Date">
            <Input
              type="date"
              value={draft?.expectedDeliveryDate ?? ''}
              onChange={(e) => updateDraft(draftId, { expectedDeliveryDate: e.target.value })}
            />
          </Field>
          <Field label="Expected Delivery Time">
            <Input
              type="time"
              value={draft?.expectedDeliveryTime ?? ''}
              onChange={(e) => updateDraft(draftId, { expectedDeliveryTime: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <RequestActions nextHref={routes.requestItem(draftId)} disabled={!canContinue} />

      {/* Pickup picker */}
      <LocationPickerModal
        open={pickerOpen === 'pickup'}
        onClose={() => setPickerOpen(null)}
        onSave={(sel) => handleSaveLocation('pickup', sel)}
        title="Pickup Location"
        initialValue={pickupSelection}
      />

      {/* Destination picker */}
      <LocationPickerModal
        open={pickerOpen === 'destination'}
        onClose={() => setPickerOpen(null)}
        onSave={(sel) => handleSaveLocation('destination', sel)}
        title="Destination"
        initialValue={destinationSelection}
      />
    </RequestFlowLayout>
  );
}

// ── Location button ────────────────────────────────────────────────────────────

function LocationButton({
  label,
  selection,
  onOpen,
}: {
  label: string;
  selection?: LocationSelection;
  onOpen: () => void;
}) {
  if (!selection) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-border px-4 py-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
      >
        <MapPin size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{label}</span>
          <br />
          Tap to choose quarter and landmark
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4">
      <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium text-foreground">{selection.quarterName}</p>
        <p className="text-sm text-muted-foreground">
          {selection.townName}, {selection.regionName}
        </p>
        <p className="mt-1 text-sm text-foreground">{selection.landmark}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Change ${label}`}
      >
        <Pencil size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
