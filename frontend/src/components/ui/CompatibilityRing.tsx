import React from 'react';
import { twMerge } from 'tailwind-merge';

const palette = {
  mint: { from: '#2DD4BF', to: '#7C3AED', text: 'text-mint-600' },
  violet: { from: '#7C3AED', to: '#FF6B6B', text: 'text-violet-600' },
  coral: { from: '#FF6B6B', to: '#F59E0B', text: 'text-coral-500' }
};

type Tone = keyof typeof palette;

const dims = {
  sm: { box: 56, stroke: 5, label: 'text-xs' },
  md: { box: 76, stroke: 6, label: 'text-sm' },
  lg: { box: 116, stroke: 8, label: 'text-xl' }
};

/** Colourful compatibility ring — the signature element of a match card. */
export function CompatibilityRing({
  score,
  tone = 'violet',
  size = 'md',
  caption,
  className






}: {score: number;tone?: Tone;size?: keyof typeof dims;caption?: string;className?: string;}) {
  const { box, stroke, label } = dims[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const colors = palette[tone];
  const gradientId = `ring-${tone}-${size}`;

  return (
    <div className={twMerge('relative inline-flex flex-col items-center', className)}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} role="img" aria-label={`${score}% compatible`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="#F7EDE1"
          strokeWidth={stroke} />
        
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${box / 2} ${box / 2})`}
          style={{ transition: 'stroke-dashoffset 280ms cubic-bezier(0.23,1,0.32,1)' }} />
        
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={twMerge('font-display font-extrabold text-navy-900', label)}>
          {score}%
        </span>
        {caption && size === 'lg' &&
        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
            {caption}
          </span>
        }
      </span>
    </div>);

}

export function ScoreBar({ score, tone = 'violet' }: {score: number;tone?: Tone;}) {
  const colors = palette[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-cream-300">
      <div
        className="h-full rounded-full"
        style={{
          width: `${score}%`,
          background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
          transition: 'width 260ms cubic-bezier(0.23,1,0.32,1)'
        }} />
      
    </div>);

}