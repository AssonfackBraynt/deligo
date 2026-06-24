'use client';

import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  FileText,
  Printer,
  Star,
  Truck,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminNav } from '@/components/layout/admin-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminReport, type AdminReport, type ReportPreset } from '@/features/admin/admin-api';

// ── Preset configuration ───────────────────────────────────────────────────────

type PresetOption = { label: string; value: ReportPreset };

const PRESETS: PresetOption[] = [
  { label: 'Today', value: 'day' },
  { label: '7 Days', value: '7d' },
  { label: '15 Days', value: '15d' },
  { label: '30 Days', value: '30d' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
  { label: 'Custom Range', value: 'custom' },
];

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<ReportPreset>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AdminReport | null>(null);

  function validateCustomRange(from: string, to: string): string {
    if (!from || !to) return 'Both dates are required.';
    const start = new Date(from);
    const end = new Date(to);
    if (end < start) return 'End date must be after start date.';
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 30) return 'Custom range must be less than 30 days.';
    return '';
  }

  async function generate() {
    setError(null);
    setReport(null);

    if (preset === 'custom') {
      const err = validateCustomRange(customFrom, customTo);
      if (err) { setRangeError(err); return; }
      setRangeError('');
    }

    setLoading(true);
    try {
      const data = await getAdminReport(
        preset,
        preset === 'custom' ? { from: customFrom, to: customTo } : undefined,
      );
      setReport(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav active="reports" />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Administrative Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a summary of platform activity for a chosen time frame.
          </p>
        </div>

        {/* Time frame selector */}
        <Card>
          <CardContent className="space-y-5">
            <p className="text-sm font-medium text-foreground">Select time frame</p>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setPreset(p.value); setRangeError(''); setReport(null); }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    preset === p.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-foreground hover:border-primary/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom range inputs */}
            {preset === 'custom' && (
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">From</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => { setCustomFrom(e.target.value); setRangeError(''); }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">To</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => { setCustomTo(e.target.value); setRangeError(''); }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                {rangeError && (
                  <p className="text-xs text-danger">{rangeError}</p>
                )}
                <p className="text-xs text-muted-foreground">Maximum range: less than 30 days.</p>
              </div>
            )}

            <Button onClick={() => void generate()} disabled={loading}>
              {loading ? 'Generating…' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Report output */}
        {report && (
          <div className="space-y-6" id="report-output">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Report: {formatDate(report.period.from)} — {formatDate(report.period.to)}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {report.period.days} {report.period.days === 1 ? 'day' : 'days'} covered
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={15} className="mr-1.5" />
                Print / Export
              </Button>
            </div>

            {/* Deliveries */}
            <Section title="Deliveries">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ReportCard label="New Requests" value={report.deliveries.new} icon={<FileText size={18} />} />
                <ReportCard label="Completed" value={report.deliveries.completed} icon={<CheckCircle2 size={18} />} tone="success" />
                <ReportCard label="Active" value={report.deliveries.active} icon={<Activity size={18} />} tone="warning" />
                <ReportCard label="Cancelled" value={report.deliveries.cancelled} icon={<XCircle size={18} />} tone="danger" />
                <ReportCard label="Disputed" value={report.deliveries.disputed} icon={<XCircle size={18} />} tone="danger" />
              </div>
            </Section>

            {/* Users */}
            <Section title="Users">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ReportCard label="New Registrations" value={report.users.newRegistrations} icon={<Users size={18} />} />
              </div>
            </Section>

            {/* Providers */}
            <Section title="Providers">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ReportCard label="New Providers" value={report.providers.newRegistrations} icon={<Truck size={18} />} />
                <ReportCard label="Verified in Period" value={report.providers.verifiedInPeriod} icon={<CheckCircle2 size={18} />} tone="success" />
              </div>
            </Section>

            {/* Verifications */}
            <Section title="Verification Documents">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ReportCard label="Submitted" value={report.verifications.submitted} icon={<FileText size={18} />} />
                <ReportCard label="Approved" value={report.verifications.approved} icon={<CheckCircle2 size={18} />} tone="success" />
                <ReportCard label="Rejected" value={report.verifications.rejected} icon={<XCircle size={18} />} tone="danger" />
              </div>
            </Section>

            {/* Reviews */}
            <Section title="Reviews & Ratings">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ReportCard label="Reviews Submitted" value={report.reviews.count} icon={<Star size={18} />} />
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Star size={18} />
                  </div>
                  <p className="mt-3 text-xl font-semibold text-foreground">
                    {report.reviews.averageRating !== null ? report.reviews.averageRating.toFixed(1) : '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </Section>
          </div>
        )}
      </main>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(main) { display: none !important; }
          nav { display: none !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function ReportCard({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClasses: Record<string, string> = {
    neutral: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className={`flex size-8 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
        {icon}
      </div>
      <p className="mt-3 text-xl font-semibold text-foreground">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
