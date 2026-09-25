export function rupees(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function rupeesShort(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${value}`;
}

export function monthDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function initials(name: string): string {
  return name.
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((p) => p[0]?.toUpperCase()).
  join('');
}

export function titleCase(value: string): string {
  return value.
  replace(/_/g, ' ').
  replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreTone(score: number): 'mint' | 'violet' | 'coral' {
  if (score >= 88) return 'mint';
  if (score >= 75) return 'violet';
  return 'coral';
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}