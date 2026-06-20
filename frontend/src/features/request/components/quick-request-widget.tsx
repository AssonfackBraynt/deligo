'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, MoveRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { deliveryTypes } from '../request-data';
import { useRequestStore } from '../request-store';
import type { DeliveryType } from '../request-types';

// ── Request form schema ───────────────────────────────────────────────────────

const requestSchema = z.object({
  deliveryType: z.string().min(1, 'Choose a delivery type.'),
});
type QuickRequestForm = z.infer<typeof requestSchema>;

// ── Tracking code ─────────────────────────────────────────────────────────────

const TRACKING_RE = /^(DLG-)?[A-Z0-9]{6}$/i;

function normalizeTrackingCode(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (clean.startsWith('DLG-')) return clean;
  return `DLG-${clean}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Tab = 'request' | 'track';

export function QuickRequestWidget() {
  const router = useRouter();
  const createDraft = useRequestStore((state) => state.createDraft);
  const [activeTab, setActiveTab] = useState<Tab>('request');
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingError, setTrackingError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickRequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { deliveryType: '' },
  });

  const onSubmit = (values: QuickRequestForm) => {
    const draftId = createDraft({ deliveryType: values.deliveryType as DeliveryType });
    router.push(routes.requestRoute(draftId));
  };

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const code = normalizeTrackingCode(trackingInput);
    if (!TRACKING_RE.test(trackingInput.trim())) {
      setTrackingError('Enter a valid tracking code, e.g. DLG-K7M3PX');
      return;
    }
    setTrackingError('');
    router.push(routes.tracking(code));
  }

  return (
    <Card id="quick-request" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <MapPin size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Quick request</h2>
            <p className="text-sm text-muted-foreground">Start now. No customer account needed.</p>
          </div>
        </div>
        <div className="mt-4 flex gap-1 rounded-lg border border-border p-1">
          <TabButton active={activeTab === 'request'} onClick={() => setActiveTab('request')}>
            New Request
          </TabButton>
          <TabButton active={activeTab === 'track'} onClick={() => setActiveTab('track')}>
            Track
          </TabButton>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'request' && (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Field label="Delivery Type" error={errors.deliveryType?.message}>
              <Select {...register('deliveryType')}>
                <option value="">Select type</option>
                {deliveryTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.title}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="text-xs text-muted-foreground">
              You&apos;ll choose pickup and destination on the next step.
            </p>
            <Button type="submit" size="lg" className="w-full">
              Continue
              <MoveRight size={19} aria-hidden="true" />
            </Button>
          </form>
        )}

        {activeTab === 'track' && (
          <form className="space-y-4" onSubmit={handleTrack}>
            <Field
              label="Tracking Code"
              hint="Enter the DLG-XXXXXX code from your confirmation"
              error={trackingError}
            >
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                  aria-hidden="true"
                />
                <Input
                  className="pl-10 font-mono uppercase tracking-widest"
                  placeholder="DLG-K7M3PX"
                  value={trackingInput}
                  onChange={(e) => {
                    setTrackingInput(e.target.value);
                    if (trackingError) setTrackingError('');
                  }}
                />
              </div>
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={!trackingInput.trim()}>
              Track Delivery
              <MoveRight size={19} aria-hidden="true" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
