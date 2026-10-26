import React from 'react';
import { twMerge } from 'tailwind-merge';
import { initials, resolveImageUrl } from '../../utils/format';

const sizes = {
  xs: 'h-8 w-8 text-[11px]',
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-20 w-20 text-lg',
  xl: 'h-28 w-28 text-2xl'
};

export function Avatar({
  name,
  src,
  size = 'md',
  ring = false,
  online,
  className
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  ring?: boolean;
  online?: boolean;
  className?: string;
}) {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  const resolvedSrc = src ? resolveImageUrl(src) : '';

  return (
    <span className={twMerge('relative inline-flex shrink-0', className)}>
      {resolvedSrc && !imgError ? (
        <img
          src={resolvedSrc}
          alt={name}
          onError={() => setImgError(true)}
          className={twMerge(
            'rounded-full object-cover',
            sizes[size],
            ring ? 'ring-2 ring-peach-200 ring-offset-2 ring-offset-white' : 'ring-1 ring-stone-200'
          )}
        />
      ) : (
        <span
          aria-hidden
          className={twMerge(
            'inline-flex items-center justify-center rounded-full bg-sage-200 font-bold text-wellness-dark',
            sizes[size]
          )}
        >
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={twMerge(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white',
            online ? 'bg-mint-400' : 'bg-navy-500/40'
          )}
          aria-hidden
        />
      )}
    </span>
  );
}