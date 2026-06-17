import { cn } from '@/lib/cn';

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-12 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-primary',
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-3 text-base text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-primary',
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-12 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground shadow-sm transition focus:border-primary',
        props.className,
      )}
    />
  );
}
