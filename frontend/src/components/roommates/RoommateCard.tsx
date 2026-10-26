import React from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseIcon, CalendarCheckIcon, MapPinIcon, WalletIcon } from 'lucide-react';
import type { MatchCandidate } from '../../types';
import { monthDay, rupees, scoreTone, titleCase } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Badge, VerificationBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CompatibilityRing } from '../ui/CompatibilityRing';

export function RoommateCard({
  match,
  onRequest,
  pending,
}: {
  match: MatchCandidate;
  onRequest?: (m: MatchCandidate) => void;
  pending?: boolean;
}) {
  const p = match.profile;
  return (
    <article className="group relative overflow-hidden rounded-[2.5rem] border border-stone-200/70 bg-white/95 shadow-soft transition-all duration-200 ease-out hover:-translate-y-1 hover:border-stone-300 hover:shadow-floating">
      <div className="h-1 w-full bg-sage-200" aria-hidden />
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <Avatar name={p.name} src={p.avatar} size="md" ring />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold tracking-tight text-wellness-dark">
                  {p.name}
                </h3>
                <VerificationBadge status={p.verification} />
              </div>
              <p className="mt-0.5 text-xs text-wellness-muted">
                {[p.age, p.gender && p.gender !== 'prefer_not_to_say' ? titleCase(p.gender) : null, p.lastActive].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-wellness-dark/80">
                <BriefcaseIcon className="h-3.5 w-3.5 text-stone-400" aria-hidden />
                {p.occupation} at {p.company}
              </p>
            </div>
          </div>
          <CompatibilityRing score={match.score} tone={scoreTone(match.score)} size="md" />
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-wellness-muted">{p.bio}</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-stone-100 bg-stone-50/70 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-lavender-500" aria-hidden />
            <dd className="truncate font-semibold text-wellness-dark">{p.locality}</dd>
          </div>
          <div className="flex items-center gap-2">
            <WalletIcon className="h-3.5 w-3.5 shrink-0 text-sage-500" aria-hidden />
            <dd className="font-semibold text-wellness-dark">{rupees(p.budget)}/mo</dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarCheckIcon className="h-3.5 w-3.5 shrink-0 text-peach-500" aria-hidden />
            <dd className="truncate font-semibold text-wellness-dark">{monthDay(p.moveIn)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-lavender-200" aria-hidden />
            <dd className="truncate font-semibold text-wellness-dark">
              {titleCase(p.lifestyle.sleep)}
            </dd>
          </div>
        </dl>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {p.interests.slice(0, 4).map((interest) => (
            <li key={interest}>
              <Badge tone={match.sharedInterests.includes(interest) ? 'sage' : 'neutral'}>
                {interest}
              </Badge>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link to={`/app/discover/${p.id}`} className="flex-1">
            <Button variant="secondary" block>
              Why you matched
            </Button>
          </Link>
          {onRequest && (
            <Button
              variant="primary"
              className="flex-1"
              loading={pending}
              onClick={() => onRequest(match)}
              disabled={match.status === 'sent' || match.status === 'accepted'}
            >
              {match.status === 'sent'
                ? 'Request sent'
                : match.status === 'accepted'
                ? 'Matched'
                : 'Send request'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}