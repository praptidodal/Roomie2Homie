import type { CSSProperties } from 'react';

export type BlobTone = 'sage' | 'lavender' | 'peach' | 'mixed';
export type BlobSize = 'sm' | 'md' | 'lg' | 'xl';

interface FloatingBlobProps {
  tone?: BlobTone;
  size?: BlobSize;
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
}

const toneGradients: Record<BlobTone, string> = {
  sage: 'from-[#E8EFE8] via-[#D2E0D2]/70 to-transparent',
  lavender: 'from-[#EFEDF4] via-[#DDD7E8]/70 to-transparent',
  peach: 'from-[#FFB7B2] via-[#FFE5E3]/70 to-transparent',
  mixed: 'from-[#EFEDF4] via-[#E8EFE8]/75 to-[#FFB7B2]/40',
};

const sizeClasses: Record<BlobSize, string> = {
  sm: 'h-48 w-48 blur-2xl',
  md: 'h-72 w-72 blur-3xl',
  lg: 'h-96 w-96 blur-3xl',
  xl: 'h-[32rem] w-[32rem] blur-[80px]',
};

/**
 * FloatingBlob
 * Reusable ambient decorative background blob.
 * CSS-only floating animation, hardware-accelerated, pointer-events disabled,
 * strictly sits behind content with no layout impact.
 */
export function FloatingBlob({
  tone = 'sage',
  size = 'md',
  animate = true,
  className = '',
  style,
}: FloatingBlobProps) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`pointer-events-none absolute -z-10 select-none rounded-full bg-gradient-to-tr ${toneGradients[tone]} ${sizeClasses[size]} ${
        animate ? 'animate-float-slow' : ''
      } ${className}`}
    />
  );
}
