import { Clock, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const stages = ['Request Created', 'Provider Assigned', 'Pickup Verified', 'In Transit', 'Delivered', 'Completed'];

export default async function TrackingPage({ params }: { params: Promise<{ trackingCode: string }> }) {
  const { trackingCode } = await params;

  return (
    <>
      <PublicHeader />
      <main className="py-6 sm:py-10">
        <Container className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <div className="mb-5">
              <Badge tone="primary">Tracking</Badge>
              <h1 className="mt-3 text-3xl font-semibold text-foreground">Current Status</h1>
              <p className="mt-2 text-muted-foreground">Tracking code: {trackingCode}</p>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Truck className="text-primary" size={24} aria-hidden="true" />
                  <div>
                    <h2 className="font-semibold text-foreground">Provider Assigned</h2>
                    <p className="text-sm text-muted-foreground">Last updated a few moments ago</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {stages.map((stage, index) => (
                    <li key={stage} className="flex gap-3">
                      <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-primary/12 text-primary">
                        {index < 2 ? <PackageCheck size={16} /> : <Clock size={16} />}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{stage}</p>
                        <p className="text-sm text-muted-foreground">
                          {index < 2 ? 'Completed' : 'Waiting for update'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>
          <aside>
            <Card>
              <CardContent>
                <ShieldCheck className="text-primary" size={28} aria-hidden="true" />
                <h2 className="mt-3 font-semibold text-foreground">Responsible party</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Express Rider Douala is currently responsible for the delivery.
                </p>
              </CardContent>
            </Card>
          </aside>
        </Container>
      </main>
    </>
  );
}
