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
import { estimateDelivery, getRecommendedProviders } from '@/features/request/delivery-request-api';
import type { RecommendedProvider } from '@/features/request/delivery-request-api';
import { providerModes } from '@/features/request/request-data';
import { useRequestStore } from '@/features/request/request-store';
import { useRequestDraft } from '@/features/request/use-request-draft';
import type { ProviderSelectionMode } from '@/features/request/request-types';

export default function ProviderSelectionPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestDraft(draftId);
  const updateDraft = useRequestStore((state) => state.updateDraft);
  const [mode, setMode] = useState<ProviderSelectionMode>(draft?.providerMode ?? 'open_marketplace');

  // Fetch estimate once the route and item data are available
  useEffect(() => {
    if (!draft?.pickupQuarterId || !draft?.destinationQuarterId || !draft?.itemName) return;

    estimateDelivery({
      pickupQuarterId: draft.pickupQuarterId,
      destinationQuarterId: draft.destinationQuarterId,
      items: [
        {
          itemName: draft.itemName,
          weightKg: draft.weightKg,
          sizeLabel: draft.sizeLabel,
          category: draft.category,
          quantity: draft.quantity,
          isFragile: draft.isFragile,
        },
      ],
    })
      .then((res) => updateDraft(draftId, { estimatedDeliveryCost: res.estimatedCost }))
      .catch(() => undefined);
  // Re-run whenever any parameter that affects the price changes
  }, [
    draftId,
    draft?.pickupQuarterId,
    draft?.destinationQuarterId,
    draft?.itemName,
    draft?.weightKg,
    draft?.sizeLabel,
    draft?.category,
    draft?.quantity,
    draft?.isFragile,
    updateDraft,
  ]);

  const itemHints = useMemo(
    () => ({
      weightKg: draft?.weightKg,
      sizeLabel: draft?.sizeLabel,
      category: draft?.category,
      quantity: draft?.quantity,
      isFragile: draft?.isFragile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft?.weightKg, draft?.sizeLabel, draft?.category, draft?.quantity, draft?.isFragile],
  );

  const canContinue = useMemo(() => {
    if (mode === 'open_marketplace') return Boolean(draft?.desiredRewardAmount);
    return Boolean(draft?.selectedProviderId);
  }, [draft?.desiredRewardAmount, draft?.selectedProviderId, mode]);

  const setProviderMode = (value: ProviderSelectionMode) => {
    setMode(value);
    updateDraft(draftId, { providerMode: value });
  };

  function handleProviderSelect(p: { id: string; displayName: string; estimatedPrice?: number | null }) {
    updateDraft(draftId, {
      selectedProviderId: p.id,
      selectedProviderName: p.displayName,
      ...(p.estimatedPrice != null && { estimatedDeliveryCost: p.estimatedPrice }),
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
              })
            }
          />
        )}

        {mode === 'recommended_provider' && (
          <RecommendedProviderList
            pickupCity={draft?.pickupTownName}
            pickupQuarterId={draft?.pickupQuarterId}
            destinationQuarterId={draft?.destinationQuarterId}
            itemHints={itemHints}
            selectedProviderId={draft?.selectedProviderId}
            onSelect={handleProviderSelect}
          />
        )}

        {mode === 'search_provider' && (
          <SearchProviderPanel
            pickupCity={draft?.pickupTownName}
            pickupQuarterId={draft?.pickupQuarterId}
            destinationQuarterId={draft?.destinationQuarterId}
            itemHints={itemHints}
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

type ItemHints = {
  weightKg?: number;
  sizeLabel?: string;
  category?: string;
  quantity?: number;
  isFragile?: boolean;
};

function RecommendedProviderList({
  pickupCity,
  pickupQuarterId,
  destinationQuarterId,
  itemHints,
  selectedProviderId,
  onSelect,
}: {
  pickupCity?: string;
  pickupQuarterId?: string;
  destinationQuarterId?: string;
  itemHints?: ItemHints;
  selectedProviderId?: string;
  onSelect: (p: { id: string; displayName: string; estimatedPrice?: number | null }) => void;
}) {
  const [providers, setProviders] = useState<RecommendedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setShowAll(false);
    getRecommendedProviders(pickupCity, itemHints, pickupQuarterId, destinationQuarterId)
      .then(setProviders)
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupCity, pickupQuarterId, destinationQuarterId]);

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
          <p className="text-sm font-medium text-foreground">No providers in this region yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No delivery services are registered for your pickup area. Switch to Open Marketplace so any verified provider can pick up your request.
          </p>
        </CardContent>
      </Card>
    );
  }

  const PAGE = 6;
  const displayed = showAll ? providers : providers.slice(0, PAGE);
  const remaining = providers.length - PAGE;

  return (
    <div className="grid gap-3">
      {displayed.map((p) => (
        <ProviderCard
          key={p.id}
          provider={p}
          selected={selectedProviderId === p.id}
          onSelect={() => onSelect({ id: p.id, displayName: p.displayName, estimatedPrice: p.estimatedPrice })}
        />
      ))}
      {!showAll && remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-lg border border-dashed border-border py-3 text-sm font-medium text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors"
        >
          Show {remaining} more provider{remaining !== 1 ? 's' : ''}
        </button>
      )}
      {showAll && providers.length > PAGE && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="w-full rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/60 hover:bg-primary/5 transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function SearchProviderPanel({
  pickupCity,
  pickupQuarterId,
  destinationQuarterId,
  itemHints,
  selectedProviderId,
  onSelect,
}: {
  pickupCity?: string;
  pickupQuarterId?: string;
  destinationQuarterId?: string;
  itemHints?: ItemHints;
  selectedProviderId?: string;
  onSelect: (p: { id: string; displayName: string; estimatedPrice?: number | null }) => void;
}) {
  const [query, setQuery] = useState('');
  const [allProviders, setAllProviders] = useState<RecommendedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendedProviders(pickupCity, itemHints, pickupQuarterId, destinationQuarterId)
      .then(setAllProviders)
      .catch(() => setAllProviders([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupCity, pickupQuarterId, destinationQuarterId]);

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
      ) : filtered.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="py-6 text-center">
            {allProviders.length === 0 ? (
              <>
                <p className="text-sm font-medium text-foreground">No providers in this region yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No delivery services are registered for your pickup area. Switch to Open Marketplace instead.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No provider matches your search.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={selectedProviderId === p.id}
              onSelect={() => onSelect({ id: p.id, displayName: p.displayName, estimatedPrice: p.estimatedPrice })}
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
          {provider.estimatedPrice != null && (
            <p className="mt-2 text-sm font-semibold text-primary">
              ~{provider.estimatedPrice.toLocaleString()} FCFA
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
