import Link from 'next/link';
import { ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PublicProvider } from './provider-data';

export function ProviderCard({ provider }: { provider: PublicProvider }) {
  return (
    <Card className="shadow-none transition hover:border-primary/60 hover:shadow-soft">
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            {provider.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-foreground">{provider.name}</h2>
              {provider.verified ? (
                <Badge tone="success">
                  <ShieldCheck size={13} aria-hidden="true" />
                  Verified
                </Badge>
              ) : null}
              {provider.featured ? <Badge tone="primary">Featured</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{provider.type}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star size={15} className="fill-warning text-warning" aria-hidden="true" />
                {provider.rating} ({provider.reviewCount})
              </span>
              <span>{provider.eta}</span>
              <span>{provider.priceRange}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{provider.description}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/request">
                  Post Delivery Request
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/providers/${provider.id}`}>View Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
