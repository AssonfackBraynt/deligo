'use client';

import { MapPin, Package, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRequestDraft } from '../use-request-draft';

export function RequestSummaryPanel({ draftId }: { draftId: string }) {
  const d = useRequestDraft(draftId);

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
        <div className="rounded-lg bg-muted p-3">
          <p className="text-muted-foreground">Estimated total</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {d?.finalPrice ? `${d.finalPrice.toLocaleString()} FCFA` : 'Calculated at review'}
          </p>
        </div>
      </CardContent>
    </Card>
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
