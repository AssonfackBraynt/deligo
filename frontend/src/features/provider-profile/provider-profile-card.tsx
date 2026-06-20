import Link from 'next/link';
import { ArrowRight, Bike, Building2, MessageSquare, ShieldCheck, Star, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? 'fill-warning text-warning' : 'text-border'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ProviderProfileCard({ profile }: { profile: ProviderProfilePublic }) {
  const isRider = profile.providerType === 'independent_rider';
  const isVerified = profile.verificationStatus === 'verified';
  const location = isRider ? profile.baseCity : profile.businessAddress;
  const reviews = profile.recentReviews?.filter((r) => r.comment) ?? [];

  return (
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

            {isRider && profile.serviceCoverage && (
              <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Coverage:</span>{' '}
                {profile.serviceCoverage}
              </p>
            )}

            {/* Recent customer reviews */}
            {reviews.length > 0 && (
              <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MessageSquare size={12} aria-hidden="true" />
                  Customer reviews
                </p>
                {reviews.map((r, i) => (
                  <div key={i} className="space-y-0.5">
                    <StarRow rating={r.rating} />
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/request">
                  Post Delivery Request
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/providers/${profile.id}`}>View Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
