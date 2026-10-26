import React from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  annotation,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  annotation?: string;
}) {
  return (
    <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 max-w-full">
        {eyebrow && (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sage-200/80 bg-sage-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-wellness-dark">
          {title}
          {annotation && (
            <span className="ml-2 font-handwriting text-2xl font-normal text-peach-500">
              {annotation}
            </span>
          )}
        </h1>
        {description && (
          <p className="mt-1.5 sm:mt-2 max-w-2xl text-xs sm:text-sm lg:text-base text-wellness-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}