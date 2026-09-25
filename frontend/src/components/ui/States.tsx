import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2Icon } from 'lucide-react';

export function Spinner({ className }: {className?: string;}) {
  return (
    <Loader2Icon
      className={twMerge('h-5 w-5 animate-spin text-violet-500', className)}
      aria-hidden />);


}

export function LoadingState({ label = 'Loading…' }: {label?: string;}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-cream-300 bg-white/70 px-6 py-16 text-center">
      
      <Spinner className="h-6 w-6" />
      <p className="text-sm font-semibold text-navy-600">{label}</p>
    </div>);

}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-full bg-cream-300" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-cream-300" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-cream-200" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-cream-200" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-cream-200" />
      </div>
    </div>);

}

export function EmptyState({
  icon,
  title,
  description,
  action





}: {icon?: React.ReactNode;title: string;description?: string;action?: React.ReactNode;}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-16 text-center">
      {icon &&
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
          {icon}
        </div>
      }
      <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>);

}