'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/auth-store';
import { routes } from '@/lib/routes';

export function FindJobsButton() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isProvider = useAuthStore((s) => s.user?.roles.includes('provider') ?? false);

  function handleClick() {
    if (accessToken && isProvider) {
      router.push(routes.provider.marketplace);
    } else {
      router.push(routes.auth.login);
    }
  }

  return (
    <Button variant="outline" size="lg" onClick={handleClick}>
      Find Delivery Jobs
    </Button>
  );
}
