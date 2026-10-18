import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'li';
  padded?: boolean;
  hover?: boolean;
}

export function Card({
  as = 'div',
  padded = true,
  hover = false,
  className,
  children,
  ...rest
}: CardProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      {...rest}
      className={twMerge(
        'rounded-4xl border border-stone-200/70 bg-white/95 shadow-soft backdrop-blur-[2px]',
        padded && 'p-6 sm:p-7',
        hover &&
          'transition-all duration-200 ease-out hover:-translate-y-1 hover:border-stone-300 hover:shadow-floating',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge('flex flex-wrap items-start justify-between gap-3 pb-5', className)}>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-wellness-dark">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-wellness-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}