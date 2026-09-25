import React from 'react';
import { Link } from 'react-router-dom';

export function Logo({ to = '/', tone = 'dark' }: {to?: string;tone?: 'dark' | 'light';}) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="Roomie2Homie home">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-coral text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5.5 9.5V20h13V9.5" />
          <circle cx="9.5" cy="14" r="1.4" />
          <circle cx="14.5" cy="14" r="1.4" />
          <path d="M9.5 17.5h5" />
        </svg>
      </span>
      <span
        className={`font-display text-lg font-extrabold tracking-tight ${
        tone === 'light' ? 'text-white' : 'text-navy-900'}`
        }>
        
        Roomie<span className="text-coral-400">2</span>Homie
      </span>
    </Link>);

}