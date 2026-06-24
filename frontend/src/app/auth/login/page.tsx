'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AuthResult } from '@/features/auth/auth-types';

const schema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

function buildLoginBody(identifier: string, password: string) {
  const trimmed = identifier.trim();
  // Digits-only or starts with + or 237 → treat as phone
  const isPhone = /^(\+?237)?[2-9]\d{8}$/.test(trimmed) || /^\d{9,}$/.test(trimmed);
  return isPhone
    ? { phone: normalizeCameroonPhone(trimmed), password }
    : { email: trimmed, password };
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';


function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitNext = searchParams.get('next');

  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSuspensionReason(null);
    try {
      const body = buildLoginBody(values.identifier, values.password);
      const result = await apiClient.post<AuthResult>('/auth/login', body);
      setAuth(result.user, result.tokens);

      let destination = explicitNext ?? routes.home;
      if (!explicitNext) {
        if (result.user.roles.includes('admin')) {
          destination = routes.admin.dashboard;
        } else if (result.user.roles.includes('provider')) {
          destination = routes.provider.dashboard;
        }
      }

      router.push(destination);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message === 'Your account has been suspended.') {
          const errData = err.data as { error?: { suspensionReason?: string } } | undefined;
          setSuspensionReason(errData?.error?.suspensionReason ?? null);
          setServerError('suspended');
        } else {
          setServerError(err.message);
        }
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
          <h1 className="text-xl font-semibold text-foreground">Sign in to your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your phone number or email address to continue.
          </p>
        </CardHeader>

        <CardContent>
          {serverError === 'suspended' ? (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger space-y-1">
              <p className="font-semibold">Your account has been suspended.</p>
              {suspensionReason && (
                <p className="text-danger/80">Reason: {suspensionReason}</p>
              )}
              <p className="text-danger/80">
                To appeal, contact support on WhatsApp:{' '}
                <a
                  href="https://wa.me/237690000019"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  +237 690 000 019
                </a>
              </p>
            </div>
          ) : serverError ? (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
              {serverError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Field
              label="Email or phone number"
              error={errors.identifier?.message}
              hint="Phone: enter your number without +237, e.g. 698 000 001"
            >
              <Input
                {...register('identifier')}
                type="text"
                placeholder="698 000 001 or you@example.com"
                autoComplete="username"
                autoCapitalize="none"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  autoComplete="current-password"
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

            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={routes.auth.register}
              className="font-semibold text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
