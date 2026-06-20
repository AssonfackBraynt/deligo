'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listAdminRequests, type AdminRequest } from '@/features/admin/admin-api';
import { AdminNav } from '@/components/layout/admin-nav';

const STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  marketplace_open: 'Marketplace Open',
  offers_received: 'Offers Received',
  provider_assigned: 'Provider Assigned',
  pickup_verified: 'Pickup Verified',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral';

const STATUS_TONES: Record<string, BadgeTone> = {
  created: 'neutral',
  marketplace_open: 'primary',
  offers_received: 'primary',
  provider_assigned: 'primary',
  pickup_verified: 'primary',
  in_transit: 'primary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'warning',
  disputed: 'warning',
};

const STATUSES = ['', 'created', 'marketplace_open', 'offers_received', 'provider_assigned', 'pickup_verified', 'in_transit', 'delivered', 'completed', 'cancelled'];

export default function AdminRequestsPage() {
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await listAdminRequests({ page: p, limit: 20, status: statusFilter || undefined });
      setItems(res.items);
      setTotal(res.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav active="requests" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Delivery Requests</h1>
          <span className="text-sm text-muted-foreground">{total} total</span>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatusFilter(s); void load(1); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {s === '' ? 'All' : (STATUS_LABELS[s] ?? s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No requests found.</CardContent></Card>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-3 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">{r.trackingCode}</span>
                        <Badge tone={STATUS_TONES[r.requestStatus] ?? 'neutral'}>
                          {STATUS_LABELS[r.requestStatus] ?? r.requestStatus}
                        </Badge>
                        <Badge tone="neutral" className="capitalize">{r.deliveryType.replace(/_/g, ' ')}</Badge>
                      </div>
                      {r.estimatedCost != null && (
                        <span className="text-sm font-semibold text-foreground">
                          {r.estimatedCost.toLocaleString()} FCFA
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <span><span className="font-medium text-foreground">Customer:</span> {r.customerName}</span>
                      {r.providerName && <span><span className="font-medium text-foreground">Provider:</span> {r.providerName}</span>}
                      <span><span className="font-medium text-foreground">Items:</span> {r.itemCount}</span>
                      <span><span className="font-medium text-foreground">Events:</span> {r.trackingEventCount}</span>
                    </div>

                    {(r.pickup || r.destination) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={12} className="shrink-0" />
                        <span>{r.pickup}</span>
                        <ArrowRight size={10} className="mx-1" />
                        <span>{r.destination}</span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Created {new Date(r.createdAt).toLocaleDateString('fr-CM', { dateStyle: 'medium' })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {total > 20 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => void load(page - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => void load(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
