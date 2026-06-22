'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Gavel,
  Package,
  PackageCheck,
  Star,
  Truck,
  UserCheck,
  X,
} from 'lucide-react';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  getDeliveryRequestByTrackingCode,
  acceptOffer,
  cancelRequest,
  rejectOffer,
  submitReview,
  updateReview,
  type DeliveryRequestPublic,
} from '@/features/request/delivery-request-api';
import { routes } from '@/lib/routes';
import { ApiError } from '@/lib/api-client';

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  payment_initiated: 'Payment Initiated',
  payment_confirmed: 'Payment Confirmed',
  created: 'Request Active',
  marketplace_open: 'Open to Providers',
  offers_received: 'Offers Received',
  provider_assigned: 'Provider Assigned',
  pickup_verified: 'Pickup Verified',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  expired: 'Expired',
};

type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral';

const STATUS_TONES: Record<string, BadgeTone> = {
  created: 'primary',
  marketplace_open: 'primary',
  offers_received: 'primary',
  provider_assigned: 'primary',
  pickup_verified: 'primary',
  in_transit: 'primary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'warning',
  disputed: 'warning',
  expired: 'warning',
};

const EVENT_LABELS: Record<string, string> = {
  REQUEST_CREATED: 'Request Created',
  PROVIDER_ASSIGNED: 'Provider Assigned',
  DIRECT_REQUEST_REJECTED: 'Direct Request Rejected',
  PARCEL_COLLECTED: 'Parcel Collected',
  IN_TRANSIT: 'In Transit',
  ARRIVED_DESTINATION: 'Arrived at Destination',
  DELIVERED: 'Delivered',
  PROVIDER_ABANDONED: 'Provider Cancelled Delivery',
  REQUEST_CANCELLED: 'Request Cancelled',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [data, setData] = useState<DeliveryRequestPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Offer actions
  const [offerAction, setOfferAction] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Cancel request flow
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewEditing, setReviewEditing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function loadData(silent = false) {
    if (!trackingCode) return;
    try {
      const result = await getDeliveryRequestByTrackingCode(trackingCode);
      setData(result);
      setReviewSubmitted(!!result.review);
      return result;
    } catch {
      if (!silent) setNotFound(true);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!trackingCode) return;

    void loadData();

    // SSE: server pushes a frame the instant the provider records a status change
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const es = new EventSource(`${BASE}/delivery-requests/track/${trackingCode}/events`);

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as { event?: string };
        if (payload?.event === 'ping') return; // ignore 30-s keepalive frames
      } catch {
        // ignore non-JSON frames
      }
      void loadData(true);
    };

    return () => es.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingCode]);

  function handleCopy() {
    navigator.clipboard.writeText(trackingCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleAcceptOffer(offerId: string) {
    setOfferAction(offerId);
    setOfferError(null);
    try {
      await acceptOffer(trackingCode, offerId);
      await loadData();
    } catch (err) {
      setOfferError(err instanceof ApiError ? err.message : 'Failed to accept offer.');
    } finally {
      setOfferAction(null);
    }
  }

  async function handleRejectOffer(offerId: string) {
    setOfferAction(offerId);
    setOfferError(null);
    try {
      await rejectOffer(trackingCode, offerId);
      await loadData();
    } catch (err) {
      setOfferError(err instanceof ApiError ? err.message : 'Failed to reject offer.');
    } finally {
      setOfferAction(null);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (reviewRating === 0) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      if (reviewEditing) {
        await updateReview(trackingCode, reviewRating, reviewComment || undefined);
        setReviewEditing(false);
      } else {
        await submitReview(trackingCode, reviewRating, reviewComment || undefined);
      }
      setReviewSubmitted(true);
      await loadData();
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelRequest(trackingCode, cancelReason.trim() || undefined);
      setShowCancel(false);
      setCancelReason('');
      await loadData();
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  }

  function handleEditReview() {
    if (!data?.review) return;
    setReviewRating(data.review.rating);
    setReviewComment(data.review.comment ?? '');
    setReviewError(null);
    setReviewEditing(true);
  }

  const canReview = data?.requestStatus === 'delivered' || data?.requestStatus === 'completed';
  const pendingOffers = data?.offers?.filter((o) => o.status === 'submitted') ?? [];
  const showOffers = data?.fulfillmentMode === 'open_marketplace' && pendingOffers.length > 0;
  const canCancel = data != null && ['draft', 'created', 'marketplace_open', 'offers_received'].includes(data.requestStatus);

  return (
    <>
      <PublicHeader />
      <main className="py-6 sm:py-10">
        <Container className="max-w-2xl space-y-6">
          {/* Header */}
          <div>
            <Badge tone="primary">Tracking</Badge>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">Track Delivery</h1>
            <div className="mt-2 flex items-center gap-3">
              <p className="font-mono text-lg font-semibold text-foreground">{trackingCode}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {loading && (
            <Card>
              <CardContent className="space-y-3">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          )}

          {notFound && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="font-semibold text-foreground">Request not found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No delivery request was found with tracking code{' '}
                  <span className="font-mono font-semibold">{trackingCode}</span>.
                </p>
                <Button asChild className="mt-5" variant="outline">
                  <Link href={routes.home}>Back to home</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {data && (
            <>
              {/* Status card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="text-primary" size={22} />
                      <h2 className="font-semibold text-foreground">
                        {STATUS_LABELS[data.requestStatus] ?? data.requestStatus}
                      </h2>
                    </div>
                    <Badge tone={STATUS_TONES[data.requestStatus] ?? 'neutral'}>
                      {STATUS_LABELS[data.requestStatus] ?? data.requestStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="divide-y divide-border p-0">
                  <TrackRow label="Type" value={data.deliveryType.replace(/_/g, ' ')} />
                  {data.route?.pickup && <TrackRow label="From" value={data.route.pickup} />}
                  {data.route?.destination && <TrackRow label="To" value={data.route.destination} />}
                  <TrackRow
                    label="Items"
                    value={`${data.itemCount} item${data.itemCount !== 1 ? 's' : ''}${data.hasFragileItems ? ' · includes fragile' : ''}`}
                  />
                  {data.estimatedDeliveryCost != null && (
                    <TrackRow label="Estimated cost" value={`${data.estimatedDeliveryCost.toLocaleString()} FCFA`} />
                  )}
                  <TrackRow
                    label="Posted"
                    value={new Date(data.createdAt).toLocaleDateString('fr-CM', { dateStyle: 'long' })}
                  />
                </CardContent>
              </Card>

              {/* Offers card — only for marketplace mode with pending offers */}
              {showOffers && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-foreground">Provider Offers</h2>
                    <p className="text-sm text-muted-foreground">Accept an offer to assign a provider to your delivery.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {offerError && <p className="text-sm text-danger">{offerError}</p>}
                    {pendingOffers.map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Gavel size={15} className="text-primary" />
                            <span className="font-semibold text-foreground">
                              {offer.amount.toLocaleString()} FCFA
                            </span>
                          </div>
                          {offer.provider && (
                            <p className="text-sm text-muted-foreground">
                              {offer.provider.name}
                              {offer.provider.ratingCount > 0 && (
                                <span className="ml-2 inline-flex items-center gap-0.5">
                                  <Star size={11} className="fill-warning text-warning" />
                                  {offer.provider.rating.toFixed(1)}
                                </span>
                              )}
                            </p>
                          )}
                          {offer.message && (
                            <p className="text-xs text-muted-foreground">"{offer.message}"</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={offerAction === offer.id}
                            onClick={() => void handleAcceptOffer(offer.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={offerAction === offer.id}
                            onClick={() => void handleRejectOffer(offer.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Delivery progress stepper */}
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-foreground">Delivery Progress</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DeliveryProgressStepper status={data.requestStatus} />

                  {/* Activity log */}
                  {(data.events.length > 0 || ['created', 'marketplace_open', 'offers_received'].includes(data.requestStatus)) && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Log</p>
                      <ol className="space-y-3">
                        <TimelineItem
                          icon={<PackageCheck size={15} />}
                          tone="done"
                          title="Request Created"
                          detail={new Date(data.createdAt).toLocaleString('fr-CM', { dateStyle: 'medium', timeStyle: 'short' })}
                        />
                        {data.events.map((ev, idx) => (
                          <TimelineItem
                            key={idx}
                            icon={<CheckCircle2 size={15} />}
                            tone="done"
                            title={EVENT_LABELS[ev.eventType] ?? ev.eventType.replace(/_/g, ' ')}
                            detail={[
                              new Date(ev.occurredAt).toLocaleString('fr-CM', { dateStyle: 'medium', timeStyle: 'short' }),
                              ev.provider && `by ${ev.provider}`,
                              ev.notes,
                            ].filter(Boolean).join(' · ')}
                          />
                        ))}
                        {['created', 'marketplace_open', 'offers_received'].includes(data.requestStatus) && (
                          <TimelineItem
                            icon={<Clock size={15} />}
                            tone="pending"
                            title="Waiting for Provider"
                            detail="Providers are being notified"
                          />
                        )}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review section */}
              {canReview && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-semibold text-foreground">Rate Your Delivery</h2>
                      {(reviewSubmitted || data.review) && !reviewEditing && (
                        <button
                          type="button"
                          onClick={handleEditReview}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Edit review
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(reviewSubmitted || data.review) && !reviewEditing ? (
                      /* ── Submitted review display ── */
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/6 px-4 py-4">
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-success">Review submitted</p>
                            {data.review && (
                              <div className="mt-2 space-y-1.5">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={16}
                                      className={i < data.review!.rating ? 'fill-warning text-warning' : 'text-border'}
                                    />
                                  ))}
                                  <span className="ml-1.5 text-sm font-semibold text-foreground">
                                    {data.review.rating}/5
                                  </span>
                                </div>
                                {data.review.comment ? (
                                  <p className="text-sm leading-6 text-muted-foreground">
                                    &ldquo;{data.review.comment}&rdquo;
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">No written comment.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your review is visible to other customers when choosing a provider.
                        </p>
                      </div>
                    ) : (
                      /* ── Review form (new or edit) ── */
                      <form onSubmit={(e) => void handleSubmitReview(e)} className="space-y-4">
                        {reviewEditing && (
                          <p className="text-sm text-muted-foreground">Update your rating or comment below.</p>
                        )}
                        <div>
                          <p className="mb-2 text-sm font-medium text-foreground">Rating</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="transition hover:scale-110"
                              >
                                <Star
                                  size={28}
                                  className={star <= reviewRating ? 'fill-warning text-warning' : 'text-border'}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-foreground">
                            Comment (optional)
                          </label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={3}
                            placeholder="Share your experience…"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        {reviewError && <p className="text-sm text-danger">{reviewError}</p>}
                        <div className="flex gap-2">
                          <Button type="submit" disabled={reviewRating === 0 || reviewSubmitting}>
                            {reviewSubmitting
                              ? reviewEditing ? 'Saving…' : 'Submitting…'
                              : reviewEditing ? 'Save changes' : 'Submit Review'}
                          </Button>
                          {reviewEditing && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setReviewEditing(false)}
                              disabled={reviewSubmitting}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Cancel request */}
              {canCancel && (
                <Card className={showCancel ? 'border-danger/40' : ''}>
                  <CardContent className="py-4">
                    {!showCancel ? (
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                          No provider has accepted this request yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCancel(true)}
                          className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-danger hover:underline"
                        >
                          Cancel request
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={17} className="shrink-0 text-danger" />
                            <p className="font-semibold text-foreground">Cancel this request?</p>
                          </div>
                          <button onClick={() => { setShowCancel(false); setCancelReason(''); setCancelError(null); }} className="text-muted-foreground hover:text-foreground">
                            <X size={16} />
                          </button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          This will permanently cancel your request. You can place a new one at any time. This action cannot be undone.
                        </p>

                        {/* Optional reason */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Reason <span className="text-muted-foreground">(optional)</span>
                          </label>
                          <textarea
                            rows={2}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Why are you cancelling? (optional)"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-danger/40"
                          />
                        </div>

                        {cancelError && (
                          <div className="flex items-center gap-2 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger">
                            <AlertCircle size={14} /> {cancelError}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-danger text-danger hover:bg-danger/10"
                            disabled={cancelling}
                            onClick={() => void handleCancel()}
                          >
                            {cancelling ? 'Cancelling…' : 'Yes, cancel request'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setShowCancel(false); setCancelReason(''); setCancelError(null); }}>
                            Keep request
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="text-center">
                <Button asChild variant="outline">
                  <Link href={routes.home}>Back to home</Link>
                </Button>
              </div>
            </>
          )}
        </Container>
      </main>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TrackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-[160px_1fr] sm:gap-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm capitalize text-foreground">{value}</p>
    </div>
  );
}

// ── Delivery progress stepper ─────────────────────────────────────────────────

const DELIVERY_STEPS = [
  { label: 'Created',  sub: 'Request placed',    Icon: PackageCheck },
  { label: 'Assigned', sub: 'Provider confirmed', Icon: UserCheck   },
  { label: 'Collected', sub: 'Parcel picked up',  Icon: Package     },
  { label: 'In Transit', sub: 'On the way',        Icon: Truck       },
  { label: 'Delivered', sub: 'Arrived!',           Icon: CheckCircle2 },
] as const;

function trackingStepIndex(status: string): number {
  switch (status) {
    case 'created':
    case 'marketplace_open':
    case 'offers_received':  return 0;
    case 'provider_assigned': return 1;
    case 'pickup_verified':   return 2;
    case 'in_transit':        return 3;
    case 'delivered':
    case 'completed':         return 4;
    default:                  return 0;
  }
}

function DeliveryProgressStepper({ status }: { status: string }) {
  const current = trackingStepIndex(status);
  const isTerminal = status === 'cancelled' || status === 'disputed' || status === 'expired';

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/8 px-4 py-3 text-sm text-warning">
        <Clock size={16} />
        <span className="font-medium capitalize">{status}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start">
      {DELIVERY_STEPS.map(({ label, sub, Icon }, i) => {
        const done   = i < current;
        const active = i === current;

        return (
          <div key={label} className="flex flex-1 flex-col items-center">
            {/* connector + node */}
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : done ? 'bg-success' : active ? 'bg-primary/40' : 'bg-border'}`} />
              <span
                className={[
                  'flex size-9 shrink-0 items-center justify-center rounded-full transition-all',
                  done   ? 'bg-success text-white'                                                   : '',
                  active ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/40 ring-4 ring-primary/20' : '',
                  !done && !active ? 'border-2 border-border bg-background text-muted-foreground'   : '',
                ].join(' ')}
              >
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </span>
              <div className={`h-0.5 flex-1 ${i === DELIVERY_STEPS.length - 1 ? 'invisible' : done ? 'bg-success' : 'bg-border'}`} />
            </div>

            {/* label + sub */}
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <span className={`text-center text-[11px] font-semibold leading-tight ${
                done ? 'text-success' : active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
              <span className={`hidden text-center text-[10px] leading-tight sm:block ${
                active ? 'text-primary/70' : 'text-muted-foreground/60'
              }`}>
                {sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Activity log item ─────────────────────────────────────────────────────────

function TimelineItem({
  icon,
  tone,
  title,
  detail,
}: {
  icon: React.ReactNode;
  tone: 'done' | 'pending';
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
          tone === 'done' ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground'
        }`}
      >
        {icon}
      </span>
      <div>
        <p className={`text-sm font-semibold ${tone === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
