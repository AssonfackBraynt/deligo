'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SecureImage } from '@/components/ui/file-upload';
import {
  listVerificationQueue,
  reviewVerificationRecord,
  type VerificationQueueItem,
} from '@/features/admin/admin-api';
import { AdminNav } from '@/components/layout/admin-nav';

const DOC_LABELS: Record<string, string> = {
  national_id: 'National ID',
  driver_license: 'Driver License',
  business_registration: 'Business Registration',
  tax_document: 'Tax Document',
  insurance_document: 'Insurance',
  profile: 'Profile Photo',
  rider_identity: 'Vehicle Photo',
  agency_document: 'Agency Document',
};

type StatusFilter = 'pending' | 'approved' | 'rejected';

export default function VerificationsPage() {
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [items, setItems] = useState<VerificationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [activeRecord, setActiveRecord] = useState<VerificationQueueItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  async function load(s: StatusFilter) {
    setLoading(true);
    listVerificationQueue(s)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => { void load(status); }, [status]);

  async function handleReview(record: VerificationQueueItem, type: 'approve' | 'reject') {
    setActiveRecord(record);
    setActionType(type);
    setRejectReason('');
    setApprovalNotes('');
  }

  async function submitReview() {
    if (!activeRecord || !actionType) return;
    setReviewing(activeRecord.id);
    try {
      await reviewVerificationRecord(activeRecord.id, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        rejectionReason: actionType === 'reject' ? rejectReason : undefined,
        approvalNotes: actionType === 'approve' ? approvalNotes : undefined,
      });
      setActiveRecord(null);
      setActionType(null);
      await load(status);
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav active="verifications" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Verification Queue</h1>
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
            {(['pending', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                  status === s ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No {status} verification records.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.provider?.displayName ?? 'Unknown Provider'}</p>
                      <p className="text-sm text-muted-foreground capitalize">{item.provider?.providerType?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'neutral'}>
                        {item.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {DOC_LABELS[item.verificationType] ?? item.verificationType}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.submittedValue && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Submitted value: </span>
                      {item.submittedValue}
                    </p>
                  )}
                  {item.documentFileId && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Document</p>
                      <SecureImage
                        fileId={item.documentFileId}
                        alt={DOC_LABELS[item.verificationType] ?? 'Document'}
                        className="h-48 w-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                  {item.rejectionReason && (
                    <p className="text-sm text-danger"><span className="font-medium">Rejection reason: </span>{item.rejectionReason}</p>
                  )}
                  {item.approvalNotes && (
                    <p className="text-sm text-success"><span className="font-medium">Approval notes: </span>{item.approvalNotes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(item.createdAt).toLocaleDateString('fr-CM', { dateStyle: 'medium' })}
                    {item.reviewedAt && ` · Reviewed ${new Date(item.reviewedAt).toLocaleDateString('fr-CM', { dateStyle: 'medium' })}`}
                  </p>

                  {item.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleReview(item, 'approve')}
                        disabled={reviewing === item.id}
                      >
                        <CheckCircle2 size={15} />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(item, 'reject')}
                        disabled={reviewing === item.id}
                      >
                        <XCircle size={15} />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review modal */}
        {activeRecord && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl">
              <h2 className="font-semibold text-foreground">
                {actionType === 'approve' ? 'Approve Document' : 'Reject Document'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {DOC_LABELS[activeRecord.verificationType] ?? activeRecord.verificationType}
                {' — '}
                {activeRecord.provider?.displayName}
              </p>

              {actionType === 'reject' ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Rejection reason <span className="text-danger">*</span></label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Explain why this document is being rejected…"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Optional approval notes…"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => void submitReview()}
                  disabled={!!reviewing || (actionType === 'reject' && !rejectReason.trim())}
                  className="flex-1"
                >
                  {reviewing ? 'Saving…' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Button>
                <Button variant="outline" onClick={() => { setActiveRecord(null); setActionType(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
