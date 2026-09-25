import React from 'react';
import { twMerge } from 'tailwind-merge';
import { BadgeCheckIcon, ClockIcon, ShieldAlertIcon } from 'lucide-react';
import type { VerificationStatus } from '../../types';

type Tone = 'violet' | 'coral' | 'mint' | 'navy' | 'neutral' | 'amber';

const tones: Record<Tone, string> = {
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  coral: 'bg-coral-50 text-coral-600 ring-coral-200',
  mint: 'bg-mint-50 text-mint-600 ring-mint-200',
  navy: 'bg-navy-900 text-white ring-navy-900',
  neutral: 'bg-cream-200 text-navy-600 ring-cream-300',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200'
};

export function Badge({
  tone = 'neutral',
  className,
  children




}: {tone?: Tone;className?: string;children: React.ReactNode;}) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className
      )}>
      
      {children}
    </span>);

}

export function VerificationBadge({
  status,
  className



}: {status: VerificationStatus;className?: string;}) {
  if (status === 'verified')
  return (
    <Badge tone="mint" className={className}>
        <BadgeCheckIcon className="h-3.5 w-3.5" aria-hidden />
        Verified
      </Badge>);

  if (status === 'pending')
  return (
    <Badge tone="amber" className={className}>
        <ClockIcon className="h-3.5 w-3.5" aria-hidden />
        In review
      </Badge>);

  if (status === 'rejected')
  return (
    <Badge tone="coral" className={className}>
        <ShieldAlertIcon className="h-3.5 w-3.5" aria-hidden />
        Rejected
      </Badge>);

  return (
    <Badge tone="neutral" className={className}>
      Unverified
    </Badge>);

}