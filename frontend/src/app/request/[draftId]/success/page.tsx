'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Route } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/routes';

export default function RequestSuccessPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const trackingCode = `DLG-${draftId.slice(-6).toUpperCase()}`;

  return (
    <main className="min-h-screen py-8 sm:py-12">
      <Container size="sm">
        <Card>
          <CardContent className="text-center">
            <CheckCircle2 className="mx-auto text-success" size={54} aria-hidden="true" />
            <h1 className="mt-5 text-3xl font-semibold text-foreground">Payment confirmed</h1>
            <p className="mt-3 text-muted-foreground">
              Your request has been created. Providers will be notified based on your selected workflow.
            </p>
            <div className="mt-6 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Tracking code</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{trackingCode}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg">
                <Link href={routes.tracking(trackingCode)}>
                  <Route size={19} aria-hidden="true" />
                  Track Request
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`https://wa.me/?text=Track%20my%20DeliGo%20request%20${trackingCode}`}>
                  <MessageCircle size={19} aria-hidden="true" />
                  Share on WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
