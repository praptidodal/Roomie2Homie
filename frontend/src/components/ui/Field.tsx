import React from 'react';
import { twMerge } from 'tailwind-merge';

const base =
  'w-full min-w-0 max-w-full rounded-2xl border border-stone-200/80 bg-white/95 px-4 text-sm text-wellness-dark placeholder:text-stone-400 transition-colors duration-150 ease-out focus:border-lavender-500 focus:outline-none focus:ring-4 focus:ring-lavender-500/15 disabled:bg-stone-100/70 disabled:text-stone-400 disabled:cursor-not-allowed';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge('space-y-1.5 min-w-0 w-full', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-wellness-dark truncate">
        {label}
        {required && <span className="ml-1 text-peach-500 font-bold">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-wellness-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} {...rest} className={twMerge(base, 'h-12', className)} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} {...rest} className={twMerge(base, 'h-12 pr-9', className)}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} {...rest} className={twMerge(base, 'py-3 min-h-[5.5rem]', className)} />;
});