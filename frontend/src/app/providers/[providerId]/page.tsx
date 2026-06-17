import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { findProvider, publicProviders } from '@/features/providers/provider-data';

export function generateStaticParams() {
  return publicProviders.map((provider) => ({ providerId: provider.id }));
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const provider = findProvider(providerId);

  if (!provider) {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main className="py-6 sm:py-10">
        <Container className="space-y-6" size="xl">
          <Button asChild variant="ghost" size="sm">
            <Link href="/providers">
              <ArrowLeft size={17} aria-hidden="true" />
              Providers
            </Link>
          </Button>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex size-16 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      {provider.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl font-semibold tracking-normal text-foreground">
                          {provider.name}
                        </h1>
                        {provider.verified ? (
                          <Badge tone="success">
                            <ShieldCheck size={13} aria-hidden="true" />
                            Verified
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-muted-foreground">{provider.type}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star size={15} className="fill-warning text-warning" aria-hidden="true" />
                          {provider.rating} ({provider.reviewCount} reviews)
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={15} aria-hidden="true" />
                          {provider.eta}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={15} aria-hidden="true" />
                          {provider.city}
                        </span>
                      </div>
                      <p className="mt-5 leading-7 text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-foreground">Service coverage</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{provider.coverage}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-foreground">Services</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <Badge key={service} tone="neutral">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-foreground">Create request</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Estimated price range</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {provider.priceRange}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Start a delivery request and choose this provider during the provider selection step.
                  </p>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/request">
                      Post Delivery Request
                      <ArrowRight size={19} aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </section>
        </Container>
      </main>
    </>
  );
}
