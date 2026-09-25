import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  LanguagesIcon,
  MapPinIcon,
  MessageCircleIcon,
  WalletIcon } from
'lucide-react';
import type { MatchCandidate } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { CompatibilityRing, ScoreBar } from '../../components/ui/CompatibilityRing';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { api } from '../../services/api';
import { monthDay, rupees, scoreTone, titleCase } from '../../utils/format';

export function WhyYouMatched() {
  const { profileId = '' } = useParams();
  const [match, setMatch] = useState<MatchCandidate | null | undefined>(undefined);
  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getMatches().then((list) => {
      if (!alive) return;
      setMatch(list.find((m) => m.profile.id === profileId) ?? null);
    });
    return () => {
      alive = false;
    };
  }, [profileId]);

  if (match === undefined) return <LoadingState label="Loading compatibility breakdown…" />;
  if (!match)
  return (
    <EmptyState
      title="Profile not found"
      description="This member may have paused their account."
      action={
      <Link to="/app/discover">
            <Button variant="gradient">Back to discover</Button>
          </Link>
      } />);



  const p = match.profile;
  const tone = scoreTone(match.score);

  async function sendRequest() {
    setPending(true);
    await api.updateMatch(p.id, 'request');
    setPending(false);
    setRequested(true);
  }

  return (
    <div>
      <Link
        to="/app/discover"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 transition-colors duration-150 ease-out hover:text-navy-900">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        Back to discover
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-violet-coral p-6 text-white shadow-lift sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <Avatar name={p.name} src={p.avatar} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {p.name}
                </h1>
                <VerificationBadge status={p.verification} className="bg-white/20 text-white ring-white/30" />
              </div>
              <p className="mt-1 text-sm text-white/85">
                {p.age} · {titleCase(p.gender)} · {p.occupation} at {p.company}
              </p>
              <p className="mt-0.5 text-sm text-white/70">{p.lastActive}</p>
            </div>
          </div>
          <div className="rounded-3xl bg-white/15 p-4 text-center backdrop-blur">
            <CompatibilityRing score={match.score} tone={tone} size="lg" />
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-white/80">
              Overall compatibility
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Why you matched"
              description="Each factor is scored against your own quiz answers." />
            
            <ul className="space-y-5">
              {match.factors.map((f) =>
              <li key={f.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-navy-900">{f.label}</h3>
                    <span className="font-display text-base font-extrabold text-violet-600">
                      {f.score}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <ScoreBar score={f.score} tone={f.score >= 88 ? 'mint' : f.score >= 75 ? 'violet' : 'coral'} />
                  </div>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-cream-200 px-3.5 py-2.5">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-navy-500">You</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-navy-800">{f.you}</dd>
                    </div>
                    <div className="rounded-2xl bg-violet-50 px-3.5 py-2.5">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-violet-500">
                        {p.name.split(' ')[0]}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-navy-800">{f.them}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-sm text-navy-500">{f.note}</p>
                </li>
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader title={`About ${p.name.split(' ')[0]}`} />
            <p className="text-sm leading-relaxed text-navy-600">{p.bio}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
              { icon: MapPinIcon, label: 'Looking in', value: `${p.locality}, ${p.city}` },
              { icon: WalletIcon, label: 'Budget', value: `${rupees(p.budget)}/month` },
              { icon: CalendarCheckIcon, label: 'Move-in', value: monthDay(p.moveIn) },
              { icon: BriefcaseIcon, label: 'Work', value: `${p.occupation}, ${p.company}` },
              { icon: LanguagesIcon, label: 'Languages', value: p.languages.join(', ') }].
              map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-start gap-3 rounded-2xl border border-cream-300 p-3.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-navy-500">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-navy-800">{row.value}</dd>
                    </div>
                  </div>);

              })}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Shared interests" />
            {match.sharedInterests.length > 0 ?
            <ul className="flex flex-wrap gap-1.5">
                {match.sharedInterests.map((i) =>
              <li key={i}>
                    <Badge tone="mint">{i}</Badge>
                  </li>
              )}
              </ul> :

            <p className="text-sm text-navy-500">
                No overlapping interests yet — lifestyle fit still scores {match.score}%.
              </p>
            }
            <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wide text-navy-500">
              All interests
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {p.interests.map((i) =>
              <li key={i}>
                  <Badge tone="neutral">{i}</Badge>
                </li>
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Lifestyle answers" />
            <dl className="space-y-2.5 text-sm">
              {Object.entries(p.lifestyle).map(([key, value]) =>
              <div key={key} className="flex items-center justify-between gap-3">
                  <dt className="text-navy-500">{titleCase(key)}</dt>
                  <dd className="font-semibold text-navy-800">
                    {typeof value === 'boolean' ? value ? 'Yes' : 'No' : titleCase(String(value))}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="sticky top-24">
            {requested || match.status === 'sent' ?
            <p className="rounded-2xl bg-mint-50 p-4 text-sm font-semibold text-mint-600">
                Request sent. You will be notified when {p.name.split(' ')[0]} replies.
              </p> :
            match.status === 'accepted' ?
            <Link to="/app/chat/t1">
                <Button variant="gradient" block icon={<MessageCircleIcon className="h-4 w-4" aria-hidden />}>
                  Open chat
                </Button>
              </Link> :

            <Button variant="gradient" block size="lg" loading={pending} onClick={sendRequest}>
                Send match request
              </Button>
            }
            <p className="mt-3 text-center text-xs text-navy-500">
              Chat unlocks once both of you accept.
            </p>
          </Card>
        </div>
      </div>
    </div>);

}