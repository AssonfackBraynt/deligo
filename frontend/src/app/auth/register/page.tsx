'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, PackageCheck } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient, ApiError } from '@/lib/api-client';
import { routes } from '@/lib/routes';
import { normalizeCameroonPhone } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PhoneInput } from '@/components/ui/phone-input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AuthResult } from '@/features/auth/auth-types';

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^(\+?237)?[2-9]\d{8}$/, 'Enter a valid 9-digit number (e.g. 698 000 001)'),
    email: z
      .string()
      .email('Enter a valid email address')
      .optional()
      .or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const result = await apiClient.post<AuthResult>('/auth/register', {
        fullName: values.fullName,
        phone: normalizeCameroonPhone(values.phone),
        email: values.email || undefined,
        password: values.password,
        role: 'provider',
      });
      setAuth(result.user, result.tokens);
      router.push(routes.provider.createProfile);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href={routes.home}
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <Link
        href={routes.home}
        className="mb-8 flex items-center gap-2 font-semibold text-foreground"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PackageCheck size={20} aria-hidden="true" />
        </span>
        <span>DeliGo</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold text-foreground">Create your provider account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join DeliGo as a delivery provider and start receiving delivery jobs.
          </p>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Field label="Full name" error={errors.fullName?.message}>
              <Input
                {...register('fullName')}
                placeholder="e.g. Jean-Paul Kamga"
                autoComplete="name"
                disabled={isSubmitting}
              />
            </Field>

            <Field
              label="Phone number"
              error={errors.phone?.message}
              hint="This number will be used to log in"
            >
              <PhoneInput
                {...register('phone')}
                placeholder="698 000 001"
                autoComplete="tel"
                disabled={isSubmitting}
              />
            </Field>

            <Field
              label="Email address"
              error={errors.email?.message}
              hint="Optional — used for login and notifications"
            >
              <Input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="pr-11"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password" error={errors.confirmPassword?.message}>
              <Input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </Field>

            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href={routes.auth.login} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
