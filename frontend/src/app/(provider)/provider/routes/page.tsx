'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Clock, MapPin, Navigation, Package, Plus, Route, Trash2, X } from 'lucide-react';
import { ProviderNav } from '@/components/layout/provider-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import {
  createRiderRoute,
  deleteRiderRoute,
  getMyRiderRoutes,
  getRouteMatchingJobs,
} from '@/features/provider-portal/provider-portal-api';
import type { RiderRoute, RouteMatchingJobs } from '@/features/provider-profile/profile-types';
import { apiClient } from '@/lib/api-client';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

type Quarter = { id: string; name: string; townName: string };

export default function RiderRoutesPage() {
  const [routesList, setRoutesList] = useState<RiderRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [originQuarterId, setOriginQuarterId] = useState('');
  const [destinationQuarterId, setDestinationQuarterId] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Quarter picker
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [quartersLoading, setQuartersLoading] = useState(false);
  const [townOptions, setTownOptions] = useState<{ id: string; name: string; regionName: string }[]>([]);
  const [originTownId, setOriginTownId] = useState('');
  const [destinationTownId, setDestinationTownId] = useState('');
  const [originQuarters, setOriginQuarters] = useState<Quarter[]>([]);
  const [destinationQuarters, setDestinationQuarters] = useState<Quarter[]>([]);

  // Matching jobs
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [matchingJobs, setMatchingJobs] = useState<RouteMatchingJobs | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRoutesList(await getMyRiderRoutes());
    } catch {
      setError('Failed to load your routes.');
    } finally {
      setLoading(false);
    }
  }

  // Prefetch regions → towns once when form opens
  useEffect(() => {
    if (!showForm || townOptions.length > 0) return;
    void (async () => {
      try {
        const regions = await apiClient.get<{ id: string; name: string }[]>('/locations/regions');
        const allTowns: { id: string; name: string; regionName: string }[] = [];
        await Promise.all(
          regions.map(async (r) => {
            const towns = await apiClient.get<{ id: string; name: string }[]>(`/locations/towns?regionId=${r.id}`);
            towns.forEach((t) => allTowns.push({ id: t.id, name: t.name, regionName: r.name }));
          }),
        );
        allTowns.sort((a, b) => a.name.localeCompare(b.name));
        setTownOptions(allTowns);
      } catch {
        // ignore
      }
    })();
  }, [showForm, townOptions.length]);

  async function loadQuarters(townId: string, target: 'origin' | 'destination') {
    if (!townId) return;
    setQuartersLoading(true);
    try {
      const qs = await apiClient.get<{ id: string; name: string }[]>(`/locations/quarters?townId=${townId}`);
      const mapped = qs.map((q) => ({ id: q.id, name: q.name, townName: townOptions.find((t) => t.id === townId)?.name ?? '' }));
      if (target === 'origin') setOriginQuarters(mapped);
      else setDestinationQuarters(mapped);
    } finally {
      setQuartersLoading(false);
    }
  }

  async function handleSaveRoute() {
    if (!originQuarterId || !destinationQuarterId) {
      setFormError('Please select both origin and destination quarters.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createRiderRoute({
        originQuarterId,
        destinationQuarterId,
        departureTime: departureTime || undefined,
        isRecurring,
        recurringDays: isRecurring ? selectedDays : [],
      });
      setRoutesList((prev) => [created, ...prev]);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message ?? 'Failed to save route.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setOriginQuarterId('');
    setDestinationQuarterId('');
    setDepartureTime('');
    setIsRecurring(false);
    setSelectedDays([]);
    setOriginTownId('');
    setDestinationTownId('');
    setOriginQuarters([]);
    setDestinationQuarters([]);
    setFormError(null);
  }

  async function handleDelete(routeId: string) {
    await deleteRiderRoute(routeId);
    setRoutesList((prev) => prev.filter((r) => r.id !== routeId));
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
      setMatchingJobs(null);
    }
  }

  async function handleExpandRoute(routeId: string) {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
      setMatchingJobs(null);
      return;
    }
    setExpandedRouteId(routeId);
    setMatchingJobs(null);
    setJobsLoading(true);
    try {
      setMatchingJobs(await getRouteMatchingJobs(routeId));
    } finally {
      setJobsLoading(false);
    }
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  return (
    <div className="min-h-screen bg-background">
      <ProviderNav activePath={routes.provider.myRoutes} />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">My Routes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Post your planned trips so you&apos;re matched with jobs along your way.
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus size={16} />
              Add Route
            </Button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <Card className="border-primary/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">New Planned Route</h2>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}

              {/* Origin */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Starting town</label>
                <select
                  value={originTownId}
                  onChange={(e) => { setOriginTownId(e.target.value); setOriginQuarterId(''); void loadQuarters(e.target.value, 'origin'); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select town…</option>
                  {townOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.regionName})</option>
                  ))}
                </select>

                {originTownId && (
                  <>
                    <label className="text-sm font-medium text-foreground">Starting quarter <span className="text-muted-foreground">(your exact area)</span></label>
                    <select
                      value={originQuarterId}
                      onChange={(e) => setOriginQuarterId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={quartersLoading}
                    >
                      <option value="">Select quarter…</option>
                      {originQuarters.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                    </select>
                  </>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Destination town</label>
                <select
                  value={destinationTownId}
                  onChange={(e) => { setDestinationTownId(e.target.value); setDestinationQuarterId(''); void loadQuarters(e.target.value, 'destination'); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select town…</option>
                  {townOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.regionName})</option>
                  ))}
                </select>

                {destinationTownId && (
                  <>
                    <label className="text-sm font-medium text-foreground">Destination quarter</label>
                    <select
                      value={destinationQuarterId}
                      onChange={(e) => setDestinationQuarterId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={quartersLoading}
                    >
                      <option value="">Select quarter…</option>
                      {destinationQuarters.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                    </select>
                  </>
                )}
              </div>

              {/* Time */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Planned departure time <span className="text-muted-foreground">(optional)</span></label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Recurring */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded"
                  />
                  This route repeats on specific days
                </label>
                {isRecurring && (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          selectedDays.includes(d)
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border text-muted-foreground hover:border-primary'
                        }`}
                      >
                        {DAY_LABELS[d]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSaveRoute} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Route'}
                </Button>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Routes list */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/8 px-4 py-6 text-sm text-danger">
            <AlertCircle size={18} /> {error}
          </div>
        ) : routesList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-12 text-center">
            <Route size={32} className="text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">No routes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a planned route and we&apos;ll show you delivery jobs that match your path.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}><Plus size={15} />Add your first route</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {routesList.map((route) => (
              <div key={route.id}>
                <Card className={expandedRouteId === route.id ? 'border-primary/50' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Navigation size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{route.originLabel}</span>
                          <ArrowRight size={14} className="text-muted-foreground" />
                          <span className="font-medium text-foreground">{route.destinationLabel}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {route.departureTime && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={13} />
                              {route.departureTime}
                            </span>
                          )}
                          {route.isRecurring && route.recurringDays.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              {route.recurringDays.map((d) => DAY_LABELS[d] ?? d).join(', ')}
                            </span>
                          )}
                          {!route.isActive && <Badge tone="warning">Inactive</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExpandRoute(route.id)}
                        >
                          <Package size={14} />
                          {expandedRouteId === route.id ? 'Hide jobs' : 'View jobs'}
                        </Button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          title="Remove route"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Matching jobs panel */}
                {expandedRouteId === route.id && (
                  <div className="ml-4 mt-2 space-y-2 border-l-2 border-primary/30 pl-4">
                    {jobsLoading ? (
                      <div className="space-y-2">
                        {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)}
                      </div>
                    ) : !matchingJobs || matchingJobs.matchingJobs.length === 0 ? (
                      <div className="rounded-lg border border-border bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground">
                        No open jobs match this route right now. Check back later — we scan in real time.
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {matchingJobs.matchingJobs.length} matching job{matchingJobs.matchingJobs.length !== 1 && 's'} along {matchingJobs.originTown} → {matchingJobs.destinationTown}
                        </p>
                        {matchingJobs.matchingJobs.map((job) => (
                          <Card key={job.id} className="shadow-none">
                            <CardContent className="py-3">
                              <div className="flex items-start gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                  <Package size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-foreground">{job.trackingCode}</span>
                                    <Badge tone="neutral" className="capitalize">{job.deliveryType.replace(/_/g, ' ')}</Badge>
                                    {job.items.hasFragile && <Badge tone="warning">Fragile</Badge>}
                                  </div>
                                  {job.route && (
                                    <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                                      <MapPin size={12} className="mt-0.5 shrink-0" />
                                      <span>
                                        {job.route.pickup}{job.route.pickupLandmark && ` — ${job.route.pickupLandmark}`}
                                        {' → '}
                                        {job.route.destination}{job.route.destinationLandmark && ` — ${job.route.destinationLandmark}`}
                                      </span>
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {job.items.count} item{job.items.count !== 1 && 's'}
                                    {job.items.summary && ` · ${job.items.summary}`}
                                    {job.desiredRewardAmount != null && (
                                      <span className="ml-2 font-semibold text-primary">
                                        {job.desiredRewardAmount.toLocaleString()} XAF
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
