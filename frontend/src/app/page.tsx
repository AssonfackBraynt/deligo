import { ArrowRight, Bike, Building2, FileText, Package, ShoppingBag, Truck } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { AuthRedirect } from '@/components/layout/auth-redirect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickRequestWidget } from '@/features/request/components/quick-request-widget';
import { FindJobsButton } from '@/components/layout/find-jobs-button';

const categories = [
  { title: 'Agency Pickup', icon: Building2 },
  { title: 'Document Delivery', icon: FileText },
  { title: 'Product Delivery', icon: Package },
  { title: 'Purchase & Delivery', icon: ShoppingBag },
  { title: 'Business Delivery', icon: Bike },
  { title: 'Intercity Delivery', icon: Truck },
];

type PublicStats = {
  totalDeliveries: number;
  totalCarriers: number;
  totalQuarters: number;
};

async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/locations/public-stats`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const stats = await fetchPublicStats();

  const statItems = [
    { label: 'Total Deliveries', value: stats ? `${stats.totalDeliveries.toLocaleString()}+` : '—' },
    { label: 'Number of Carriers', value: stats ? `${stats.totalCarriers.toLocaleString()}+` : '—' },
    { label: 'Quarters Covered', value: stats ? stats.totalQuarters.toLocaleString() : '—' },
    { label: 'Support Available', value: '24/7' },
  ];

  return (
    <>
      <AuthRedirect />
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden">
          <Container className="grid min-h-[calc(100vh-4rem)] gap-8 py-8 sm:py-10 lg:grid-cols-[1fr_420px] lg:items-center lg:py-14">
            <div>
              <Badge tone="primary">Logistics coordination for Cameroon</Badge>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl lg:text-6xl">
                Move Anything, Anywhere, Faster.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Connect with trusted delivery companies, riders, agencies, and travelers already moving
                in your direction.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href="/request">
                    Post Delivery Request
                    <ArrowRight size={19} aria-hidden="true" />
                  </a>
                </Button>
                <FindJobsButton />
              </div>
            </div>
            <QuickRequestWidget />
          </Container>
        </section>

        <section className="border-y border-border bg-surface py-8 sm:py-10">
          <Container>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.title} className="shadow-none">
                    <CardContent className="flex min-h-28 flex-col justify-between">
                      <Icon className="text-primary" size={24} aria-hidden="true" />
                      <p className="mt-4 text-sm font-semibold text-foreground">{category.title}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>

        <section className="py-8 sm:py-10">
          <Container>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {statItems.map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-surface p-5">
                  <p className="text-3xl font-semibold text-foreground">{value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
