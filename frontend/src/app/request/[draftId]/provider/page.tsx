'use client';

import { useMemo, useState } from 'react';
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
import { mockProviders, providerModes } from '@/features/request/request-data';
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

        {mode === 'open_marketplace' ? (
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
        ) : null}

        {mode === 'recommended_provider' ? (
          <ProviderList
            selectedProviderId={draft?.selectedProviderId}
            onSelect={(provider) =>
              updateDraft(draftId, {
                providerMode: 'recommended_provider',
                selectedProviderId: provider.id,
                selectedProviderName: provider.name,
                estimatedMinPrice: 1500,
                estimatedMaxPrice: 2800,
                finalPrice: provider.id === 'cheapest' ? 1800 : provider.id === 'fastest' ? 2600 : 2200,
              })
            }
          />
        ) : null}

        {mode === 'search_provider' ? (
          <SearchProviderPanel
            selectedProviderId={draft?.selectedProviderId}
            onSelect={(provider) =>
              updateDraft(draftId, {
                providerMode: 'search_provider',
                selectedProviderId: provider.id,
                selectedProviderName: provider.name,
                estimatedMinPrice: 1500,
                estimatedMaxPrice: 2800,
                finalPrice: provider.id === 'cheapest' ? 1800 : provider.id === 'fastest' ? 2600 : 2200,
              })
            }
          />
        ) : null}
      </div>
      <RequestActions nextHref={routes.requestContact(draftId)} disabled={!canContinue} />
    </RequestFlowLayout>
  );
}

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
            onChange={(event) => onReward(Number(event.target.value))}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

function ProviderList({
  selectedProviderId,
  onSelect,
}: {
  selectedProviderId?: string;
  onSelect: (provider: (typeof mockProviders)[number]) => void;
}) {
  return (
    <div className="grid gap-3">
      {mockProviders.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          selected={selectedProviderId === provider.id}
          onSelect={() => onSelect(provider)}
        />
      ))}
    </div>
  );
}

function SearchProviderPanel({
  selectedProviderId,
  onSelect,
}: {
  selectedProviderId?: string;
  onSelect: (provider: (typeof mockProviders)[number]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input className="pl-10" placeholder="Search agency, courier company, or delivery service" />
      </div>
      <ProviderList selectedProviderId={selectedProviderId} onSelect={onSelect} />
    </div>
  );
}

function ProviderCard({
  provider,
  selected,
  onSelect,
}: {
  provider: (typeof mockProviders)[number];
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
            <h3 className="font-semibold text-foreground">{provider.name}</h3>
            <Badge tone="success">Verified</Badge>
            <Badge tone="primary">{provider.tag}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star size={15} className="fill-warning text-warning" aria-hidden="true" />
              {provider.rating}
            </span>
            <span>{provider.eta}</span>
            <span>{provider.priceRange}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
