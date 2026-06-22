'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bike,
  Building2,
  Edit,
  FileCheck,
  GitBranch,
  MapPin,
  Navigation,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { routes } from '@/lib/routes';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VerificationModal } from '@/components/ui/verification-modal';
import type {
  AvailabilityStatus,
  ProviderBranch,
  ProviderProfilePrivate,
  ProviderType,
  VerificationStatus,
} from '@/features/provider-profile/profile-types';
import {
  createBranch,
  deleteBranch,
  getMyBranches,
  getMyVerificationRecords,
  type VerificationRecord,
} from '@/features/provider-portal/provider-portal-api';

const TYPE_ICONS: Record<ProviderType, React.ReactNode> = {
  independent_rider: <Bike size={28} />,
  courier_company: <Building2 size={28} />,
  logistics_company: <Truck size={28} />,
};

const TYPE_LABELS: Record<ProviderType, string> = {
  independent_rider: 'Independent Rider',
  courier_company: 'Courier Company',
  logistics_company: 'Logistics Company',
};

const AVAILABILITY_DOT: Record<AvailabilityStatus, string> = {
  available: 'bg-success',
  busy: 'bg-warning',
  unavailable: 'bg-muted-foreground',
  offline: 'bg-muted-foreground',
};

const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  unavailable: 'Unavailable',
  offline: 'Offline',
};

const VERIFICATION_CONFIG: Record<VerificationStatus, { label: string; tone: 'success' | 'warning' | 'neutral' | 'primary' }> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'Pending review', tone: 'warning' },
  unverified: { label: 'Unverified', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'warning' },
  suspended: { label: 'Suspended', tone: 'warning' },
};

const DOC_STATUS_TONES: Record<string, 'success' | 'warning' | 'neutral'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'warning',
};

const DOC_LABELS: Record<string, string> = {
  national_id: 'National ID',
  profile: 'Profile Photo',
  rider_identity: 'Vehicle Photo',
  business_registration: 'Business Registration',
  tax_document: 'NIU Certificate',
  insurance_document: 'Insurance',
  agency_document: 'Agency Document',
};

