'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, MapPin, Pencil, Pill } from 'lucide-react';
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

  const isMedication = draft?.deliveryType === 'medication_delivery';

  // The locked region comes from whichever side was set first
  const lockedRegionId = draft?.pickupRegionId ?? draft?.destinationRegionId ?? null;
  const lockedRegionName =
    draft?.pickupRegionId ? draft.pickupRegionName :
    draft?.destinationRegionId ? draft.destinationRegionName :
    null;

  const lockedRegion =
    lockedRegionId && lockedRegionName
      ? { id: lockedRegionId, name: lockedRegionName }
      : null;

  const canContinue = Boolean(
    draft?.destinationQuarterId && draft?.destinationLandmark &&
    (isMedication || (draft?.pickupQuarterId && draft?.pickupLandmark)),
  );

  function handleSaveLocation(target: PickerTarget, sel: LocationSelection) {
    if (target === 'pickup') {
      // If the user picks a DIFFERENT region, clear the destination
      const regionChanged = draft?.destinationRegionId && draft.destinationRegionId !== sel.regionId;
      updateDraft(draftId, {
        pickupQuarterId: sel.quarterId,
        pickupQuarterName: sel.quarterName,
        pickupTownName: sel.townName,
        pickupRegionId: sel.regionId,
        pickupRegionName: sel.regionName,
        pickupLandmark: sel.landmark,
        ...(regionChanged ? {
          destinationQuarterId: undefined,
          destinationQuarterName: undefined,
          destinationTownName: undefined,
          destinationRegionId: undefined,
          destinationRegionName: undefined,
          destinationLandmark: undefined,
        } : {}),
      });
    } else {
      const regionChanged = draft?.pickupRegionId && draft.pickupRegionId !== sel.regionId;
      updateDraft(draftId, {
        destinationQuarterId: sel.quarterId,
        destinationQuarterName: sel.quarterName,
        destinationTownName: sel.townName,
        destinationRegionId: sel.regionId,
        destinationRegionName: sel.regionName,
        destinationLandmark: sel.landmark,
        ...(regionChanged ? {
          pickupQuarterId: undefined,
          pickupQuarterName: undefined,
          pickupTownName: undefined,
          pickupRegionId: undefined,
          pickupRegionName: undefined,
          pickupLandmark: undefined,
        } : {}),
      });
    }
    setPickerOpen(null);
  }

  function handleRegionChange() {
    // Clear both sides so the user can freely pick a new region
    updateDraft(draftId, {
      pickupQuarterId: undefined,
      pickupQuarterName: undefined,
      pickupTownName: undefined,
      pickupRegionId: undefined,
      pickupRegionName: undefined,
      pickupLandmark: undefined,
      destinationQuarterId: undefined,
      destinationQuarterName: undefined,
      destinationTownName: undefined,
      destinationRegionId: undefined,
      destinationRegionName: undefined,
      destinationLandmark: undefined,
    });
    // Reopen the same picker but now without a locked region
    // (pickerOpen remains as-is; modal was closed first by onRequestRegionChange)
  }

  const pickupSelection: LocationSelection | undefined =
    draft?.pickupQuarterId
      ? {
          regionId: draft.pickupRegionId ?? '',
          regionName: draft.pickupRegionName ?? '',
          quarterId: draft.pickupQuarterId,
          quarterName: draft.pickupQuarterName ?? '',
          townName: draft.pickupTownName ?? '',
          landmark: draft.pickupLandmark ?? '',
        }
      : undefined;

  const destinationSelection: LocationSelection | undefined =
    draft?.destinationQuarterId
      ? {
          regionId: draft.destinationRegionId ?? '',
          regionName: draft.destinationRegionName ?? '',
          quarterId: draft.destinationQuarterId,
          quarterName: draft.destinationQuarterName ?? '',
          townName: draft.destinationTownName ?? '',
          landmark: draft.destinationLandmark ?? '',
        }
      : undefined;

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="route"
      title="Where should the item move?"
      description={
        isMedication
          ? 'Enter the delivery address. Pickup is optional — a provider will source the medication from any pharmacy in the region.'
          : 'Select a quarter for pickup and destination. Both must be in the same region.'
      }
      backHref={routes.requestType(draftId)}
    >
      <div className="grid gap-4">
        {/* Same-region notice when one side is already set */}
        {lockedRegion && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/6 px-3 py-2 text-sm">
            <AlertCircle size={14} className="shrink-0 text-primary" />
            <span className="text-foreground">
              Both locations must be within <strong>{lockedRegion.name}</strong> region.
            </span>
          </div>
        )}

        {/* Medication notice */}
        {isMedication && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/6 px-3 py-2 text-sm text-foreground">
            <Pill size={14} className="shrink-0 text-warning" />
            <span>
              A provider in your region will find and deliver your medication from the nearest pharmacy.
            </span>
          </div>
        )}

        {/* Pickup — optional for medication */}
        {!isMedication ? (
          <LocationButton
            label="Pickup Location"
            selection={pickupSelection}
            onOpen={() => setPickerOpen('pickup')}
          />
        ) : (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Pickup Location</span>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <LocationButton
              label="Pickup Location (optional)"
              selection={pickupSelection}
              onOpen={() => setPickerOpen('pickup')}
              optional
            />
          </div>
        )}

        {/* Destination */}
        <LocationButton
          label="Delivery Destination"
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
        lockedRegion={destinationSelection ? lockedRegion : null}
        onRequestRegionChange={handleRegionChange}
      />

      {/* Destination picker */}
      <LocationPickerModal
        open={pickerOpen === 'destination'}
        onClose={() => setPickerOpen(null)}
        onSave={(sel) => handleSaveLocation('destination', sel)}
        title="Delivery Destination"
        initialValue={destinationSelection}
        lockedRegion={pickupSelection ? lockedRegion : null}
        onRequestRegionChange={handleRegionChange}
      />
    </RequestFlowLayout>
  );
}

// ── Location button ────────────────────────────────────────────────────────────

function LocationButton({
  label,
  selection,
  onOpen,
  optional,
}: {
  label: string;
  selection?: LocationSelection;
  onOpen: () => void;
  optional?: boolean;
}) {
  if (!selection) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={[
          'flex w-full items-center gap-3 rounded-lg border-2 border-dashed px-4 py-4 text-left transition',
          optional
            ? 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
            : 'border-border hover:border-primary/60 hover:bg-primary/5',
        ].join(' ')}
      >
        <MapPin size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{label}</span>
          <br />
          {optional ? 'Tap to add (optional)' : 'Tap to choose quarter and landmark'}
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
