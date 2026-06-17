import { ImagePlus } from 'lucide-react';

export function FileUploadHint() {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-surface p-4 text-center">
      <div>
        <ImagePlus className="mx-auto mb-2 text-primary" size={28} aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">Upload item photo</p>
        <p className="mt-1 text-sm text-muted-foreground">PNG or JPG, up to 5 MB</p>
      </div>
    </div>
  );
}
