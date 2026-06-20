'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * Phone input with a non-editable +237 prefix badge.
 * Users type only the local part (e.g. 698 546 321).
 * Normalization to +237XXXXXXXXX happens at submit time via normalizeCameroonPhone().
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, placeholder = '698 000 001', disabled, ...props }, ref) => {
    return (
      <div className="flex">
        <span className="flex h-12 shrink-0 select-none items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
          +237
        </span>
        <input
          {...props}
          ref={ref}
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'h-12 w-full rounded-r-lg border border-border bg-surface px-3 text-base text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        />
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';
