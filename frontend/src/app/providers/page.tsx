import Link from 'next/link';
import { Filter, Search } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { ProviderCard } from '@/features/providers/provider-card';
import { publicProviders } from '@/features/providers/provider-data';

export default function ProvidersPage() {
  return (
    <>
      <PublicHeader />
      <main className="py-6 sm:py-10">
        <Container className="space-y-6" size="xl">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
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
            <section className="grid gap-4">
              {publicProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </section>
          </div>
        </Container>
      </main>
    </>
  );
}
