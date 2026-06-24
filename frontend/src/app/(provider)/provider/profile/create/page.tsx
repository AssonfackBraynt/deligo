'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api-client';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { ProviderTypeSelector } from '@/features/provider-profile/provider-type-selector';
import { listTowns } from '@/features/request/location-api';
import type { Town } from '@/features/request/location-api';
import type { ProviderProfilePrivate } from '@/features/provider-profile/profile-types';

// ─── Validation schema ────────────────────────────────────────────────────────

const coordField = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) =>
        !v ||
        v.trim() === '' ||
        (!isNaN(parseFloat(v)) && parseFloat(v) >= min && parseFloat(v) <= max),
      { message: `${label} must be a number between ${min} and ${max}` },
    );

const schema = z
  .object({
    providerType: z.enum(['independent_rider', 'courier_company', 'logistics_company'], {
      required_error: 'Please select a provider type to continue',
    }),
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters')
      .max(180, 'Max 180 characters'),
    description: z.string().max(1000, 'Max 1000 characters').optional().or(z.literal('')),
    phoneNumber: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/, 'Use international format e.g. +237600000000')
      .optional()
      .or(z.literal('')),
    // independent_rider fields
    baseCity: z.string().max(120, 'Max 120 characters').optional().or(z.literal('')),
    serviceCoverage: z.string().max(1000, 'Max 1000 characters').optional().or(z.literal('')),
    // company fields
    businessAddress: z.string().optional().or(z.literal('')),
    businessLat: coordField(-90, 90, 'Latitude'),
    businessLng: coordField(-180, 180, 'Longitude'),
  })
  .superRefine((data, ctx) => {
    if (data.providerType === 'independent_rider') {
      if (!data.baseCity?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Base city is required for independent riders',
          path: ['baseCity'],
        });
      }
      if (!data.serviceCoverage?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Service coverage area is required for independent riders',
          path: ['serviceCoverage'],
        });
      }
    }
    if (
      data.providerType === 'courier_company' ||
      data.providerType === 'logistics_company'
    ) {
      if (!data.businessAddress?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business address is required for companies',
          path: ['businessAddress'],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateProviderProfilePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [towns, setTowns] = useState<Town[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const providerType = watch('providerType');
  const isRider = providerType === 'independent_rider';
  const isCompany =
    providerType === 'courier_company' || providerType === 'logistics_company';

  // On mount: check if profile exists; also load towns in parallel
  useEffect(() => {
    listTowns().then(setTowns).catch(() => null);

    apiClient
      .get<ProviderProfilePrivate>('/provider-profiles/me')
      .then(() => {
        router.replace(routes.provider.myProfile);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setChecking(false);
        } else {
          setChecking(false);
        }
      });
  }, [router]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const body: Record<string, unknown> = {
        providerType: values.providerType,
        displayName: values.displayName.trim(),
        description: values.description?.trim() || undefined,
        phoneNumber: values.phoneNumber?.trim() || undefined,
      };

      if (isRider) {
        body.baseCity = values.baseCity?.trim();
        body.serviceCoverage = values.serviceCoverage?.trim();
      } else {
        body.businessAddress = values.businessAddress?.trim();
        if (values.businessLat?.trim()) body.businessLat = parseFloat(values.businessLat);
        if (values.businessLng?.trim()) body.businessLng = parseFloat(values.businessLng);
      }

      await apiClient.post<ProviderProfilePrivate>('/provider-profiles', body);
      router.push(routes.provider.myProfile);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PublicHeader />
      <main className="py-10">
        <Container className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Set up your provider profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This is how clients will find and evaluate you on DeliGo.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            {/* ── Section 1: Provider type ── */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-foreground">What type of provider are you?</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  This cannot be changed after your profile is created.
                </p>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="providerType"
                  render={({ field, fieldState }) => (
                    <ProviderTypeSelector
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* ── Section 2: Profile details (visible only after type is selected) ── */}
            {providerType && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-foreground">Profile details</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field
                    label="Display name"
                    error={errors.displayName?.message}
                    hint="The name clients will see when browsing providers"
                  >
                    <Input
                      {...register('displayName')}
                      placeholder="e.g. Express Riders Douala"
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field
                    label="Description"
                    error={errors.description?.message}
                    hint="Optional — briefly describe your services (max 1000 characters)"
                  >
                    <Textarea
                      {...register('description')}
                      placeholder="Fast and reliable same-day delivery across Douala…"
                      disabled={isSubmitting}
                    />
                  </Field>

                  {/* independent_rider fields */}
                  {isRider && (
                    <>
                      <Field
                        label="Base city"
                        error={errors.baseCity?.message}
                        hint="The primary city you operate in"
                      >
                        <Select {...register('baseCity')} disabled={isSubmitting}>
                          <option value="">Select a city</option>
                          {towns.map((t) => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </Select>
                      </Field>

                      <Field
                        label="Service coverage"
                        error={errors.serviceCoverage?.message}
                        hint="Describe the specific areas and neighbourhoods you cover"
                      >
                        <Textarea
                          {...register('serviceCoverage')}
                          placeholder="e.g. Douala (Akwa, Bonanjo, Bali), Yaounde (Bastos, Melen)"
                          disabled={isSubmitting}
                        />
                      </Field>
                    </>
                  )}

                  {/* courier_company / logistics_company fields */}
                  {isCompany && (
                    <>
                      <Field
                        label="Business address"
                        error={errors.businessAddress?.message}
                        hint="Your registered or primary business location"
                      >
                        <Input
                          {...register('businessAddress')}
                          placeholder="e.g. 14 Rue du Commerce, Akwa, Douala"
                          disabled={isSubmitting}
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="Latitude"
                          error={errors.businessLat?.message}
                          hint="Optional (e.g. 4.0511)"
                        >
                          <Input
                            {...register('businessLat')}
                            type="text"
                            inputMode="decimal"
                            placeholder="4.0511"
                            disabled={isSubmitting}
                          />
                        </Field>
                        <Field
                          label="Longitude"
                          error={errors.businessLng?.message}
                          hint="Optional (e.g. 9.7679)"
                        >
                          <Input
                            {...register('businessLng')}
                            type="text"
                            inputMode="decimal"
                            placeholder="9.7679"
                            disabled={isSubmitting}
                          />
                        </Field>
                      </div>
                    </>
                  )}

                  <Field
                    label="Business phone number"
                    error={errors.phoneNumber?.message}
                    hint="Optional — shown publicly only after your profile is verified"
                  >
                    <Input
                      {...register('phoneNumber')}
                      type="tel"
                      placeholder="+237600000000"
                      disabled={isSubmitting}
                    />
                  </Field>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || !providerType}
            >
              {isSubmitting ? 'Creating profile…' : 'Create provider profile'}
            </Button>
          </form>
        </Container>
      </main>
    </>
  );
}
