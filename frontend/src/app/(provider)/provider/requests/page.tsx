'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProviderNav } from '@/components/layout/provider-nav';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gavel,
  MapPin,
  Package,
  Truck,
  UserCheck,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import {
  abandonDelivery,
  acceptDirectRequest,
  getDirectRequests,
  getMyOffers,
  getMyProviderRequests,
  recordWorkflowAction,
  rejectDirectRequest,
  type WorkflowAction,
} from '@/features/provider-portal/provider-portal-api';
import type { ProviderAssignedRequest, ProviderOffer } from '@/features/provider-portal/provider-portal-types';
import { ApiError } from '@/lib/api-client';

const STATUS_LABELS: Record<string, string> = {
  created: 'Pending',
  provider_assigned: 'Assigned',
  pickup_verified: 'Pickup Verified',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  marketplace_open: 'Open Marketplace',
};

type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral';

const STATUS_TONES: Record<string, BadgeTone> = {
  created: 'warning',
  provider_assigned: 'primary',
  pickup_verified: 'primary',
  in_transit: 'primary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'warning',
};

const ACTIVE = ['provider_assigned', 'pickup_verified', 'in_transit'];
const DONE = ['delivered', 'completed', 'cancelled'];

const WORKFLOW_ACTIONS: Record<string, { action: WorkflowAction; label: string }> = {
  provider_assigned: { action: 'collect', label: 'Mark Collected' },
  pickup_verified: { action: 'start_transit', label: 'Start Transit' },
  in_transit: { action: 'deliver', label: 'Mark Delivered' },
};

type Tab = 'active' | 'completed' | 'offers' | 'direct';

