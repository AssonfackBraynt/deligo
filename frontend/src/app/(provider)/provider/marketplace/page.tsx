'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Gavel,
  MapPin,
  Package,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { ProviderNav } from '@/components/layout/provider-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { SecureImage } from '@/components/ui/file-upload';
import { Field, Input, Textarea } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { ApiError } from '@/lib/api-client';
import {
  listMarketplace,
  takeRequest,
  bidOnRequest,
} from '@/features/provider-portal/provider-portal-api';
import type { MarketplacePost } from '@/features/provider-portal/provider-portal-types';
import { useAuthStore } from '@/features/auth/auth-store';
import { useMarketplaceSocket } from '@/hooks/use-marketplace-socket';
import { useProviderBadgeStore } from '@/features/provider-portal/provider-badge-store';

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  document_delivery: 'Documents',
  product_delivery: 'Product',
  purchase_delivery: 'Purchase',
  business_delivery: 'Business',
  intercity_delivery: 'Intercity',
  agency_pickup: 'Agency Pickup',
  other: 'Other',
};

export default function MarketplacePage() {
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearMarketplace = useProviderBadgeStore((s) => s.clearMarketplace);

  // Bid modal state
  const [bidTarget, setBidTarget] = useState<MarketplacePost | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Take confirmation state
  const [takingId, setTakingId] = useState<string | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await listMarketplace();
      setPosts(data);
    } catch {
      setError('Could not load marketplace. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    clearMarketplace();
    load();
  }, [clearMarketplace]);

  // WebSocket: new post pushed by server → prepend it
  const handleNew = useCallback((post: MarketplacePost) => {
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      return [post, ...prev];
    });
  }, []);

  // WebSocket: post taken by another provider → remove it
  const handleRemoved = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useMarketplaceSocket(accessToken, { onNew: handleNew, onRemoved: handleRemoved });

  async function handleTake(post: MarketplacePost) {
    setTakingId(post.id);
    try {
      await takeRequest(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to take request. Try again.');
    } finally {
      setTakingId(null);
    }
  }

  async function handleBidSubmit() {
    if (!bidTarget) return;
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) {
      setBidError('Enter a valid bid amount.');
      return;
    }
    setBidSubmitting(true);
    setBidError(null);
    try {
      await bidOnRequest(bidTarget.id, amount, bidMessage.trim() || undefined);
      setPosts((prev) =>
        prev.map((p) => (p.id === bidTarget.id ? { ...p, _hasBid: true } : p)),
      );
      setBidTarget(null);
      setBidAmount('');
      setBidMessage('');
    } catch (err) {
      setBidError(err instanceof ApiError ? err.message : 'Failed to submit bid. Try again.');
    } finally {
      setBidSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ProviderNav activePath={routes.provider.marketplace} />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Open Marketplace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Delivery requests in your area — take one directly or submit a price bid.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-danger">
              <AlertCircle size={20} />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && posts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package size={40} className="mx-auto text-muted-foreground/50" />
              <p className="mt-3 font-semibold text-foreground">No open requests right now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New requests in your area will appear here. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => (
              <MarketplaceCard
                key={post.id}
                post={post}
                taking={takingId === post.id}
                onTake={() => handleTake(post)}
                onBid={() => {
                  setBidTarget(post);
                  setBidAmount(String(post.desiredRewardAmount ?? ''));
                  setBidMessage('');
                  setBidError(null);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bid modal */}
      <Dialog open={!!bidTarget} onClose={() => setBidTarget(null)} title="Submit a Bid">
          {bidTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium text-foreground">{bidTarget.items.summary}</p>
                <p className="mt-1 text-muted-foreground">
                  {bidTarget.route?.pickup} → {bidTarget.route?.destination}
                </p>
                {bidTarget.desiredRewardAmount && (
                  <p className="mt-1 text-muted-foreground">
                    Customer offer: <span className="font-semibold text-foreground">
                      {bidTarget.desiredRewardAmount.toLocaleString()} FCFA
                    </span>
                  </p>
                )}
              </div>

              {bidError && (
                <p className="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2 text-sm text-danger">
                  {bidError}
                </p>
              )}

              <Field label="Your bid amount (FCFA)">
                <Input
                  type="number"
                  min="100"
                  placeholder="e.g. 3500"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={bidSubmitting}
                />
              </Field>

              <Field label="Message (optional)" hint="Tell the customer why they should pick you.">
                <Textarea
                  placeholder="I can pick up within 30 minutes and deliver safely…"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  disabled={bidSubmitting}
                />
              </Field>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setBidTarget(null)}
                  disabled={bidSubmitting}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleBidSubmit} disabled={bidSubmitting}>
                  <Gavel size={16} />
                  {bidSubmitting ? 'Submitting…' : 'Submit Bid'}
                </Button>
              </div>
            </div>
          )}
      </Dialog>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function MarketplaceCard({
  post,
  taking,
  onTake,
  onBid,
}: {
  post: MarketplacePost;
  taking: boolean;
  onTake: () => void;
  onBid: () => void;
}) {
  const timeAgo = formatRelativeTime(post.createdAt);

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">
              {DELIVERY_TYPE_LABELS[post.deliveryType] ?? post.deliveryType}
            </Badge>
            {post.items.hasFragile && <Badge tone="warning">Fragile</Badge>}
            {post.items.categories.length > 0 && (
              <Badge tone="neutral">{post.items.categories[0]}</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Items */}
        <div className="flex items-start gap-3">
          {post.items.photoFileId && (
            <SecureImage
              fileId={post.items.photoFileId}
              alt="Item photo"
              className="size-16 shrink-0 rounded-lg object-cover border border-border"
            />
          )}
          <div className="flex items-start gap-2 text-sm">
            <Package size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-foreground">
              {post.items.summary}
              <span className="ml-1 text-muted-foreground">
                ({post.items.count} item{post.items.count !== 1 ? 's' : ''})
              </span>
            </span>
          </div>
        </div>

        {/* Route */}
        {post.route && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <span className="text-foreground">{post.route.pickup}</span>
              <ArrowRight size={13} className="mx-1 inline text-muted-foreground" />
              <span className="text-foreground">{post.route.destination}</span>
              {post.route.pickupLandmark && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pickup: {post.route.pickupLandmark}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Price + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div>
            {post.desiredRewardAmount ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Customer offer: </span>
                <span className="font-semibold text-foreground">
                  {post.desiredRewardAmount.toLocaleString()} FCFA
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No price set — open to bids</p>
            )}
            {post.estimatedDeliveryCost && (
              <p className="text-xs text-muted-foreground">
                Platform estimate: {post.estimatedDeliveryCost.toLocaleString()} FCFA
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onBid}>
              <Gavel size={15} />
              Bid
            </Button>
            <Button size="sm" onClick={onTake} disabled={taking}>
              <Zap size={15} />
              {taking ? 'Taking…' : 'Take it'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
