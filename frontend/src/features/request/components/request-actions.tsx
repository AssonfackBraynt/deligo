'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StickyActionBar } from '@/components/ui/sticky-action-bar';

type RequestActionsProps = {
  nextHref?: string;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
};

export function RequestActions({ nextHref = '', disabled, label = 'Continue', onClick }: RequestActionsProps) {
  const router = useRouter();

  return (
    <StickyActionBar>
      <Button
        type="button"
        size="lg"
        disabled={disabled}
        className="w-full lg:w-auto"
        onClick={() => (onClick ? onClick() : router.push(nextHref))}
      >
        {label}
        <ArrowRight size={19} aria-hidden="true" />
      </Button>
    </StickyActionBar>
  );
}
