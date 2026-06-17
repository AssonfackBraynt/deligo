import { cn } from '@/lib/cn';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'primary';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/16 text-amber-800',
  primary: 'bg-primary/12 text-primary',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold', tones[tone], className)}
      {...props}
    />
  );
}
