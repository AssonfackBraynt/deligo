'use client';

import { useEffect, useState } from 'react';
import { Search, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/field';
import {
  listAdminProviders,
  suspendProviderUser,
  unsuspendProviderUser,
  type AdminProvider,
} from '@/features/admin/admin-api';
import { AdminNav } from '@/components/layout/admin-nav';

const TYPE_LABELS: Record<string, string> = {
  independent_rider: 'Rider',
  courier_company: 'Courier',
  logistics_company: 'Logistics',
};

const VERIF_TONES: Record<string, 'success' | 'warning' | 'neutral'> = {
  verified: 'success',
  pending: 'warning',
  unverified: 'neutral',
  rejected: 'warning',
  suspended: 'neutral',
};

export default function AdminProvidersPage() {
  const [items, setItems] = useState<AdminProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifFilter, setVerifFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Suspend modal state
  const [suspendTarget, setSuspendTarget] = useState<AdminProvider | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  // Unsuspend confirmation state
  const [unsuspendTarget, setUnsuspendTarget] = useState<AdminProvider | null>(null);
  const [unsuspendSubmitting, setUnsuspendSubmitting] = useState(false);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await listAdminProviders({
        page: p,
        limit: 20,
        search: search || undefined,
        verificationStatus: verifFilter || undefined,
        providerType: typeFilter || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, []);

  async function handleSuspend() {
    if (!suspendTarget) return;
    const reason = suspendReason.trim();
    if (!reason) {
      setSuspendError('Please provide a reason for the suspension.');
      return;
    }
    setSuspendSubmitting(true);
    setSuspendError(null);
    try {
      await suspendProviderUser(suspendTarget.user.id, reason);
      setItems((prev) =>
        prev.map((p) =>
          p.id === suspendTarget.id
            ? { ...p, user: { ...p.user, accountStatus: 'suspended' } }
            : p,
        ),
      );
      setSuspendTarget(null);
      setSuspendReason('');
    } catch {
      setSuspendError('Failed to suspend account. Please try again.');
    } finally {
      setSuspendSubmitting(false);
    }
  }

  async function handleUnsuspend() {
    if (!unsuspendTarget) return;
    setUnsuspendSubmitting(true);
    try {
      await unsuspendProviderUser(unsuspendTarget.user.id);
      setItems((prev) =>
        prev.map((p) =>
          p.id === unsuspendTarget.id
            ? { ...p, user: { ...p.user, accountStatus: 'active' } }
            : p,
        ),
      );
      setUnsuspendTarget(null);
    } catch {
      alert('Failed to unsuspend account. Please try again.');
    } finally {
      setUnsuspendSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav active="providers" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Providers</h1>
          <span className="text-sm text-muted-foreground">{total} total</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void load(1)}
              placeholder="Search by name or phone…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={verifFilter}
            onChange={(e) => { setVerifFilter(e.target.value); void load(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
          >
            <option value="">All statuses</option>
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); void load(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
          >
            <option value="">All types</option>
            <option value="independent_rider">Rider</option>
            <option value="courier_company">Courier</option>
            <option value="logistics_company">Logistics</option>
          </select>
          <Button size="sm" onClick={() => void load(1)}>Search</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No providers found.</CardContent></Card>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((p) => {
                const isSuspended = p.user.accountStatus === 'suspended';
                return (
                  <Card key={p.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{p.displayName}</p>
                          <Badge tone={VERIF_TONES[p.verificationStatus] ?? 'neutral'}>
                            {p.verificationStatus === 'verified' && <ShieldCheck size={12} />}
                            {p.verificationStatus}
                          </Badge>
                          <Badge tone="neutral">{TYPE_LABELS[p.providerType] ?? p.providerType}</Badge>
                          {p.isFeatured && <Badge tone="primary">Featured</Badge>}
                          {isSuspended && <Badge tone="warning">Suspended</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {p.user.phone}{p.baseCity ? ` · ${p.baseCity}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star size={13} className="fill-warning text-warning" />
                          {p.ratingAverage.toFixed(1)} ({p.ratingCount})
                        </span>
                        <span className="text-xs">
                          Joined {new Date(p.createdAt).toLocaleDateString('fr-CM', { dateStyle: 'medium' })}
                        </span>
                        {isSuspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnsuspendTarget(p)}
                          >
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSuspendTarget(p);
                              setSuspendReason('');
                              setSuspendError(null);
                            }}
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => void load(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => void load(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Suspend modal */}
      <Dialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title={`Suspend ${suspendTarget?.displayName ?? 'provider'}`}
        description="The provider will not be able to log in until you lift the suspension. Explain your reason clearly — it will be shown to the provider at login."
      >
        {suspendTarget && (
          <div className="space-y-4">
            {suspendError && (
              <p className="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2 text-sm text-danger">
                {suspendError}
              </p>
            )}
            <Field label="Reason for suspension">
              <Textarea
                placeholder="e.g. Multiple customer complaints about unprofessional behaviour…"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                disabled={suspendSubmitting}
                rows={4}
              />
            </Field>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSuspendTarget(null)}
                disabled={suspendSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-danger text-white hover:bg-danger/90"
                onClick={handleSuspend}
                disabled={suspendSubmitting}
              >
                {suspendSubmitting ? 'Suspending…' : 'Suspend account'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Unsuspend confirmation modal */}
      <Dialog
        open={!!unsuspendTarget}
        onClose={() => setUnsuspendTarget(null)}
        title={`Unsuspend ${unsuspendTarget?.displayName ?? 'provider'}?`}
        description="The provider will be able to log in and access the platform again."
      >
        {unsuspendTarget && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setUnsuspendTarget(null)}
              disabled={unsuspendSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUnsuspend}
              disabled={unsuspendSubmitting}
            >
              {unsuspendSubmitting ? 'Unsuspending…' : 'Yes, unsuspend'}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