export default function MyRequestsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab | null) ?? 'active');
  const [requests, setRequests] = useState<ProviderAssignedRequest[]>([]);
  const [directRequests, setDirectRequests] = useState<ProviderAssignedRequest[]>([]);
  const [offers, setOffers] = useState<ProviderOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  async function load() {
    try {
      const [reqs, offs, directs] = await Promise.all([
        getMyProviderRequests(),
        getMyOffers(),
        getDirectRequests(),
      ]);
      setRequests(reqs);
      setOffers(offs);
      setDirectRequests(directs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleWorkflow(requestId: string, action: WorkflowAction) {
    setWorkflowLoading(requestId);
    setWorkflowError(null);
    try {
      await recordWorkflowAction(requestId, action);
      await load();
    } catch (err) {
      setWorkflowError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setWorkflowLoading(null);
    }
  }

  async function handleAcceptDirect(requestId: string) {
    setWorkflowLoading(requestId);
    setWorkflowError(null);
    try {
      await acceptDirectRequest(requestId);
      await load();
    } catch (err) {
      setWorkflowError(err instanceof ApiError ? err.message : 'Failed to accept request.');
    } finally {
      setWorkflowLoading(null);
    }
  }

  async function handleRejectDirect(requestId: string) {
    setWorkflowLoading(requestId);
    setWorkflowError(null);
    try {
      await rejectDirectRequest(requestId);
      await load();
    } catch (err) {
      setWorkflowError(err instanceof ApiError ? err.message : 'Failed to reject request.');
    } finally {
      setWorkflowLoading(null);
    }
  }

  const activeRequests = requests.filter((r) => ACTIVE.includes(r.requestStatus));
  const doneRequests = requests.filter((r) => DONE.includes(r.requestStatus));

  return (
    <div className="min-h-screen bg-background">
      <ProviderNav activePath={routes.provider.myRequests} />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <h1 className="text-2xl font-semibold text-foreground">My Requests</h1>

        {workflowError && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/8 px-4 py-2 text-sm text-danger">
            <AlertCircle size={15} /> {workflowError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted p-1 w-fit">
          {(['active', 'completed', 'offers', 'direct'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition ${
                tab === t ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'active' && `Active (${activeRequests.length})`}
              {t === 'completed' && `Completed (${doneRequests.length})`}
              {t === 'offers' && `Bids (${offers.length})`}
              {t === 'direct' && `Direct (${directRequests.length})`}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
          </div>
        )}

        {/* Active tab */}
        {!loading && tab === 'active' && (
          activeRequests.length === 0 ? (
            <EmptyState
              message="No active requests."
              action={<Button asChild size="sm"><Link href={routes.provider.marketplace}>Browse Marketplace</Link></Button>}
            />
          ) : (
            <div className="space-y-3">
              {activeRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  workflowLoading={workflowLoading === r.id}
                  onWorkflow={(action) => void handleWorkflow(r.id, action)}
                  onAbandoned={() => void load()}
                />
              ))}
            </div>
          )
        )}

        {/* Completed tab */}
        {!loading && tab === 'completed' && (
          doneRequests.length === 0 ? (
            <EmptyState message="No completed requests yet." />
          ) : (
            <div className="space-y-3">
              {doneRequests.map((r) => <RequestCard key={r.id} request={r} />)}
            </div>
          )
        )}

        {/* Offers/bids tab */}
        {!loading && tab === 'offers' && (
          offers.length === 0 ? (
            <EmptyState
              message="No pending bids."
              action={<Button asChild size="sm" variant="outline"><Link href={routes.provider.marketplace}>Browse open requests</Link></Button>}
            />
          ) : (
            <div className="space-y-3">
              {offers.map((o) => <OfferCard key={o.id} offer={o} />)}
            </div>
          )
        )}

        {/* Direct requests tab */}
        {!loading && tab === 'direct' && (
          directRequests.length === 0 ? (
            <EmptyState message="No pending direct requests." />
          ) : (
            <div className="space-y-3">
              {directRequests.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-3 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck size={15} className="text-primary" />
                        <span className="font-mono text-sm font-semibold text-foreground">{r.trackingCode}</span>
                        <Badge tone="warning">Direct request</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Package size={15} className="shrink-0 text-muted-foreground" />
                      <span className="text-foreground">{r.items.map((i: { itemName: string }) => i.itemName).join(', ')}</span>
                    </div>

                    {r.route && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="text-foreground">{r.route.pickup}</span>
                          <ArrowRight size={12} className="mx-1 inline text-muted-foreground" />
                          <span className="text-foreground">{r.route.destination}</span>
                        </span>
                      </div>
                    )}

                    {r.estimatedDeliveryCost && (
                      <p className="text-sm font-semibold text-foreground">
                        {r.estimatedDeliveryCost.toLocaleString()} FCFA
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" disabled={workflowLoading === r.id} onClick={() => void handleAcceptDirect(r.id)}>
                        <CheckCircle2 size={15} />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" disabled={workflowLoading === r.id} onClick={() => void handleRejectDirect(r.id)}>
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

// ── Workflow stepper ──────────────────────────────────────────────────────────

const PROVIDER_STEPS = [
  { label: 'Assigned', Icon: UserCheck },
  { label: 'Collected', Icon: Package },
  { label: 'In Transit', Icon: Truck },
  { label: 'Delivered', Icon: CheckCircle2 },
] as const;

function providerStepIndex(status: string): number {
  switch (status) {
    case 'provider_assigned': return 0;
    case 'pickup_verified':   return 1;
    case 'in_transit':        return 2;
    case 'delivered':
    case 'completed':         return 3;
    default:                  return 0;
  }
}

function WorkflowStepper({ status }: { status: string }) {
  const current = providerStepIndex(status);

  return (
    <div className="flex items-start pt-1">
      {PROVIDER_STEPS.map(({ label, Icon }, i) => {
        const done   = i < current;
        const active = i === current;

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-0">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : done || active ? 'bg-success' : 'bg-border'}`} />
              <span
                className={[
                  'flex size-8 shrink-0 items-center justify-center rounded-full transition-all',
                  done   ? 'bg-success text-white' : '',
                  active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-primary/20' : '',
                  !done && !active ? 'bg-muted text-muted-foreground' : '',
                ].join(' ')}
              >
                {done ? <CheckCircle2 size={15} /> : <Icon size={15} />}
              </span>
              <div className={`h-0.5 flex-1 ${i === PROVIDER_STEPS.length - 1 ? 'invisible' : done ? 'bg-success' : 'bg-border'}`} />
            </div>
            <span
              className={`mt-1.5 text-center text-[11px] font-medium leading-tight ${
                done ? 'text-success' : active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RequestCard({
  request,
  workflowLoading,
  onWorkflow,
  onAbandoned,
}: {
  request: ProviderAssignedRequest;
  workflowLoading?: boolean;
  onWorkflow?: (action: WorkflowAction) => void;
  onAbandoned?: () => void;
}) {
  const workflowEntry = WORKFLOW_ACTIONS[request.requestStatus];
  const canAbandon = ACTIVE.includes(request.requestStatus);

  // Abandon flow state
  const [showAbandon, setShowAbandon] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [abandonReason, setAbandonReason] = useState('');
  const [abandoning, setAbandoning] = useState(false);
  const [abandonError, setAbandonError] = useState<string | null>(null);

  async function handleAbandon() {
    if (!agreedToTerms || abandonReason.trim().length < 10) return;
    setAbandoning(true);
    setAbandonError(null);
    try {
      await abandonDelivery(request.id, { agreedToTerms: true, reason: abandonReason.trim() });
      onAbandoned?.();
    } catch (err: any) {
      setAbandonError(err?.message ?? 'Failed to abandon delivery.');
      setAbandoning(false);
    }
  }

  function resetAbandon() {
    setShowAbandon(false);
    setAgreedToTerms(false);
    setAbandonReason('');
    setAbandonError(null);
  }

  return (
    <Card className={showAbandon ? 'border-warning/60' : ''}>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">{request.trackingCode}</span>
            <Badge tone={STATUS_TONES[request.requestStatus] ?? 'neutral'}>
              {STATUS_LABELS[request.requestStatus] ?? request.requestStatus}
            </Badge>
          </div>
          {request.estimatedDeliveryCost && (
            <span className="text-sm font-semibold text-foreground">
              {request.estimatedDeliveryCost.toLocaleString()} FCFA
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Package size={15} className="shrink-0 text-muted-foreground" />
          <span className="text-foreground">{request.items.map((i: { itemName: string }) => i.itemName).join(', ')}</span>
        </div>

        {request.route && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <span>
              <span className="text-foreground">{request.route.pickup}</span>
              <ArrowRight size={12} className="mx-1 inline text-muted-foreground" />
              <span className="text-foreground">{request.route.destination}</span>
            </span>
          </div>
        )}

        {request.providerAssignedAt && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={12} />
            Assigned {new Date(request.providerAssignedAt).toLocaleDateString('fr-CM', { dateStyle: 'medium' })}
          </p>
        )}

        {ACTIVE.includes(request.requestStatus) && (
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
            <WorkflowStepper status={request.requestStatus} />
          </div>
        )}

        {/* Normal workflow button row */}
        {!showAbandon && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {workflowEntry && onWorkflow && (
              <Button size="sm" disabled={workflowLoading} onClick={() => onWorkflow(workflowEntry.action)}>
                <CheckCircle2 size={15} />
                {workflowLoading ? 'Updating…' : workflowEntry.label}
              </Button>
            )}
            {canAbandon && (
              <button
                type="button"
                onClick={() => setShowAbandon(true)}
                className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-danger hover:underline"
              >
                Cancel delivery
              </button>
            )}
          </div>
        )}

        {/* ── Abandon confirmation panel ──────────────────────────────────── */}
        {showAbandon && (
          <div className="space-y-4 rounded-xl border border-warning/50 bg-warning/5 p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="shrink-0 text-warning" />
                <p className="font-semibold text-foreground">Cancel this delivery?</p>
              </div>
              <button onClick={resetAbandon} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Liability agreement */}
            <div className="rounded-lg border border-warning/40 bg-background px-4 py-3 text-sm leading-6 text-foreground">
              <p className="font-semibold">Before cancelling, read and agree to the following:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                <li>I confirm that I am <strong className="text-foreground">not currently in possession</strong> of the client&apos;s parcel or any items related to this delivery.</li>
                <li>I understand that if the client reports a missing or damaged parcel and I am found responsible, I may be held <strong className="text-foreground">financially and legally liable</strong>.</li>
                <li>I accept that my reliability score will be affected by this cancellation.</li>
              </ul>
              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 rounded accent-primary"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className="text-sm text-foreground">
                  I have read and agree to the above terms, and I confirm I do not hold the parcel.
                </span>
              </label>
            </div>

            {/* Reason textarea */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Reason for cancellation <span className="text-muted-foreground">(required, min 10 characters)</span>
              </label>
              <textarea
                rows={3}
                value={abandonReason}
                onChange={(e) => setAbandonReason(e.target.value)}
                placeholder="Please explain why you are ending this delivery (e.g. vehicle breakdown, personal emergency, route no longer possible…)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warning"
              />
              <p className={`text-right text-xs ${abandonReason.trim().length < 10 ? 'text-muted-foreground' : 'text-success'}`}>
                {abandonReason.trim().length}/500
              </p>
            </div>

            {abandonError && (
              <div className="flex items-center gap-2 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger">
                <AlertCircle size={14} /> {abandonError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-danger text-danger hover:bg-danger/10"
                disabled={!agreedToTerms || abandonReason.trim().length < 10 || abandoning}
                onClick={handleAbandon}
              >
                {abandoning ? 'Processing…' : 'Confirm cancellation'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetAbandon}>
                Keep delivery
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OfferCard({ offer }: { offer: ProviderOffer }) {
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gavel size={15} className="text-primary" />
            <span className="font-semibold text-foreground">{offer.offerAmount.toLocaleString()} FCFA</span>
            <Badge tone="warning">Pending</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(offer.submittedAt).toLocaleDateString('fr-CM', { dateStyle: 'medium' })}
          </span>
        </div>
        <p className="text-sm text-foreground">{offer.request.items.summary}</p>
        {offer.request.route && (
          <p className="text-xs text-muted-foreground">
            {offer.request.route.pickup} → {offer.request.route.destination}
          </p>
        )}
        {offer.message && (
          <p className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">&ldquo;{offer.message}&rdquo;</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
