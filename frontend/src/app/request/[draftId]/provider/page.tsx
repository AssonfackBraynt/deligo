'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Search, ShieldCheck, Star } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { RadioCard } from '@/components/ui/radio-card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { routes } from '@/lib/routes';
import { RequestActions } from '@/features/request/components/request-actions';
import { getRecommendedProviders } from '@/features/request/delivery-request-api';
import type { RecommendedProvider } from '@/features/request/delivery-request-api';
import { providerModes } from '@/features/request/request-data';
import { useRequestStore } from '@/features/request/request-store';
import type { ProviderSelectionMode } from '@/features/request/request-types';

export default function ProviderSelectionPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestStore((state) => state.getDraft(draftId));
  const updateDraft = useRequestStore((state) => state.updateDraft);
  const [mode, setMode] = useState<ProviderSelectionMode>(draft?.providerMode ?? 'open_marketplace');

  const canContinue = useMemo(() => {
    if (mode === 'open_marketplace') return Boolean(draft?.desiredRewardAmount);
    return Boolean(draft?.selectedProviderId);
  }, [draft?.desiredRewardAmount, draft?.selectedProviderId, mode]);

  const setProviderMode = (value: ProviderSelectionMode) => {
    setMode(value);
    updateDraft(draftId, { providerMode: value });
  };

  function handleProviderSelect(p: { id: string; displayName: string }) {
    updateDraft(draftId, {
      selectedProviderId: p.id,
      selectedProviderName: p.displayName,
    });
  }

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="provider"
      title="Choose how your delivery should be handled"
      description="This is the heart of DeliGo: open the request to verified providers, choose a recommended option, or search directly."
      backHref={routes.requestItem(draftId)}
    >
      <div className="space-y-5">
        <SegmentedControl
          value={mode}
          onChange={setProviderMode}
          options={providerModes.map((providerMode) => ({
            value: providerMode.value,
            label: providerMode.label,
          }))}
        />

        {mode === 'open_marketplace' && (
          <MarketplacePanel
            reward={draft?.desiredRewardAmount}
            onReward={(amount) =>
              updateDraft(draftId, {
                providerMode: 'open_marketplace',
                desiredRewardAmount: amount,
                selectedProviderId: undefined,
                selectedProviderName: undefined,
                finalPrice: amount + 300,
              })
            }
          />
        )}

        {mode === 'recommended_provider' && (
          <RecommendedProviderList
            pickupCity={draft?.pickupTownName}
            selectedProviderId={draft?.selectedProviderId}
            onSelect={handleProviderSelect}
          />
        )}

        {mode === 'search_provider' && (
          <SearchProviderPanel
            pickupCity={draft?.pickupTownName}
            selectedProviderId={draft?.selectedProviderId}
            onSelect={handleProviderSelect}
          />
        )}
      </div>
      <RequestActions nextHref={routes.requestContact(draftId)} disabled={!canContinue} />
    </RequestFlowLayout>
  );
}

// ── Panels ─────────────────────────────────────────────────────────────────────

function MarketplacePanel({
  reward,
  onReward,
}: {
  reward?: number;
  onReward: (amount: number) => void;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="space-y-4">
        <RadioCard
          title="Open Marketplace"
          description="Your paid request becomes visible in the Jobs Marketplace. Verified providers submit offers and you accept one before delivery begins."
          selected
          icon={<ShieldCheck size={20} aria-hidden="true" />}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {[2000, 3000, 5000].map((amount) => (
            <Button
              key={amount}
              type="button"
              variant={reward === amount ? 'primary' : 'outline'}
              onClick={() => onReward(amount)}
            >
              {amount.toLocaleString()} FCFA
            </Button>
          ))}
        </div>
        <Field label="Custom Amount">
          <Input
            type="number"
            min="500"
            placeholder="Enter FCFA amount"
            value={reward ?? ''}
            onChange={(e) => onReward(Number(e.target.value))}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

function RecommendedProviderList({
  pickupCity,
  selectedProviderId,
  onSelect,
}: {
  pickupCity?: string;
  selectedProviderId?: string;
  onSelect: (p: { id: string; displayName: string }) => void;
}) {
  const [providers, setProviders] = useState<RecommendedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendedProviders(pickupCity)
      .then(setProviders)
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [pickupCity]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="shadow-none">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No providers available right now. Try Open Marketplace instead.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {providers.map((p) => (
        <ProviderCard
          key={p.id}
          provider={p}
          selected={selectedProviderId === p.id}
          onSelect={() => onSelect({ id: p.id, displayName: p.displayName })}
        />
      ))}
    </div>
  );
}

function SearchProviderPanel({
  pickupCity,
  selectedProviderId,
  onSelect,
}: {
  pickupCity?: string;
  selectedProviderId?: string;
  onSelect: (p: { id: string; displayName: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [allProviders, setAllProviders] = useState<RecommendedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendedProviders(pickupCity)
      .then(setAllProviders)
      .catch(() => setAllProviders([]))
      .finally(() => setLoading(false));
  }, [pickupCity]);

  const filtered = query.trim()
    ? allProviders.filter((p) =>
        p.displayName.toLowerCase().includes(query.toLowerCase()) ||
        (p.baseCity?.toLowerCase().includes(query.toLowerCase()) ?? false),
      )
    : allProviders;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          className="pl-10"
          placeholder="Search by name or city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={selectedProviderId === p.id}
              onSelect={() => onSelect({ id: p.id, displayName: p.displayName })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  selected,
  onSelect,
}: {
  provider: RecommendedProvider;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-lg border border-border bg-surface p-4 text-left transition hover:border-primary/60 data-[selected=true]:border-primary data-[selected=true]:ring-2 data-[selected=true]:ring-primary/20"
      data-selected={selected}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          {selected ? <CheckCircle2 size={22} /> : <ShieldCheck size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{provider.displayName}</h3>
            {provider.verificationStatus === 'verified' && (
              <Badge tone="success">Verified</Badge>
            )}
            {provider.isFeatured && <Badge tone="primary">Featured</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {provider.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star size={15} className="fill-warning text-warning" aria-hidden="true" />
                {provider.ratingAverage.toFixed(1)}
                <span className="text-xs">({provider.ratingCount})</span>
              </span>
            )}
            {provider.baseCity && <span>{provider.baseCity}</span>}
            <span
              className={
                provider.availabilityStatus === 'available' ? 'text-success' : 'text-warning'
              }
            >
              {provider.availabilityStatus === 'available' ? 'Available now' : 'Busy'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
