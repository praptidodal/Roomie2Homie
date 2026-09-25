import React from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action





}: {eyebrow?: string;title: string;description?: string;action?: React.ReactNode;}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow &&
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-500">
            {eyebrow}
          </p>
        }
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          {title}
        </h1>
        {description &&
        <p className="mt-1.5 max-w-2xl text-sm text-navy-500">{description}</p>
        }
      </div>
      {action}
    </div>);

}