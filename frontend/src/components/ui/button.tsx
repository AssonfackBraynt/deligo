import { cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: false;
};

type ButtonAsChildProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild: true;
  children: React.ReactNode;
  className?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/92',
  secondary: 'bg-accent text-accent-foreground hover:bg-accent/90',
  outline: 'border border-border bg-surface text-foreground hover:bg-muted/70',
  ghost: 'text-foreground hover:bg-muted/70',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 gap-2 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-base',
  icon: 'size-10 justify-center p-0',
};

const base =
  'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition disabled:pointer-events-none disabled:opacity-50';

export function Button(props: ButtonProps | ButtonAsChildProps) {
  const { variant = 'primary', size = 'md', className } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ('asChild' in props && props.asChild) {
    if (!isValidElement<{ className?: string }>(props.children)) {
      return null;
    }

    return cloneElement(props.children, {
      className: cn(classes, props.children.props.className),
    });
  }

  const buttonProps = {
    ...props,
  } as React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: false;
  };
  delete buttonProps.variant;
  delete buttonProps.size;
  delete buttonProps.asChild;
  delete buttonProps.className;

  return <button className={classes} {...buttonProps} />;
}
