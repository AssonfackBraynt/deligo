'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, Package, Phone, Truck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { ProviderNav } from '@/components/layout/provider-nav';
import { routes } from '@/lib/routes';
import { ApiError } from '@/lib/api-client';
import {
  getMyAgents,
  getMyProviderRequests,
  assignRider,
} from '@/features/provider-portal/provider-portal-api';
import type { AgentSummary, ProviderAssignedRequest } from '@/features/provider-portal/provider-portal-types';

const AVAIL_LABELS: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  unavailable: 'Unavailable',
  offline: 'Offline',
};

type AvailTone = 'success' | 'warning' | 'neutral';
const AVAIL_TONES: Record<string, AvailTone> = {
  available: 'success',
  busy: 'warning',
  unavailable: 'neutral',
  offline: 'neutral',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [requests, setRequests] = useState<ProviderAssignedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign modal
  const [assignAgent, setAssignAgent] = useState<AgentSummary | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMyAgents(), getMyProviderRequests()])
      .then(([a, r]) => {
        setAgents(a);
        // Only show requests that are accepted but not yet fully dispatched
        setRequests(r.filter((req) => req.requestStatus === 'provider_assigned'));
      })
      .catch(() => setError('Could not load agent data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleAssign() {
    if (!assignAgent || !selectedRequestId) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await assignRider(selectedRequestId, assignAgent.id);
      setAssignAgent(null);
      setSelectedRequestId('');
      // Refresh
      const [a, r] = await Promise.all([getMyAgents(), getMyProviderRequests()]);
      setAgents(a);
      setRequests(r.filter((req) => req.requestStatus === 'provider_assigned'));
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : 'Failed to assign rider.');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ProviderNav activePath={routes.provider.agents} />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your riders and assign accepted delivery requests to them.
          </p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
          </div>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-danger">
              <AlertCircle size={20} />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && agents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users size={40} className="mx-auto text-muted-foreground/50" />
              <p className="mt-3 font-semibold text-foreground">No agents yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your riders will appear here once your agency is set up and agents are registered.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && agents.length > 0 && (
          <>
            {/* Summary row */}
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile
                icon={<Users size={18} className="text-primary" />}
                label="Total Agents"
                value={agents.length}
              />
              <SummaryTile
                icon={<CheckCircle2 size={18} className="text-success" />}
                label="Available Now"
                value={agents.filter((a) => a.availabilityStatus === 'available').length}
              />
              <SummaryTile
                icon={<Truck size={18} className="text-warning" />}
                label="On Delivery"
                value={agents.filter((a) => a.activeDispatches > 0).length}
              />
            </div>

            {/* Agent list */}
            <div className="space-y-3">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  canAssign={requests.length > 0}
                  onAssign={() => {
                    setAssignAgent(agent);
                    setSelectedRequestId('');
                    setAssignError(null);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Assign modal */}
      <Dialog
        open={!!assignAgent}
        onClose={() => setAssignAgent(null)}
        title={`Assign Delivery to ${assignAgent?.fullName ?? ''}`}
      >
          {assignAgent && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No accepted requests available to assign. Accept a marketplace request first.
                </p>
              ) : (
                <>
                  {assignError && (
                    <p className="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2 text-sm text-danger">
                      {assignError}
                    </p>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Select a request to assign:</p>
                    {requests.map((req) => (
                      <label
                        key={req.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                          selectedRequestId === req.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="request"
                          value={req.id}
                          checked={selectedRequestId === req.id}
                          onChange={() => setSelectedRequestId(req.id)}
                          className="mt-0.5 accent-primary"
                        />
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold text-foreground">
                            {req.trackingCode}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {req.items.map((i) => i.itemName).join(', ')}
                          </p>
                          {req.route && (
                            <p className="text-xs text-muted-foreground">
                              {req.route.pickup} → {req.route.destination}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setAssignAgent(null)}
                      disabled={assigning}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleAssign}
                      disabled={!selectedRequestId || assigning}
                    >
                      <Truck size={15} />
                      {assigning ? 'Assigning…' : 'Assign'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentCard({
  agent,
  canAssign,
  onAssign,
}: {
  agent: AgentSummary;
  canAssign: boolean;
  onAssign: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
            {agent.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">{agent.fullName}</p>
              <Badge tone={AVAIL_TONES[agent.availabilityStatus] ?? 'neutral'}>
                {AVAIL_LABELS[agent.availabilityStatus] ?? agent.availabilityStatus}
              </Badge>
              {agent.verificationStatus === 'verified' && (
                <Badge tone="success">Verified</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone size={11} />
                {agent.phone}
              </span>
              {agent.vehicleType && (
                <span className="flex items-center gap-1">
                  <Truck size={11} />
                  {agent.vehicleType}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package size={11} />
                {agent.activeDispatches} active dispatch{agent.activeDispatches !== 1 ? 'es' : ''}
              </span>
              {agent.lastSeenAt && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Last seen {new Date(agent.lastSeenAt).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAssign}
          disabled={!canAssign || agent.availabilityStatus === 'offline'}
        >
          <Truck size={14} />
          Assign
        </Button>
      </CardContent>
    </Card>
  );
}
