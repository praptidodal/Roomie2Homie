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
  pending




}: {match: MatchCandidate;onRequest?: (m: MatchCandidate) => void;pending?: boolean;}) {
  const p = match.profile;
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-soft transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-violet-200 hover:shadow-lift">
      <div className="h-1.5 w-full bg-violet-coral" aria-hidden />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <Avatar name={p.name} src={p.avatar} size="md" ring />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold text-navy-900">{p.name}</h3>
                <VerificationBadge status={p.verification} />
              </div>
              <p className="mt-0.5 text-sm text-navy-500">
                {p.age} · {titleCase(p.gender)} · {p.lastActive}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-600">
                <BriefcaseIcon className="h-4 w-4 text-navy-500/70" aria-hidden />
                {p.occupation} at {p.company}
              </p>
            </div>
          </div>
          <CompatibilityRing score={match.score} tone={scoreTone(match.score)} size="md" />
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-navy-600">{p.bio}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-cream-200 p-3.5 text-sm">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
            <dd className="truncate font-semibold text-navy-800">{p.locality}</dd>
          </div>
          <div className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4 shrink-0 text-mint-500" aria-hidden />
            <dd className="font-semibold text-navy-800">{rupees(p.budget)}/mo</dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarCheckIcon className="h-4 w-4 shrink-0 text-coral-400" aria-hidden />
            <dd className="truncate font-semibold text-navy-800">{monthDay(p.moveIn)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 shrink-0 rounded-full bg-violet-200" aria-hidden />
            <dd className="truncate font-semibold text-navy-800">
              {titleCase(p.lifestyle.sleep)}
            </dd>
          </div>
        </dl>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {p.interests.slice(0, 4).map((interest) =>
          <li key={interest}>
              <Badge tone={match.sharedInterests.includes(interest) ? 'violet' : 'neutral'}>
                {interest}
              </Badge>
            </li>
          )}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/app/discover/${p.id}`} className="flex-1">
            <Button variant="secondary" block>
              Why you matched
            </Button>
          </Link>
          {onRequest &&
          <Button
            variant="gradient"
            className="flex-1"
            loading={pending}
            onClick={() => onRequest(match)}
            disabled={match.status === 'sent' || match.status === 'accepted'}>
            
              {match.status === 'sent' ?
            'Request sent' :
            match.status === 'accepted' ?
            'Matched' :
            'Send request'}
            </Button>
          }
        </div>
      </div>
    </article>);

}