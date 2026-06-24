'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Search } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { ProviderProfileCard } from '@/features/provider-profile/provider-profile-card';
import { useAuthStore } from '@/features/auth/auth-store';
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
          <div className="h-9 w-36 rounded-lg bg-muted" />
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
  const [search, setSearch] = useState('');

  const isProvider = useAuthStore((s) => s.user?.roles.includes('provider') ?? false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProviders = useCallback((q: string) => {
    setLoading(true);
    setError(null);
    const params = q.trim() ? `?limit=50&page=1&search=${encodeURIComponent(q.trim())}` : '?limit=50&page=1';
    apiClient
      .get<ListResponse>(`/provider-profiles${params}`)
      .then((data) => {
        setProviders(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load providers. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProviders(''); }, [fetchProviders]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProviders(value), 400);
  }

  return (
    <>
      <PublicHeader />
      <main className="py-6 sm:py-10">
        <Container className="space-y-6" size="xl">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              {isProvider ? (
                <>
                  <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                    Explore the provider network.
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    Browse other providers on DeliGo — see their ratings, coverage, pricing, and customer reviews.
                    Use this to benchmark your own service and find ways to stand out.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                    Choose a provider, then post your delivery request.
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    Compare trusted riders, agencies, courier companies, and route-based carriers before
                    creating a request. Customer login is not required.
                  </p>
                </>
              )}
            </div>

            {!isProvider && (
              <Button asChild size="lg" className="w-full lg:w-auto lg:justify-self-end">
                <Link href="/request">Post Delivery Request</Link>
              </Button>
            )}
          </section>

          {/* Search bar — no filter button */}
          <Card className="shadow-none">
            <CardContent>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                  aria-hidden="true"
                />
                <Input
                  className="pl-10"
                  placeholder={isProvider ? 'Search by name, type, or city…' : 'Search by agency, courier, city, or delivery service'}
                  aria-label="Search providers"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Provider list — no sidebar */}
          <section className="grid gap-4">
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
                <Button variant="outline" onClick={() => fetchProviders(search)}>Try again</Button>
              </div>
            )}

            {!loading && !error && providers.length === 0 && (
              <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
                <p className="font-semibold text-foreground">
                  {search ? 'No providers match your search' : 'No providers yet'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search ? 'Try a different name or city.' : 'Be the first to list your delivery services on DeliGo.'}
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
                  <ProviderProfileCard key={profile.id} profile={profile} isProviderView={isProvider} />
                ))}
              </>
            )}
          </section>
        </Container>
      </main>
    </>
  );
}
