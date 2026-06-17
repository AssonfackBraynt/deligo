import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from './container';
import { Button } from '@/components/ui/button';
import { RequestProgress } from '@/features/request/components/request-progress';
import { RequestSummaryPanel } from '@/features/request/components/request-summary-panel';
import type { RequestStep } from '@/features/request/request-types';

type RequestFlowLayoutProps = {
  draftId: string;
  step: RequestStep;
  title: string;
  description?: string;
  backHref?: string;
  children: React.ReactNode;
};

export function RequestFlowLayout({
  draftId,
  step,
  title,
  description,
  backHref = '/',
  children,
}: RequestFlowLayoutProps) {
  return (
    <main className="min-h-screen pb-28 lg:pb-12">
      <Container className="py-4 sm:py-6 lg:py-8" size="xl">
        <div className="mb-5 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href={backHref}>
              <ArrowLeft size={17} aria-hidden="true" />
              Back
            </Link>
          </Button>
          <Link href="/" className="text-sm font-semibold text-primary">
            DeliGo
          </Link>
        </div>
        <RequestProgress currentStep={step} />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section>
            <div className="mb-5">
              <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {children}
          </section>
          <aside className="hidden lg:block">
            <RequestSummaryPanel draftId={draftId} />
          </aside>
        </div>
      </Container>
    </main>
  );
}
