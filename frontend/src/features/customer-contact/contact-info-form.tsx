'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PhoneInput } from '@/components/ui/phone-input';
import { normalizeCameroonPhone, stripCountryCode } from '@/lib/phone';
import type { CreateContactInput } from './contact-types';

// ─── Schema ───────────────────────────────────────────────────────────────────

// Accepts: 6XXXXXXXX · 2376XXXXXXXX · +2376XXXXXXXX
const phoneRegex = /^(\+?237)?6\d{8}$/;
const phoneMsg = 'Number must start with 6 and have 9 digits (e.g. 698 546 321)';

const schema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Max 100 characters'),
  whatsappNumber: z
    .string()
    .min(1, 'WhatsApp number is required')
    .regex(phoneRegex, phoneMsg),
  paymentNumber: z
    .string()
    .regex(phoneRegex, phoneMsg)
    .optional()
    .or(z.literal('')),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  preferredLanguage: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  defaultValues?: Partial<FormValues>;
  initialSameAsWhatsapp?: boolean;
  onSubmit: (values: CreateContactInput) => Promise<void>;
  submitLabel?: string;
  serverError?: string | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactInfoForm({
  defaultValues,
  initialSameAsWhatsapp = true,
  onSubmit,
  submitLabel = 'Save contact info',
  serverError,
}: Props) {
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(initialSameAsWhatsapp);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { preferredLanguage: 'en', ...defaultValues },
  });

  const whatsappValue = watch('whatsappNumber');

  async function handleFormSubmit(values: FormValues) {
    await onSubmit({
      fullName: values.fullName,
      whatsappNumber: normalizeCameroonPhone(values.whatsappNumber),
      paymentNumber: sameAsWhatsapp
        ? undefined
        : values.paymentNumber?.trim()
          ? normalizeCameroonPhone(values.paymentNumber)
          : undefined,
      email: values.email?.trim() || undefined,
      preferredLanguage: values.preferredLanguage || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
      {serverError && (
        <div className="rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <Field label="Full name" error={errors.fullName?.message}>
        <Input
          {...register('fullName')}
          placeholder="Jean Paul Mbarga"
          autoComplete="name"
          disabled={isSubmitting}
        />
      </Field>

      <Field
        label="WhatsApp number"
        error={errors.whatsappNumber?.message}
        hint="Required — used to send real-time delivery updates"
      >
        <PhoneInput
          {...register('whatsappNumber')}
          placeholder="698 000 001"
          autoComplete="tel"
          disabled={isSubmitting}
        />
      </Field>

      {/* ── Payment number with "same as WhatsApp" toggle ── */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={sameAsWhatsapp}
            onChange={(e) => setSameAsWhatsapp(e.target.checked)}
            disabled={isSubmitting}
          />
          Payment number same as WhatsApp number
        </label>

        <Field
          label="Mobile money number"
          error={!sameAsWhatsapp ? errors.paymentNumber?.message : undefined}
          hint={sameAsWhatsapp ? undefined : 'MTN MoMo or Orange Money number used for payments'}
        >
          <PhoneInput
            {...register('paymentNumber')}
            placeholder={
              sameAsWhatsapp
                ? stripCountryCode(whatsappValue || '') || '698 000 001'
                : '670 000 001'
            }
            disabled={isSubmitting || sameAsWhatsapp}
          />
        </Field>
      </div>

      <Field
        label="Email address"
        error={errors.email?.message}
        hint="Optional — for email delivery notifications"
      >
        <Input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
