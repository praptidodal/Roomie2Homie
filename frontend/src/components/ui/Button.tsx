import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2Icon } from 'lucide-react';

type Variant = 'primary' | 'gradient' | 'secondary' | 'ghost' | 'coral' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-violet-500 text-white hover:bg-violet-600 shadow-sm',
  gradient:
  'bg-violet-coral text-white shadow-lift hover:brightness-105 hover:shadow-[0_28px_60px_-26px_rgba(255,107,107,0.45)]',
  secondary:
  'bg-white text-navy-900 border border-cream-300 hover:border-violet-300 hover:bg-violet-50',
  ghost: 'bg-transparent text-navy-700 hover:bg-violet-50 hover:text-violet-700',
  coral: 'bg-coral-400 text-white hover:bg-coral-500 shadow-sm',
  dark: 'bg-navy-900 text-white hover:bg-navy-800'
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'min-h-[3.25rem] px-7 py-3.5 text-base gap-2.5'
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
        'inline-flex items-center justify-center rounded-full font-semibold transition-[background-color,box-shadow,transform,color,border-color] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className
      )}>
      
      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>);

}