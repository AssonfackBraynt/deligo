'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AdminNav } from '@/components/layout/admin-nav';
import { getAdminStats, type AdminStats } from '@/features/admin/admin-api';
import { routes } from '@/lib/routes';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav active="dashboard" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">DeliGo Admin Overview</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Providers" value={stats.totalProviders} icon={<Truck size={22} />} href={routes.admin.providers} />
            <StatCard label="Verified Providers" value={stats.verifiedProviders} icon={<ShieldCheck size={22} />} tone="success" href={routes.admin.providers} />
            <StatCard label="Pending Verifications" value={stats.pendingVerifications} icon={<Clock size={22} />} tone="warning" href={routes.admin.verifications} />
            <StatCard label="Active Deliveries" value={stats.activeRequests} icon={<Activity size={22} />} href={routes.admin.requests} />
            <StatCard label="Open Marketplace" value={stats.openMarketplaceRequests} icon={<ShoppingBag size={22} />} href={routes.admin.requests} />
            <StatCard label="Completed Deliveries" value={stats.completedDeliveries} icon={<CheckCircle2 size={22} />} tone="success" href={routes.admin.requests} />
            <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={22} />} href={routes.admin.users} />
            <StatCard label="Total Reviews" value={stats.totalRatings} icon={<Star size={22} />} />
            <StatCard label="Notifications Sent" value={stats.totalNotifications} icon={<Package size={22} />} />
          </div>
        ) : (
          <p className="text-sm text-danger">Failed to load stats.</p>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = 'neutral',
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning';
  href?: string;
}) {
  const toneClasses = {
    neutral: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  };

  const inner = (
    <Card className={href ? 'transition hover:border-primary/40 hover:shadow-sm' : ''}>
      <CardContent className="flex items-center gap-4">
        <div className={`flex size-12 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold text-foreground">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
