'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Filter, PackageCheck, Search } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { ProviderProfileCard } from '@/features/provider-profile/provider-profile-card';
import type { ProviderProfilePublic } from '@/features/provider-profile/profile-types';

type ListResponse = {
  items: ProviderProfilePublic[];
  total: number;
  page: number;
  limit: number;
};

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <div className="size-12 shrink-0 rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="flex gap-2 pt-1">
            <div className="h-9 w-48 rounded-lg bg-muted" />
            <div className="h-9 w-28 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderProfilePublic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get<ListResponse>('/provider-profiles?limit=50&page=1')
      .then((data) => {
        setProviders(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : 'Failed to load providers. Please try again.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return (
    <>
      <PublicHeader />
      <main className="py-6 sm:py-10">
        <Container className="space-y-6" size="xl">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              {/* DeliGo brand mark */}
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <PackageCheck size={22} aria-hidden="true" />
                </span>
                <span className="text-sm font-bold tracking-widest text-primary uppercase">DeliGo</span>
              </div>
              <Badge tone="primary">Verified delivery providers</Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                Choose a provider, then post your delivery request.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Compare trusted riders, agencies, courier companies, and route-based carriers before
                creating a request. Customer login is not required.
              </p>
            </div>
            <Button asChild size="lg" className="w-full lg:w-auto lg:justify-self-end">
              <Link href="/request">Post Delivery Request</Link>
            </Button>
          </section>

          <Card className="shadow-none">
            <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                  aria-hidden="true"
                />
                <Input
                  className="pl-10"
                  placeholder="Search by agency, courier, city, or delivery service"
                  aria-label="Search providers"
                />
              </div>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter size={17} aria-hidden="true" />
                Filters
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden rounded-lg border border-border bg-surface p-4 lg:block">
              <h2 className="font-semibold text-foreground">Service categories</h2>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {[
                  'Agency Pickup',
                  'Document Delivery',
                  'Product Delivery',
                  'Purchase & Delivery',
                  'Business Delivery',
                  'Intercity Delivery',
                ].map((category) => (
                  <label key={category} className="flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-primary" />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </aside>

            <section className="grid gap-4 self-start">
              {loading && (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center gap-4 rounded-xl border border-danger/30 bg-danger/8 px-6 py-10 text-center">
                  <AlertCircle size={32} className="text-danger" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Could not load providers</p>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  </div>
                  <Button variant="outline" onClick={fetchProviders}>
                    Try again
                  </Button>
                </div>
              )}

              {!loading && !error && providers.length === 0 && (
                <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
                  <p className="font-semibold text-foreground">No providers yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Be the first to list your delivery services on DeliGo.
                  </p>
                </div>
              )}

              {!loading && !error && providers.length > 0 && (
                <>
                  {total > providers.length && (
                    <p className="text-sm text-muted-foreground">
                      Showing {providers.length} of {total} providers
                    </p>
                  )}
                  {providers.map((profile) => (
                    <ProviderProfileCard key={profile.id} profile={profile} />
                  ))}
                </>
              )}
            </section>
          </div>
        </Container>
      </main>
    </>
  );
}
