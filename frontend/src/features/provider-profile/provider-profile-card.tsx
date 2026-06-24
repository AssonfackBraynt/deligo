'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bike,
  Building2,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import type { AvailabilityStatus, ProviderProfilePublic, ProviderType } from './profile-types';

const TYPE_ICONS: Record<ProviderType, React.ReactNode> = {
  independent_rider: <Bike size={24} aria-hidden="true" />,
  courier_company: <Building2 size={24} aria-hidden="true" />,
  logistics_company: <Truck size={24} aria-hidden="true" />,
};

const TYPE_LABELS: Record<ProviderType, string> = {
  independent_rider: 'Independent Rider',
  courier_company: 'Courier Company',
  logistics_company: 'Logistics Company',
};

const AVAILABILITY_DOT: Record<AvailabilityStatus, string> = {
  available: 'bg-success',
  busy: 'bg-warning',
  unavailable: 'bg-muted-foreground',
  offline: 'bg-muted-foreground',
};

const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  unavailable: 'Unavailable',
  offline: 'Offline',
};

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'fill-warning text-warning' : 'text-border'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ProviderProfileCard({
  profile,
  isProviderView = false,
}: {
  profile: ProviderProfilePublic;
  isProviderView?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const isRider = profile.providerType === 'independent_rider';
  const isVerified = profile.verificationStatus === 'verified';
  const location = isRider ? profile.baseCity : profile.businessAddress;
  const reviews = profile.recentReviews?.filter((r) => r.comment) ?? [];

  return (
    <>
      <Card className="shadow-none transition hover:border-primary/60 hover:shadow-soft">
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              {TYPE_ICONS[profile.providerType]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-foreground">{profile.displayName}</h2>
                {isVerified && (
                  <Badge tone="success">
                    <ShieldCheck size={13} aria-hidden="true" />
                    Verified
                  </Badge>
                )}
                {profile.isFeatured && <Badge tone="primary">Featured</Badge>}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {TYPE_LABELS[profile.providerType]}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star size={15} className="fill-warning text-warning" aria-hidden="true" />
                  {profile.ratingAverage.toFixed(1)}
                  {profile.ratingCount > 0 && ` (${profile.ratingCount})`}
                </span>
                {location && <span>{location}</span>}
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${AVAILABILITY_DOT[profile.availabilityStatus]}`}
                    aria-hidden="true"
                  />
                  {AVAILABILITY_LABEL[profile.availabilityStatus]}
                </span>
              </div>

              {profile.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {profile.description}
                </p>
              )}

              {(profile.priceInTown || profile.priceInRegion) && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {profile.priceInTown && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-medium">
                      In-town: {profile.priceInTown.toLocaleString()} FCFA
                    </span>
                  )}
                  {profile.priceInRegion && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-medium">
                      In-region: {profile.priceInRegion.toLocaleString()} FCFA
                    </span>
                  )}
                </div>
              )}

              {isRider && profile.serviceCoverage && (
                <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Coverage:</span>{' '}
                  {profile.serviceCoverage}
                </p>
              )}

              {reviews.length > 0 && <ReviewSlider reviews={reviews} />}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {!isProviderView && (
                  <Button asChild>
                    <Link href="/request">
                      Post Delivery Request
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={isProviderView ? () => setModalOpen(true) : undefined}
                  asChild={!isProviderView}
                >
                  {isProviderView ? (
                    'View Provider Profile'
                  ) : (
                    <Link href={`/providers/${profile.id}`}>View Profile</Link>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider detail modal — shown only in provider view */}
      {isProviderView && (
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={profile.displayName}>
          <div className="space-y-5">
            {/* Identity row */}
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                {TYPE_ICONS[profile.providerType]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {isVerified && (
                    <Badge tone="success">
                      <ShieldCheck size={12} />
                      Verified
                    </Badge>
                  )}
                  {profile.isFeatured && <Badge tone="primary">Featured</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{TYPE_LABELS[profile.providerType]}</p>
              </div>
            </div>

            {/* Rating & availability */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="text-center">
                <p className="text-2xl font-semibold text-foreground">{profile.ratingAverage.toFixed(1)}</p>
                <StarRow rating={Math.round(profile.ratingAverage)} size={14} />
                <p className="mt-0.5 text-xs text-muted-foreground">{profile.ratingCount} review{profile.ratingCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <span className={`size-2.5 rounded-full ${AVAILABILITY_DOT[profile.availabilityStatus]}`} />
                  {AVAILABILITY_LABEL[profile.availabilityStatus]}
                </span>
              </div>
            </div>

            {/* Description */}
            {profile.description && (
              <p className="text-sm leading-6 text-muted-foreground">{profile.description}</p>
            )}

            {/* Location */}
            {location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>{location}</span>
              </div>
            )}

            {/* Phone */}
            {profile.phoneNumber && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={15} className="shrink-0 text-primary" />
                <span>{profile.phoneNumber}</span>
              </div>
            )}

            {/* Coverage */}
            {isRider && profile.serviceCoverage && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service Coverage</p>
                <p className="mt-1 text-sm text-foreground">{profile.serviceCoverage}</p>
              </div>
            )}

            {/* Pricing */}
            {(profile.priceInTown || profile.priceInRegion) && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {profile.priceInTown && (
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">In-town</p>
                      <p className="font-semibold text-foreground">{profile.priceInTown.toLocaleString()} FCFA</p>
                    </div>
                  )}
                  {profile.priceInRegion && (
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">In-region</p>
                      <p className="font-semibold text-foreground">{profile.priceInRegion.toLocaleString()} FCFA</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer Reviews
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {reviews.map((r, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                      <StarRow rating={r.rating} />
                      {r.comment && (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">&ldquo;{r.comment}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

// ── Auto-sliding review carousel ──────────────────────────────────────────────

type Review = { rating: number; comment: string | null; createdAt: string };

function ReviewSlider({ reviews }: { reviews: Review[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % reviews.length), 7000);
    return () => clearInterval(t);
  }, [reviews.length]);

  const review = reviews[idx];
  if (!review) return null;

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquare size={12} aria-hidden="true" />
          Customer reviews
        </p>
        {reviews.length > 1 && (
          <div className="flex items-center gap-1">
            {reviews.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Review ${i + 1}`}
                onClick={() => setIdx(i)}
                className={[
                  'size-1.5 rounded-full transition-all',
                  i === idx ? 'bg-primary scale-125' : 'bg-border hover:bg-muted-foreground',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <StarRow rating={review.rating} />
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
          &ldquo;{review.comment}&rdquo;
        </p>
      </div>
    </div>
  );
}
