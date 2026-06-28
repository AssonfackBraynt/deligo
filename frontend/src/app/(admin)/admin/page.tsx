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
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { AdminNav } from '@/components/layout/admin-nav';
import { getAdminStats, getAdminChartData, type AdminStats, type AdminChartData } from '@/features/admin/admin-api';
import { useAuthStore } from '@/features/auth/auth-store';
import { useAdminSocket } from '@/hooks/use-admin-socket';
import { routes } from '@/lib/routes';

// ── Colour palette consistent with the app's green primary ──────────────────

const PALETTE = {
  primary:  '#15705f',
  success:  '#22c55e',
  warning:  '#f59e0b',
  danger:   '#ef4444',
  info:     '#3b82f6',
  muted:    '#6b7280',
};

const PIE_COLOURS = [
  PALETTE.primary,
  PALETTE.success,
  PALETTE.info,
  PALETTE.warning,
  PALETTE.danger,
  '#8b5cf6',
];

const STATUS_COLOURS: Record<string, string> = {
  Created:     PALETTE.info,
  Offers:      PALETTE.warning,
  Assigned:    PALETTE.primary,
  'In Transit': '#0ea5e9',
  Delivered:   PALETTE.success,
  Completed:   '#16a34a',
  Cancelled:   PALETTE.danger,
  Disputed:    '#dc2626',
};

// ── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [charts, setCharts] = useState<AdminChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const accessToken = useAuthStore((s) => s.accessToken);

  async function fetchAll() {
    const [s, c] = await Promise.all([getAdminStats(), getAdminChartData()]);
    setStats(s);
    setCharts(c);
  }

  function fetchStats() {
    getAdminStats().then(setStats).catch(() => null);
  }

  useEffect(() => {
    fetchAll().catch(() => null).finally(() => setLoading(false));
  }, []);

  useAdminSocket(accessToken, fetchStats);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav active="dashboard" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">DeliGo Admin Overview</p>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Total Providers"        value={stats.totalProviders}          icon={<Truck size={22} />}        href={routes.admin.providers} />
            <StatCard label="Verified Providers"     value={stats.verifiedProviders}       icon={<ShieldCheck size={22} />}  tone="success" href={routes.admin.providers} />
            <StatCard label="Pending Verifications"  value={stats.pendingVerifications}    icon={<Clock size={22} />}        tone="warning" href={routes.admin.verifications} />
            <StatCard label="Active Deliveries"      value={stats.activeRequests}          icon={<Activity size={22} />}     href={routes.admin.requests} />
            <StatCard label="Open Marketplace"       value={stats.openMarketplaceRequests} icon={<ShoppingBag size={22} />}  href={routes.admin.requests} />
            <StatCard label="Completed Deliveries"   value={stats.completedDeliveries}     icon={<CheckCircle2 size={22} />} tone="success" href={routes.admin.requests} />
            <StatCard label="Total Users"            value={stats.totalUsers}              icon={<Users size={22} />}        href={routes.admin.users} />
            <StatCard label="Total Reviews"          value={stats.totalRatings}            icon={<Star size={22} />} />
            <StatCard label="Notifications Sent"     value={stats.totalNotifications}      icon={<Package size={22} />} />
          </div>
        ) : (
          <p className="text-sm text-danger">Failed to load stats.</p>
        )}

        {/* ── Charts ─────────────────────────────────────────────────────── */}
        {!loading && charts && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Activity Overview</h2>

            {/* Row 1 — 7-day area trend */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Deliveries trend */}
              <ChartCard title="New Delivery Requests — Last 7 Days">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={charts.trend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradDeliveries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PALETTE.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: PALETTE.muted }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: PALETTE.muted }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                    <Area
                      type="monotone"
                      dataKey="deliveries"
                      name="Requests"
                      stroke={PALETTE.primary}
                      strokeWidth={2}
                      fill="url(#gradDeliveries)"
                      dot={{ r: 4, fill: PALETTE.primary }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Users trend */}
              <ChartCard title="New User Registrations — Last 7 Days">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={charts.trend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PALETTE.info} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={PALETTE.info} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: PALETTE.muted }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: PALETTE.muted }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Users"
                      stroke={PALETTE.info}
                      strokeWidth={2}
                      fill="url(#gradUsers)"
                      dot={{ r: 4, fill: PALETTE.info }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 2 — bar chart + pie chart */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Delivery status bar chart */}
              <ChartCard title="Delivery Requests by Status">
                {charts.statusBreakdown.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={charts.statusBreakdown} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: PALETTE.muted }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: PALETTE.muted }} />
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                      <Bar dataKey="value" name="Requests" radius={[4, 4, 0, 0]}>
                        {charts.statusBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLOURS[entry.name] ?? PALETTE.primary} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Provider type pie chart */}
              <ChartCard title="Providers by Type">
                {charts.providerBreakdown.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={charts.providerBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {charts.providerBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      No data yet
    </div>
  );
}
