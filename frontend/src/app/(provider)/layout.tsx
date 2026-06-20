import { ProviderGuard } from '@/components/layout/provider-guard';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <ProviderGuard>{children}</ProviderGuard>;
}
