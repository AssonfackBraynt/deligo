import { cn } from '@/lib/cn';

export function StickyActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-0',
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl gap-3">{children}</div>
    </div>
  );
}
