'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bike,
  Building2,
  Edit,
  FileCheck,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Truck,
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
  ProviderProfilePrivate,
  ProviderType,
  VerificationStatus,
} from '@/features/provider-profile/profile-types';
import {
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

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProviderProfilePrivate | null>(null);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadAll() {
    try {
      const [p, r] = await Promise.all([
        apiClient.get<ProviderProfilePrivate>('/provider-profiles/me'),
        getMyVerificationRecords(),
      ]);
      setProfile(p);
      setRecords(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);

  function handleSubmitted() {
    void loadAll();
  }

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
              {/* Summary of submitted docs */}
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

              {/* Status notices */}
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

              {/* CTA */}
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

      {/* Verification modal */}
      <VerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        providerType={profile.providerType}
        onSubmitted={handleSubmitted}
      />
    </>
  );
}
