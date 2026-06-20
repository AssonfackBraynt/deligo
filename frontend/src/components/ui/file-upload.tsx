'use client';

import { useRef, useState } from 'react';
import { Upload, X, FileText, CheckCircle2, ImagePlus } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';

export interface UploadedFileResult {
  id: string;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: string | null;
  documentPurpose: string | null;
  createdAt: string;
}

interface FileUploadProps {
  label: string;
  documentPurpose: string;
  accept?: string;
  onUploaded: (result: UploadedFileResult) => void;
  existingFileId?: string | null;
  disabled?: boolean;
}

export function FileUpload({
  label,
  documentPurpose,
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  onUploaded,
  existingFileId,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(!!existingFileId);
  const [filename, setFilename] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentPurpose', documentPurpose);
      const result = await apiClient.upload<UploadedFileResult>('/files/upload', fd);
      setUploaded(true);
      setFilename(result.originalFilename ?? file.name);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>

      {uploaded ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
          <CheckCircle2 size={18} className="shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-success">Uploaded</p>
            {filename && <p className="truncate text-xs text-muted-foreground">{filename}</p>}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => { setUploaded(false); setFilename(null); if (inputRef.current) inputRef.current.value = ''; }}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            disabled || uploading
              ? 'border-border bg-muted opacity-60 cursor-not-allowed'
              : 'border-border bg-surface hover:border-primary/40 cursor-pointer'
          }`}
          onDrop={disabled ? undefined : handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={handleChange} disabled={disabled || uploading} />
          {uploading ? (
            <>
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Encrypting and uploading…</p>
            </>
          ) : (
            <>
              <Upload size={24} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or PDF · max 10 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ── Secure image/document viewer (fetches from /files/:id/content and decrypts on backend) ──

interface SecureImageProps {
  fileId: string;
  alt?: string;
  className?: string;
}

export function SecureImage({ fileId, alt = 'Document', className }: SecureImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function load() {
    if (src || loading) return;
    setLoading(true);
    try {
      const token = typeof window !== 'undefined'
        ? (() => { try { return (JSON.parse(localStorage.getItem('deligo-auth') ?? '{}') as any)?.state?.accessToken ?? null; } catch { return null; } })()
        : null;
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const res = await fetch(`${BASE}/files/${fileId}/content`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) { setError(true); return; }
      setSrc(URL.createObjectURL(await res.blob()));
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  if (error) return <div className={`flex items-center justify-center rounded bg-muted text-xs text-muted-foreground ${className}`}>Failed to load</div>;
  if (!src) {
    return (
      <button type="button" onClick={load} className={`flex items-center justify-center gap-1 rounded border border-dashed border-border bg-muted text-xs text-muted-foreground hover:bg-primary/5 ${className}`}>
        {loading ? <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <><FileText size={13} /><span>View</span></>}
      </button>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}

// Legacy hint placeholder kept for compatibility
export function FileUploadHint() {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-surface p-4 text-center">
      <div className="space-y-1">
        <ImagePlus size={24} className="mx-auto text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">No file uploaded</p>
      </div>
    </div>
  );
}
