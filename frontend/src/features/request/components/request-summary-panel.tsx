'use client';

import { MapPin, Package, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRequestDraft } from '../use-request-draft';

export function RequestSummaryPanel({ draftId }: { draftId: string }) {
  const d = useRequestDraft(draftId);

  const estimated = d?.estimatedDeliveryCost ?? null;
  const bid = d?.providerMode === 'open_marketplace' ? (d?.desiredRewardAmount ?? null) : null;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Request summary</h2>
          <Badge tone="primary">Draft</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <SummaryRow
          icon={<MapPin size={18} aria-hidden="true" />}
          label="Route"
          value={
            d?.pickupQuarterName && d?.destinationQuarterName
              ? `${d.pickupQuarterName} → ${d.destinationQuarterName}`
              : 'Pickup and destination not set'
          }
        />
        <SummaryRow
          icon={<Package size={18} aria-hidden="true" />}
          label="Item"
          value={d?.itemName ?? 'Item details not set'}
        />
        <SummaryRow
          icon={<UserRound size={18} aria-hidden="true" />}
          label="Provider"
          value={d?.selectedProviderName ?? d?.providerMode?.replaceAll('_', ' ') ?? 'Not selected'}
        />

        {/* Price block — shows comparison when bid is set alongside estimate */}
        <div className="rounded-lg bg-muted p-3 space-y-2">
          {estimated == null && bid == null ? (
            <>
              <p className="text-muted-foreground">Estimated total</p>
              <p className="mt-1 text-xl font-semibold text-foreground">Calculated at review</p>
            </>
          ) : estimated != null && bid == null ? (
            <>
              <p className="text-muted-foreground">Estimated total</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                ~{estimated.toLocaleString()} FCFA
              </p>
            </>
          ) : estimated == null && bid != null ? (
            <>
              <p className="text-muted-foreground">Your bid</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {bid.toLocaleString()} FCFA
              </p>
            </>
          ) : (
            /* Both present — comparison view */
            <PriceComparison estimated={estimated!} bid={bid!} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PriceComparison({ estimated, bid }: { estimated: number; bid: number }) {
  const estimatedIsBetter = estimated < bid;
  const bidIsBetter = bid < estimated;

  return (
    <div className="space-y-2">
      {/* Estimated */}
      <div>
        <p className="text-xs text-muted-foreground">Estimated total</p>
        <div className="flex items-center gap-2">
          <p className={estimatedIsBetter ? 'text-xl font-bold text-foreground' : 'text-sm text-muted-foreground'}>
            ~{estimated.toLocaleString()} FCFA
          </p>
          {estimatedIsBetter && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
              Better deal
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-border/40" />

      {/* Bid */}
      <div>
        <p className="text-xs text-muted-foreground">Your bid</p>
        <div className="flex items-center gap-2">
          <p className={bidIsBetter ? 'text-xl font-bold text-foreground' : 'text-sm text-muted-foreground'}>
            {bid.toLocaleString()} FCFA
          </p>
          {bidIsBetter && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
              Better deal
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 leading-5 text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
