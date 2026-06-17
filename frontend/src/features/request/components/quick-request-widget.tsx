'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/field';
import { routes } from '@/lib/routes';
import { deliveryTypes } from '../request-data';
import { useRequestStore } from '../request-store';
import type { DeliveryType } from '../request-types';

const schema = z.object({
  pickupLocation: z.string().min(2, 'Pickup location is required.'),
  destination: z.string().min(2, 'Destination is required.'),
  deliveryType: z.string().min(1, 'Choose a delivery type.'),
});

type QuickRequestForm = z.infer<typeof schema>;

export function QuickRequestWidget() {
  const router = useRouter();
  const createDraft = useRequestStore((state) => state.createDraft);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickRequestForm>({
    resolver: zodResolver(schema),
    defaultValues: { pickupLocation: '', destination: '', deliveryType: '' },
  });

  const onSubmit = (values: QuickRequestForm) => {
    const draftId = createDraft({
      pickupAddress: values.pickupLocation,
      destinationAddress: values.destination,
      deliveryType: values.deliveryType as DeliveryType,
    });
    router.push(routes.requestRoute(draftId));
  };

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
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Pickup Location" error={errors.pickupLocation?.message}>
            <Input placeholder="Bonaberi, Douala" {...register('pickupLocation')} />
          </Field>
          <Field label="Destination" error={errors.destination?.message}>
            <Input placeholder="Akwa, Douala" {...register('destination')} />
          </Field>
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
          <Button type="submit" size="lg" className="w-full">
            Continue
            <MoveRight size={19} aria-hidden="true" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
