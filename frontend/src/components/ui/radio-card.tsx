import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

type RadioCardProps = {
  title: string;
  description?: string;
  selected?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export function RadioCard({ title, description, selected, icon, onClick }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex min-h-24 w-full items-start gap-3 rounded-lg border bg-surface p-4 text-left transition',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/60 hover:bg-muted/30',
      )}
    >
      {icon ? <span className="mt-0.5 text-primary">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {selected ? (
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check size={15} aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}
