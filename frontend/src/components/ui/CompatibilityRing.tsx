import React from 'react';
import { twMerge } from 'tailwind-merge';

const palette = {
  mint: { from: '#5D7A5D', to: '#7A9A7A', text: 'text-sage-600' },
  violet: { from: '#5D7A5D', to: '#8BA68B', text: 'text-sage-600' },
  coral: { from: '#FFB7B2', to: '#E06A62', text: 'text-peach-500' },
  sage: { from: '#5D7A5D', to: '#7A9A7A', text: 'text-sage-600' },
  peach: { from: '#FFB7B2', to: '#E06A62', text: 'text-peach-500' },
};

type Tone = keyof typeof palette;

const dims = {
  sm: { box: 56, stroke: 4.5, label: 'text-xs' },
  md: { box: 76, stroke: 5.5, label: 'text-sm' },
  lg: { box: 116, stroke: 7, label: 'text-xl' },
};

/**
 * CompatibilityRing
 * Signature circular progress indicator showing lifestyle match score.
 * Soft pastel gradients, warm background ring track, and clear Outfit typography.
 */
export function CompatibilityRing({
  score,
  tone = 'violet',
  size = 'md',
  caption,
  className,
}: {
  score: number;
  tone?: Tone;
  size?: keyof typeof dims;
  caption?: string;
  className?: string;
}) {
  const { box, stroke, label } = dims[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const colors = palette[tone] || palette.violet;
  const gradientId = `ring-${tone}-${size}`;

  return (
    <div className={twMerge('relative inline-flex flex-col items-center select-none', className)}>
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
          stroke="#F0ECE4"
          strokeWidth={stroke}
        />
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
          style={{ transition: 'stroke-dashoffset 320ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={twMerge('font-display font-bold text-wellness-dark tracking-tight', label)}>
          {score}%
        </span>
        {caption && size === 'lg' && (
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-wellness-muted">
            {caption}
          </span>
        )}
      </span>
    </div>
  );
}

export function ScoreBar({ score, tone = 'violet' }: { score: number; tone?: Tone }) {
  const colors = palette[tone] || palette.violet;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/60">
      <div
        className="h-full rounded-full"
        style={{
          width: `${score}%`,
          background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
          transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}