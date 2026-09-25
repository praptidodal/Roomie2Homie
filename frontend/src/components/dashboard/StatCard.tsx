import React from 'react';
import { Link } from 'react-router-dom';

export function StatCard({
  label,
  value,
  hint,
  icon,
  to,
  tone = 'plain'







}: {label: string;value: string | number;hint?: string;icon: React.ReactNode;to?: string;tone?: 'plain' | 'gradient' | 'mint';}) {
  const shell =
  tone === 'gradient' ?
  'bg-violet-coral text-white border-transparent' :
  tone === 'mint' ?
  'bg-mint-50 border-mint-200 text-navy-900' :
  'bg-white border-cream-300 text-navy-900';

  const body =
  <div
    className={`flex h-full flex-col justify-between rounded-3xl border p-5 shadow-soft transition-[transform,box-shadow] duration-200 ease-out ${shell} ${
    to ? 'hover:-translate-y-1 hover:shadow-lift' : ''}`
    }>
    
      <div className="flex items-start justify-between gap-3">
        <p
        className={`text-sm font-semibold ${
        tone === 'gradient' ? 'text-white/80' : 'text-navy-500'}`
        }>
        
          {label}
        </p>
        <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
        tone === 'gradient' ? 'bg-white/20 text-white' : 'bg-violet-50 text-violet-600'}`
        }>
        
          {icon}
        </span>
      </div>
      <div className="mt-6">
        <p className="font-display text-3xl font-extrabold tracking-tight">{value}</p>
        {hint &&
      <p
        className={`mt-1 text-xs ${
        tone === 'gradient' ? 'text-white/75' : 'text-navy-500'}`
        }>
        
            {hint}
          </p>
      }
      </div>
    </div>;


  return to ?
  <Link to={to} className="block h-full">
      {body}
    </Link> :

  body;

}