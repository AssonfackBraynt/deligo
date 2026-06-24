'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from './button';
import { apiClient, ApiError } from '@/lib/api-client';
import {
  submitVerificationRecord,
  type VerificationRecord,
} from '@/features/provider-portal/provider-portal-api';
import type { ProviderType } from '@/features/provider-profile/profile-types';

// ── Types ─────────────────────────────────────────────────────────────────────

type StagedFile = { file: File; previewUrl: string } | null;

interface UploadedFileResult {
  id: string;
  originalFilename: string | null;
}

// ── StagedFilePicker — local preview, no network until submit ─────────────────

function StagedFilePicker({
  label,
  hint,
  accept,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  accept?: string;
  value: StagedFile;
  onChange: (v: StagedFile) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(file: File) {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pick(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) pick(f);
  }

  function clear() {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const isImage = value ? value.file.type.startsWith('image/') : false;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
          {isImage ? (
            <img
              src={value.previewUrl}
              alt="preview"
              className="h-36 w-full object-cover"
            />
          ) : (
            <div className="flex items-center gap-3 px-4 py-5">
              <FileText size={22} className="shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{value.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(value.file.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow hover:bg-background"
            >
              <X size={13} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center transition ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/40'
          }`}
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={disabled ? undefined : handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload size={22} className="text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Click or drag & drop</p>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or PDF · max 10 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept ?? 'image/jpeg,image/png,image/webp,application/pdf'}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}

// ── VerificationModal ─────────────────────────────────────────────────────────

export function VerificationModal({
  isOpen,
  onClose,
  providerType,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  providerType: ProviderType;
  onSubmitted: () => void;
}) {
  // Independent rider fields
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [nationalIdError, setNationalIdError] = useState('');
  const [nationalIdFront, setNationalIdFront] = useState<StagedFile>(null);
  const [nationalIdBack, setNationalIdBack] = useState<StagedFile>(null);
  const [profilePhoto, setProfilePhoto] = useState<StagedFile>(null);
  const [niuNumber, setNiuNumber] = useState('');
  const [niuError, setNiuError] = useState('');
  const [niuDoc, setNiuDoc] = useState<StagedFile>(null);

  // Company fields
  const [managerNationalId, setManagerNationalId] = useState<StagedFile>(null);
  const [businessReg, setBusinessReg] = useState<StagedFile>(null);
  const [taxDoc, setTaxDoc] = useState<StagedFile>(null);
  const [insuranceDoc, setInsuranceDoc] = useState<StagedFile>(null);
  const [agencyDoc, setAgencyDoc] = useState<StagedFile>(null);

  const [step, setStep] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRider = providerType === 'independent_rider';
  const isLogistics = providerType === 'logistics_company';

  function validateNationalId(value: string): boolean {
    return /^20\d{15}$/.test(value);
  }

  function validateNiu(value: string): boolean {
    return /^[A-Za-z0-9]{13}$/.test(value);
  }

  function handleNationalIdChange(value: string) {
    setNationalIdNumber(value);
    if (value && !validateNationalId(value)) {
      setNationalIdError('Incorrect format');
    } else {
      setNationalIdError('');
    }
  }

  function handleNiuChange(value: string) {
    setNiuNumber(value);
    if (value && !validateNiu(value)) {
      setNiuError('Incorrect format');
    } else {
      setNiuError('');
    }
  }

  async function uploadAndRecord(
    file: StagedFile,
    purpose: string,
    verificationType: string,
    submittedValue?: string,
  ): Promise<void> {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file.file);
    fd.append('documentPurpose', purpose);
    const result = await apiClient.upload<UploadedFileResult>('/files/upload', fd);
    await submitVerificationRecord({ verificationType, fileId: result.id, submittedValue });
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      if (isRider) {
        if (!nationalIdNumber.trim() || !nationalIdFront || !nationalIdBack || !profilePhoto || !niuNumber.trim() || !niuDoc) {
          setError('All fields are required for Independent Rider verification.');
          return;
        }
        if (!validateNationalId(nationalIdNumber.trim())) {
          setNationalIdError('Incorrect format');
          setError('Please fix the errors above before submitting.');
          return;
        }
        if (!validateNiu(niuNumber.trim())) {
          setNiuError('Incorrect format');
          setError('Please fix the errors above before submitting.');
          return;
        }
        setStep('Uploading National ID (front)…');
        await uploadAndRecord(nationalIdFront, 'national_id', 'national_id', `${nationalIdNumber.trim()} (front)`);

        setStep('Uploading National ID (back)…');
        await uploadAndRecord(nationalIdBack, 'national_id', 'national_id', `${nationalIdNumber.trim()} (back)`);

        setStep('Uploading Profile Photo…');
        await uploadAndRecord(profilePhoto, 'profile', 'profile');

        setStep('Uploading NIU Certificate…');
        await uploadAndRecord(niuDoc, 'tax_document', 'tax_document', niuNumber.trim());
      } else {
        if (!managerNationalId || !businessReg || !taxDoc) {
          setError('National ID, Business Registration and Tax Document are required.');
          return;
        }
        setStep('Uploading National ID…');
        await uploadAndRecord(managerNationalId, 'national_id', 'national_id');

        setStep('Uploading Business Registration…');
        await uploadAndRecord(businessReg, 'business_registration', 'business_registration');

        setStep('Uploading Tax Document…');
        await uploadAndRecord(taxDoc, 'tax_document', 'tax_document');

        if (insuranceDoc) {
          setStep('Uploading Insurance Document…');
          await uploadAndRecord(insuranceDoc, 'insurance_document', 'insurance_document');
        }
        if (agencyDoc) {
          setStep('Uploading Agency Document…');
          await uploadAndRecord(agencyDoc, 'agency_document', 'agency_document');
        }
      }

      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
      setStep('');
    }
  }

  if (!isOpen) return null;

  const canSubmitRider = validateNationalId(nationalIdNumber.trim()) && !!nationalIdFront && !!nationalIdBack && !!profilePhoto && validateNiu(niuNumber.trim()) && !!niuDoc;
  const canSubmitCompany = !!managerNationalId && !!businessReg && !!taxDoc;
  const canSubmit = isRider ? canSubmitRider : canSubmitCompany;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm py-8 px-4">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Submit Verification Documents</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isRider
                ? 'Upload the documents below. They will be reviewed by our team.'
                : 'Upload company documents for verification.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="mt-0.5 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <hr className="border-border" />

        {/* Fields */}
        <div className="space-y-5">
          {isRider ? (
            <>
              {/* National ID card number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  National ID Card Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={nationalIdNumber}
                  onChange={(e) => handleNationalIdChange(e.target.value)}
                  placeholder="e.g. 20XXXXXXXXXXXXXXX (17 digits)"
                  maxLength={17}
                  disabled={submitting}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 ${nationalIdError ? 'border-danger' : 'border-border'}`}
                />
                {nationalIdError ? (
                  <p className="text-xs text-danger">{nationalIdError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">17-digit number starting with 20</p>
                )}
              </div>

              <StagedFilePicker
                label="National ID Card — Front"
                hint="Photo of the front side of your national identity card"
                accept="image/jpeg,image/png,image/webp"
                value={nationalIdFront}
                onChange={setNationalIdFront}
                disabled={submitting}
              />
              <StagedFilePicker
                label="National ID Card — Back"
                hint="Photo of the back side of your national identity card"
                accept="image/jpeg,image/png,image/webp"
                value={nationalIdBack}
                onChange={setNationalIdBack}
                disabled={submitting}
              />
              <StagedFilePicker
                label="Profile Photo"
                hint="A clear photo of your face"
                accept="image/jpeg,image/png,image/webp"
                value={profilePhoto}
                onChange={setProfilePhoto}
                disabled={submitting}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  NIU Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={niuNumber}
                  onChange={(e) => handleNiuChange(e.target.value)}
                  placeholder="13-character alphanumeric"
                  maxLength={13}
                  disabled={submitting}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 ${niuError ? 'border-danger' : 'border-border'}`}
                />
                {niuError && (
                  <p className="text-xs text-danger">{niuError}</p>
                )}
              </div>
              <StagedFilePicker
                label="NIU Certificate (PDF or photo)"
                hint="Official NIU document issued by the tax authority"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                value={niuDoc}
                onChange={setNiuDoc}
                disabled={submitting}
              />
            </>
          ) : (
            <>
              <StagedFilePicker
                label="Manager / Director National ID"
                value={managerNationalId}
                onChange={setManagerNationalId}
                disabled={submitting}
              />
              <StagedFilePicker
                label="Business Registration Certificate"
                value={businessReg}
                onChange={setBusinessReg}
                disabled={submitting}
              />
              <StagedFilePicker
                label="Tax Document (NIU)"
                value={taxDoc}
                onChange={setTaxDoc}
                disabled={submitting}
              />
              {isLogistics && (
                <>
                  <StagedFilePicker
                    label="Insurance Document"
                    hint="Optional but recommended"
                    value={insuranceDoc}
                    onChange={setInsuranceDoc}
                    disabled={submitting}
                  />
                  <StagedFilePicker
                    label="Agency Document"
                    hint="Optional"
                    value={agencyDoc}
                    onChange={setAgencyDoc}
                    disabled={submitting}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || !canSubmit}
            className="flex-1"
          >
            {submitting ? (step || 'Submitting…') : 'Submit for Review'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          All documents are encrypted and stored securely.
        </p>
      </div>
    </div>
  );
}
