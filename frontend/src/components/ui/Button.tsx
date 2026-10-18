import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2Icon } from 'lucide-react';

type Variant =
  | 'primary'
  | 'gradient'
  | 'secondary'
  | 'ghost'
  | 'coral'
  | 'dark'
  | 'sage'
  | 'lavender';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-wellness-dark text-white hover:bg-stone-800 shadow-soft hover:shadow-floating hover:-translate-y-0.5',
  gradient:
    'bg-wellness-dark text-white hover:bg-stone-800 shadow-soft hover:shadow-floating hover:-translate-y-0.5',
  secondary:
    'bg-white text-wellness-dark border border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/70 shadow-soft',
  ghost:
    'bg-transparent text-wellness-dark hover:bg-stone-100/70 hover:text-stone-900',
  coral:
    'bg-peach-500 text-white hover:bg-peach-500/90 shadow-soft hover:shadow-floating hover:-translate-y-0.5',
  dark:
    'bg-wellness-dark text-white hover:bg-stone-800 shadow-soft hover:shadow-floating hover:-translate-y-0.5',
  sage:
    'bg-sage-100 text-wellness-dark border border-sage-200 hover:bg-sage-200/70 shadow-soft',
  lavender:
    'bg-lavender-100 text-wellness-dark border border-lavender-200 hover:bg-lavender-200/70 shadow-soft',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs gap-1.5 font-medium tracking-tight',
  md: 'h-11 px-5 text-sm gap-2 font-medium tracking-tight',
  lg: 'min-h-[3.25rem] px-7 py-3.5 text-base gap-2.5 font-semibold tracking-tight',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  block,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={twMerge(
        'inline-flex items-center justify-center rounded-full font-sans transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wellness-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-none',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className
      )}
    >
      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}