import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'li';
  padded?: boolean;
  hover?: boolean;
}

export function Card({
  as: Tag = 'div',
  padded = true,
  hover = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={twMerge(
        'rounded-3xl border border-cream-300 bg-white shadow-soft',
        padded && 'p-5 sm:p-6',
        hover &&
        'transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-violet-200 hover:shadow-lift',
        className
      )}>
      
      {children}
    </Tag>);

}

export function CardHeader({
  title,
  description,
  action,
  className





}: {title: string;description?: string;action?: React.ReactNode;className?: string;}) {
  return (
    <div className={twMerge('flex flex-wrap items-start justify-between gap-3 pb-5', className)}>
      <div>
        <h2 className="font-display text-lg font-bold text-navy-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
      </div>
      {action}
    </div>);

}