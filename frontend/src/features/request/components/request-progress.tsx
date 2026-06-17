import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { requestSteps } from '../request-data';
import type { RequestStep } from '../request-types';

export function RequestProgress({ currentStep }: { currentStep: RequestStep }) {
  const currentIndex = requestSteps.findIndex((step) => step.key === currentStep);

  return (
    <nav aria-label="Request progress" className="overflow-x-auto pb-1">
      <ol className="flex min-w-max gap-2">
        {requestSteps.map((step, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-9 min-w-9 items-center justify-center rounded-full border text-sm font-semibold',
                  complete && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-surface text-primary',
                  !complete && !active && 'border-border bg-muted text-muted-foreground',
                )}
              >
                {complete ? <Check size={16} aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-semibold sm:inline',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
