'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, RefreshCw, Search } from 'lucide-react';
import { listQuartersByRegion, listRegions } from '@/features/request/location-api';
import type { QuarterResult, Region } from '@/features/request/location-api';
import { Button } from './button';
import { Dialog } from './dialog';
import { Input } from './field';

// ── Public types ──────────────────────────────────────────────────────────────

export type LocationSelection = {
  regionId: string;
  regionName: string;
  quarterId: string;
  quarterName: string;
  townName: string;
  landmark: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (selection: LocationSelection) => void;
  title: string;
  initialValue?: LocationSelection;
  /** When set, the region step is skipped and quarters are pre-loaded for this region. */
  lockedRegion?: { id: string; name: string } | null;
  /** Called when user clicks "Change region" in locked mode. Parent should clear both sides. */
  onRequestRegionChange?: () => void;
};

type Step = 'region' | 'quarter' | 'landmark';

// ── Component ─────────────────────────────────────────────────────────────────

export function LocationPickerModal({
  open,
  onClose,
  onSave,
  title,
  initialValue,
  lockedRegion,
  onRequestRegionChange,
}: Props) {
  const [step, setStep] = useState<Step>('region');
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [quarters, setQuarters] = useState<QuarterResult[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterResult | null>(null);
  const [search, setSearch] = useState('');
  const [landmark, setLandmark] = useState('');
  const [landmarkError, setLandmarkError] = useState('');
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingQuarters, setLoadingQuarters] = useState(false);

  // Reset and initialize when modal opens
  useEffect(() => {
    if (!open) return;
    setSelectedQuarter(null);
    setSearch('');
    setLandmark(initialValue?.landmark ?? '');
    setLandmarkError('');

    if (lockedRegion) {
      // Region is locked — jump straight to quarter selection
      const region = { id: lockedRegion.id, name: lockedRegion.name };
      setSelectedRegion(region);
      setStep('quarter');
      setLoadingQuarters(true);
      listQuartersByRegion(lockedRegion.id)
        .then(setQuarters)
        .catch(() => setQuarters([]))
        .finally(() => setLoadingQuarters(false));
    } else {
      // Free selection — start at region
      setStep('region');
      setSelectedRegion(null);
      setLoadingRegions(true);
      listRegions()
        .then(setRegions)
        .catch(() => setRegions([]))
        .finally(() => setLoadingRegions(false));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load quarters whenever a region is freely selected
  useEffect(() => {
    if (!selectedRegion || lockedRegion) return;
    setLoadingQuarters(true);
    setSearch('');
    listQuartersByRegion(selectedRegion.id)
      .then(setQuarters)
      .catch(() => setQuarters([]))
      .finally(() => setLoadingQuarters(false));
  }, [selectedRegion]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredQuarters = search.trim()
    ? quarters.filter(
        (q) =>
          q.name.toLowerCase().includes(search.toLowerCase()) ||
          q.town.name.toLowerCase().includes(search.toLowerCase()),
      )
    : quarters;

  function handleRegionSelect(region: Region) {
    setSelectedRegion(region);
    setStep('quarter');
  }

  function handleQuarterSelect(quarter: QuarterResult) {
    setSelectedQuarter(quarter);
    setStep('landmark');
  }

  function handleSave() {
    if (!landmark.trim()) {
      setLandmarkError('Landmark is required — e.g. Opposite Total, Near Carrefour.');
      return;
    }
    if (!selectedQuarter || !selectedRegion) return;
    onSave({
      regionId: selectedRegion.id,
      regionName: selectedRegion.name,
      quarterId: selectedQuarter.id,
      quarterName: selectedQuarter.name,
      townName: selectedQuarter.town.name,
      landmark: landmark.trim(),
    });
    onClose();
  }

  function handleChangeRegion() {
    onClose();
    onRequestRegionChange?.();
  }

  const stepLabel =
    step === 'region' ? 'Step 1 of 3 — Region' :
    step === 'quarter' ? (lockedRegion ? 'Choose a quarter' : 'Step 2 of 3 — Quarter') :
    (lockedRegion ? 'Add a landmark' : 'Step 3 of 3 — Landmark');

  return (
    <Dialog open={open} onClose={onClose} title={title} description={stepLabel}>
      {/* ── Step 1: Region ──────────────────────────────────────────────────── */}
      {step === 'region' && (
        <div className="space-y-3">
          {loadingRegions ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {regions.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => handleRegionSelect(r)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-left text-sm font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/5"
                  >
                    <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Step 2: Quarter search ───────────────────────────────────────────── */}
      {step === 'quarter' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            {lockedRegion ? (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-primary" />
                <span className="font-medium text-foreground">{selectedRegion?.name}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setStep('region')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                {selectedRegion?.name}
              </button>
            )}
            {lockedRegion && onRequestRegionChange && (
              <button
                type="button"
                onClick={handleChangeRegion}
                className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                <RefreshCw size={11} />
                Change region
              </button>
            )}
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              placeholder="Search quarter or town…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {loadingQuarters ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {filteredQuarters.length === 0 ? (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  No quarters found.
                </li>
              ) : (
                filteredQuarters.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => handleQuarterSelect(q)}
                      className="flex w-full flex-col rounded-lg border border-border px-4 py-2.5 text-left transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="text-sm font-medium text-foreground">{q.name}</span>
                      <span className="text-xs text-muted-foreground">{q.town.name}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {/* ── Step 3: Landmark ────────────────────────────────────────────────── */}
      {step === 'landmark' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('quarter')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {selectedQuarter?.name}, {selectedQuarter?.town.name}
          </button>

          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">
              Landmark <span className="text-danger">*</span>
            </p>
            <Input
              placeholder="E.g. Opposite Total, Near Carrefour Akwa"
              value={landmark}
              onChange={(e) => {
                setLandmark(e.target.value);
                if (landmarkError) setLandmarkError('');
              }}
              autoFocus
            />
            {landmarkError && (
              <p className="mt-1.5 text-xs text-danger">{landmarkError}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              A recognisable meeting point helps the provider find you.
            </p>
          </div>

          <Button size="lg" className="w-full" onClick={handleSave}>
            Save Location
          </Button>
        </div>
      )}
    </Dialog>
  );
}
