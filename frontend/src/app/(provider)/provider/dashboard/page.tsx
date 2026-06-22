'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Gavel,
  GitBranch,
  MapPin,
  Navigation,
  Package,
  ShoppingBag,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { ProviderNav } from '@/components/layout/provider-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import { getBranchStats, getMyBranches, getMyProfile, getStats, updateAvailability } from '@/features/provider-portal/provider-portal-api';
import type { ProviderStats } from '@/features/provider-portal/provider-portal-types';
import type { BranchStats, ProviderBranch, ProviderProfilePrivate } from '@/features/provider-profile/profile-types';

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  unavailable: 'Unavailable',
  offline: 'Offline',
};

const AVAILABILITY_CYCLE: Record<string, string> = {
  available: 'busy',
  busy: 'available',
  unavailable: 'available',
  offline: 'available',
};

export default function ProviderDashboardPage() {
  const [profile, setProfile] = useState<ProviderProfilePrivate | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [branches, setBranches] = useState<ProviderBranch[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);

  const isCompany =
    profile?.providerType === 'courier_company' ||
    profile?.providerType === 'logistics_company';

  const isRider = profile?.providerType === 'independent_rider';

  useEffect(() => {
    void (async () => {
      const [p, s] = await Promise.all([getMyProfile(), getStats()]);
      setProfile(p);
      setStats(s);
      const company = p.providerType === 'courier_company' || p.providerType === 'logistics_company';
      if (company) {
        const bs = await getMyBranches();
        setBranches(bs);
        const statsResults = await Promise.all(bs.map((b) => getBranchStats(b.id).catch(() => null)));
        setBranchStats(statsResults.filter(Boolean) as BranchStats[]);
      }
      setLoading(false);
    })();
  }, []);

  async function handleToggleAvailability() {
    if (!profile || toggling) return;
    const next = AVAILABILITY_CYCLE[profile.availabilityStatus] ?? 'available';
    setToggling(true);
    try {
      const updated = await updateAvailability(next);
      setProfile(updated);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ProviderNav activePath={routes.provider.dashboard} />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {loading ? (
              <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-foreground">
                  Welcome back, {profile?.displayName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground capitalize">
                  {profile?.providerType?.replace(/_/g, ' ')}
                </p>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAvailability}
            disabled={toggling || !profile}
          >
            <span
              className={`mr-2 size-2 rounded-full ${
                profile?.availabilityStatus === 'available'
                  ? 'bg-success'
                  : profile?.availabilityStatus === 'busy'
                  ? 'bg-warning'
                  : 'bg-muted-foreground'
              }`}
            />
            {AVAILABILITY_LABELS[profile?.availabilityStatus ?? 'offline'] ?? 'Offline'}
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Activity size={20} className="text-primary" />}
            label="Active Requests"
            value={stats?.activeRequests}
            loading={loading}
          />
          <StatCard
            icon={<CheckCircle2 size={20} className="text-success" />}
            label="Completed"
            value={stats?.completedRequests}
            loading={loading}
          />
          <StatCard
            icon={<Gavel size={20} className="text-warning" />}
            label="Pending Bids"
            value={stats?.pendingOffers}
            loading={loading}
          />
          <StatCard
            icon={<Star size={20} className="text-yellow-500" />}
            label="Rating"
            value={
              stats
                ? `${stats.ratingAverage.toFixed(1)} (${stats.ratingCount})`
                : undefined
            }
            loading={loading}
          />
        </div>

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            href={routes.provider.marketplace}
            icon={<ShoppingBag size={22} className="text-primary" />}
            title="Browse Marketplace"
            description="See open requests in your area"
          />
          <QuickAction
            href={routes.provider.myRequests}
            icon={<Package size={22} className="text-primary" />}
            title="My Requests"
            description="Track your active and completed deliveries"
          />
          {isCompany ? (
            <QuickAction
              href={routes.provider.agents}
              icon={<Users size={22} className="text-primary" />}
              title="Manage Agents"
              description="View your riders and assign deliveries"
            />
          ) : isRider ? (
            <QuickAction
              href={routes.provider.myRoutes}
              icon={<Navigation size={22} className="text-primary" />}
              title="My Routes"
              description="Post planned trips and match jobs along the way"
            />
          ) : (
            <QuickAction
              href={routes.provider.myRequests + '?tab=offers'}
              icon={<Zap size={22} className="text-primary" />}
              title="My Bids"
              description="Track offers you've submitted"
            />
          )}
        </div>

        {/* Branch stats (company only) */}
        {isCompany && branchStats.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <GitBranch size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Branch Overview</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {branchStats.map((b) => (
                <Card key={b.branchId} className="shadow-none">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
                          {b.isHeadquarters && (
                            <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">HQ</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{b.location}</p>
                        <div className="mt-2 flex gap-4 text-xs">
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{b.activeRequests}</span> active
                          </span>
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{b.completedDeliveries}</span> delivered
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-2 text-right">
              <Link href={routes.provider.myProfile} className="text-xs text-primary hover:underline">
                Manage branches →
              </Link>
            </div>
          </div>
        )}

        {/* Prompt to add branches if none yet (company only) */}
        {isCompany && !loading && branches.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <GitBranch size={20} className="shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Add branch locations</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Customers searching near your branches will see you first in recommendations.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={routes.provider.myProfile}>Add branch</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Profile completeness hint */}
        {profile && profile.verificationStatus !== 'verified' && (
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold text-foreground">Complete your verification</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Verified providers appear first and earn more trust from customers.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={routes.provider.editProfile}>Update profile</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-1 h-5 w-12 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-xl font-semibold text-foreground">{value ?? '—'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
    </Link>
  );
}
