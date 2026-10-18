import React from 'react';
import { twMerge } from 'tailwind-merge';
import { BadgeCheckIcon, ClockIcon, ShieldAlertIcon } from 'lucide-react';
import type { VerificationStatus } from '../../types';

type Tone =
  | 'violet'
  | 'coral'
  | 'mint'
  | 'navy'
  | 'neutral'
  | 'amber'
  | 'sage'
  | 'lavender'
  | 'peach'
  | 'stone';

const tones: Record<Tone, string> = {
  sage: 'bg-sage-100 text-stone-800 ring-sage-200/90',
  lavender: 'bg-lavender-100 text-stone-800 ring-lavender-200/90',
  peach: 'bg-peach-100 text-stone-800 ring-peach-200/90',
  mint: 'bg-sage-100 text-stone-800 ring-sage-200/90',
  coral: 'bg-peach-100 text-peach-500 ring-peach-200/90',
  violet: 'bg-lavender-100 text-stone-800 ring-lavender-200/90',
  neutral: 'bg-stone-100/80 text-wellness-muted ring-stone-200/70',
  stone: 'bg-stone-100 text-wellness-dark ring-stone-200/80',
  navy: 'bg-wellness-dark text-white ring-wellness-dark',
  amber: 'bg-amber-50 text-amber-900 ring-amber-200/80',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight ring-1 ring-inset',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  if (status === 'verified')
    return (
      <Badge tone="sage" className={className}>
        <BadgeCheckIcon className="h-3.5 w-3.5 text-sage-600" aria-hidden />
        Verified
      </Badge>
    );

  if (status === 'pending')
    return (
      <Badge tone="amber" className={className}>
        <ClockIcon className="h-3.5 w-3.5 text-amber-600" aria-hidden />
        In review
      </Badge>
    );

  if (status === 'rejected')
    return (
      <Badge tone="peach" className={className}>
        <ShieldAlertIcon className="h-3.5 w-3.5 text-peach-500" aria-hidden />
        Rejected
      </Badge>
    );

  return (
    <Badge tone="neutral" className={className}>
      Unverified
    </Badge>
  );
}