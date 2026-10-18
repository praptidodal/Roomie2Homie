import React from 'react';
import { Link } from 'react-router-dom';

export function Logo({
  to = '/',
  tone = 'dark',
  compact = false,
}: {
  to?: string;
  tone?: 'dark' | 'light';
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2.5 transition-transform active:scale-[0.98]"
      aria-label="Roomie2Homie home"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-wellness-dark border border-sage-200/80 shadow-soft">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5.5 9.5V20h13V9.5" />
          <circle cx="9.5" cy="14" r="1.4" />
          <circle cx="14.5" cy="14" r="1.4" />
          <path d="M9.5 17.5h5" />
        </svg>
      </span>
      {!compact && (
        <span
          className={`font-display text-lg font-bold tracking-tight select-none ${
            tone === 'light' ? 'text-white' : 'text-wellness-dark'
          }`}
        >
          Roomie<span className="text-peach-500">2</span>Homie
        </span>
      )}
    </Link>
  );
}