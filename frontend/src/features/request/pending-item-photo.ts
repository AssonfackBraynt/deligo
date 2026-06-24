const files = new Map<string, File>();
const previewUrls = new Map<string, string>();

export function setPendingPhoto(draftId: string, file: File): string {
  const existing = previewUrls.get(draftId);
  if (existing) URL.revokeObjectURL(existing);

  const url = URL.createObjectURL(file);
  files.set(draftId, file);
  previewUrls.set(draftId, url);
  return url;
}

export function getPendingPhotoFile(draftId: string): File | undefined {
  return files.get(draftId);
}

export function getPendingPhotoUrl(draftId: string): string | undefined {
  return previewUrls.get(draftId);
}

export function clearPendingPhoto(draftId: string) {
  const url = previewUrls.get(draftId);
  if (url) URL.revokeObjectURL(url);
  files.delete(draftId);
  previewUrls.delete(draftId);
}