type TownOption = { id: string; name: string; regionName: string };
type QuarterOption = { id: string; name: string };

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProviderProfilePrivate | null>(null);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [branches, setBranches] = useState<ProviderBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Branch form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchIsHQ, setBranchIsHQ] = useState(false);
  const [townOptions, setTownOptions] = useState<TownOption[]>([]);
  const [selectedTownId, setSelectedTownId] = useState('');
  const [quarterOptions, setQuarterOptions] = useState<QuarterOption[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState('');
  const [loadingQuarters, setLoadingQuarters] = useState(false);

  async function loadAll() {
    try {
      const [p, r] = await Promise.all([
        apiClient.get<ProviderProfilePrivate>('/provider-profiles/me'),
        getMyVerificationRecords(),
      ]);
      setProfile(p);
      setRecords(r);
      const isCompany = p.providerType === 'courier_company' || p.providerType === 'logistics_company';
      if (isCompany) {
        setBranches(await getMyBranches());
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);

  // Load towns once when branch form opens
  useEffect(() => {
    if (!showBranchForm || townOptions.length > 0) return;
    void (async () => {
      try {
        const regions = await apiClient.get<{ id: string; name: string }[]>('/locations/regions');
        const all: TownOption[] = [];
        await Promise.all(regions.map(async (reg) => {
          const towns = await apiClient.get<{ id: string; name: string }[]>(`/locations/towns?regionId=${reg.id}`);
          towns.forEach((t) => all.push({ id: t.id, name: t.name, regionName: reg.name }));
        }));
        all.sort((a, b) => a.name.localeCompare(b.name));
        setTownOptions(all);
      } catch { /* ignore */ }
    })();
  }, [showBranchForm, townOptions.length]);

  async function handleTownChange(townId: string) {
    setSelectedTownId(townId);
    setSelectedQuarterId('');
    setQuarterOptions([]);
    if (!townId) return;
    setLoadingQuarters(true);
    try {
      const qs = await apiClient.get<{ id: string; name: string }[]>(`/locations/quarters?townId=${townId}`);
      setQuarterOptions(qs);
    } finally {
      setLoadingQuarters(false);
    }
  }

  async function handleSaveBranch() {
    if (!branchName.trim() || !selectedQuarterId) {
      setBranchError('Branch name and quarter are required.');
      return;
    }
    setSavingBranch(true);
    setBranchError(null);
    try {
      const created = await createBranch({
        name: branchName.trim(),
        quarterId: selectedQuarterId,
        phoneNumber: branchPhone.trim() || undefined,
        isHeadquarters: branchIsHQ,
      });
      setBranches((prev) => branchIsHQ
        ? [created, ...prev.map((b) => ({ ...b, isHeadquarters: false }))]
        : [...prev, created],
      );
      resetBranchForm();
    } catch (err: any) {
      setBranchError(err?.message ?? 'Failed to save branch.');
    } finally {
      setSavingBranch(false);
    }
  }

  function resetBranchForm() {
    setShowBranchForm(false);
    setBranchName('');
    setBranchPhone('');
    setBranchIsHQ(false);
    setSelectedTownId('');
    setSelectedQuarterId('');
    setQuarterOptions([]);
    setBranchError(null);
  }

  async function handleDeleteBranch(branchId: string) {
    await deleteBranch(branchId);
    setBranches((prev) => prev.filter((b) => b.id !== branchId));
  }

  function handleSubmitted() { void loadAll(); }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <PublicHeader />
        <main className="py-10">
          <Container className="max-w-2xl">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-danger/30 bg-danger/8 px-6 py-10 text-center">
              <AlertCircle size={32} className="text-danger" />
              <div>
                <p className="font-semibold text-foreground">Could not load your profile</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </Container>
        </main>
      </>
    );
  }

  if (!profile) return null;

  const isRider = profile.providerType === 'independent_rider';
  const isCompany = profile.providerType === 'courier_company' || profile.providerType === 'logistics_company';
  const verif = VERIFICATION_CONFIG[profile.verificationStatus];
  const canSubmitDocs = profile.verificationStatus === 'unverified' || profile.verificationStatus === 'rejected';

  return (
    <>
      <PublicHeader />
      <main className="py-6 sm:py-10">
        <Container className="max-w-2xl space-y-5">
          {/* Header card */}
          <Card>
            <CardContent>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  {TYPE_ICONS[profile.providerType]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground">{profile.displayName}</h1>
                    <Badge tone={verif.tone}>
                      {profile.verificationStatus === 'verified' && <ShieldCheck size={13} />}
                      {verif.label}
                    </Badge>
                    {profile.isFeatured && <Badge tone="primary">Featured</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{TYPE_LABELS[profile.providerType]}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star size={15} className="fill-warning text-warning" />
                      {profile.ratingAverage.toFixed(1)}
                      {profile.ratingCount > 0 && ` (${profile.ratingCount} reviews)`}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${AVAILABILITY_DOT[profile.availabilityStatus]}`} />
                      {AVAILABILITY_LABEL[profile.availabilityStatus]}
                    </span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={routes.provider.editProfile}>
                    <Edit size={15} />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          {profile.description && (
            <Card>
              <CardHeader><h2 className="font-semibold text-foreground">About</h2></CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-muted-foreground">{profile.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Location / coverage */}
          <Card>
            <CardHeader><h2 className="font-semibold text-foreground">Location</h2></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {profile.baseCountry && (
                <p className="inline-flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0" />
                  {profile.baseCountry}
                </p>
              )}
              {isRider && profile.baseCity && (
                <p><span className="font-medium text-foreground">Base city:</span> {profile.baseCity}</p>
              )}
              {isRider && profile.serviceCoverage && (
                <p><span className="font-medium text-foreground">Service coverage:</span> {profile.serviceCoverage}</p>
              )}
              {isCompany && profile.businessAddress && (
                <p><span className="font-medium text-foreground">Business address:</span> {profile.businessAddress}</p>
              )}
            </CardContent>
          </Card>

          {/* ── COMPANY: Branch locations ──────────────────────────────────── */}
          {isCompany && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GitBranch size={17} className="text-primary" />
                    <h2 className="font-semibold text-foreground">Branch Locations</h2>
                    {branches.length > 0 && (
                      <Badge tone="neutral">{branches.length}</Badge>
                    )}
                  </div>
                  {!showBranchForm && (
                    <Button size="sm" variant="outline" onClick={() => setShowBranchForm(true)}>
                      <Plus size={14} />
                      Add branch
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add branch form */}
                {showBranchForm && (
                  <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/4 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">New branch</p>
                      <button onClick={resetBranchForm} className="text-muted-foreground hover:text-foreground">
                        <X size={16} />
                      </button>
                    </div>

                    {branchError && (
                      <div className="flex items-center gap-2 rounded-lg bg-danger/8 px-3 py-2 text-xs text-danger">
                        <AlertCircle size={13} /> {branchError}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">Branch name *</label>
                        <input
                          type="text"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="e.g. Bonanjo Agency"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Town *</label>
                        <select
                          value={selectedTownId}
                          onChange={(e) => handleTownChange(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select town…</option>
                          {townOptions.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.regionName})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Quarter *</label>
                        <select
                          value={selectedQuarterId}
                          onChange={(e) => setSelectedQuarterId(e.target.value)}
                          disabled={!selectedTownId || loadingQuarters}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="">{loadingQuarters ? 'Loading…' : 'Select quarter…'}</option>
                          {quarterOptions.map((q) => (
                            <option key={q.id} value={q.id}>{q.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Branch phone (optional)</label>
                        <input
                          type="tel"
                          value={branchPhone}
                          onChange={(e) => setBranchPhone(e.target.value)}
                          placeholder="+237 6XX XXX XXX"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="isHQ"
                          checked={branchIsHQ}
                          onChange={(e) => setBranchIsHQ(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="isHQ" className="text-sm text-foreground">This is the headquarters</label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveBranch} disabled={savingBranch}>
                        {savingBranch ? 'Saving…' : 'Save branch'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetBranchForm}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Branch list */}
                {branches.length === 0 && !showBranchForm ? (
                  <p className="text-sm text-muted-foreground">
                    No branches added yet. Add your locations so customers near your branches find you first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {branches.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{b.name}</p>
                              {b.isHeadquarters && <Badge tone="primary">HQ</Badge>}
                              {!b.isActive && <Badge tone="neutral">Inactive</Badge>}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{b.location}</p>
                            {b.phoneNumber && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone size={11} /> {b.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBranch(b.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          title="Remove branch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── RIDER: Routes shortcut ─────────────────────────────────────── */}
          {isRider && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Navigation size={17} className="text-primary" />
                    <h2 className="font-semibold text-foreground">Planned Routes</h2>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={routes.provider.myRoutes}>Manage routes</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Post your planned trips (origin quarter → destination quarter) and get matched with open delivery jobs along your way.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Contact */}
          {profile.phoneNumber && (
            <Card>
              <CardHeader><h2 className="font-semibold text-foreground">Contact</h2></CardHeader>
              <CardContent>
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={15} />
                  {profile.phoneNumber}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Verification status card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-foreground">Verification Status</h2>
                <Badge tone={verif.tone}>
                  {profile.verificationStatus === 'verified' && <ShieldCheck size={13} />}
                  {verif.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {records.length > 0 && (
                <div className="space-y-2">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{DOC_LABELS[r.verificationType] ?? r.verificationType}</span>
                      <Badge tone={DOC_STATUS_TONES[r.status] ?? 'neutral'} className="capitalize">
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {profile.verificationStatus === 'unverified' && (
                <p className="text-sm text-muted-foreground">
                  Your profile is not yet verified. Submit your documents to begin the review process.
                </p>
              )}
              {profile.verificationStatus === 'pending' && (
                <p className="text-sm text-muted-foreground">
                  Documents submitted. Our team will review them and notify you once verification is complete.
                </p>
              )}
              {profile.verificationStatus === 'rejected' && (
                <p className="text-sm text-danger">
                  Some documents were rejected. Please re-submit the corrected documents.
                </p>
              )}
              {profile.verificationStatus === 'verified' && (
                <p className="text-sm text-success">
                  Your account is fully verified. You can receive delivery requests.
                </p>
              )}

              {canSubmitDocs && (
                <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
                  <FileCheck size={17} />
                  {records.length > 0 ? 'Re-submit Documents' : 'Submit Verification Documents'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>

      <VerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        providerType={profile.providerType}
        onSubmitted={handleSubmitted}
      />
    </>
  );
}
