import React from 'react';
import { twMerge } from 'tailwind-merge';

const base =
'w-full rounded-2xl border border-cream-300 bg-white px-4 text-sm text-navy-900 placeholder:text-navy-500/60 transition-colors duration-150 ease-out focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/12 disabled:bg-cream-200 disabled:text-navy-500';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className








}: {label: string;htmlFor?: string;hint?: string;error?: string;required?: boolean;children: React.ReactNode;className?: string;}) {
  return (
    <div className={twMerge('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy-800">
        {label}
        {required && <span className="ml-0.5 text-coral-400">*</span>}
      </label>
      {children}
      {error ?
      <p className="text-xs font-semibold text-coral-500">{error}</p> :
      hint ?
      <p className="text-xs text-navy-500">{hint}</p> :
      null}
    </div>);

}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={twMerge(base, 'h-12', className)} />;
  });

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} {...rest} className={twMerge(base, 'h-12 pr-9', className)}>
      {children}
    </select>);

  });

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} {...rest} className={twMerge(base, 'py-3', className)} />;
  });