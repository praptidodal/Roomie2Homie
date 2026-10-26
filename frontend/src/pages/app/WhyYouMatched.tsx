import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  LanguagesIcon,
  MapPinIcon,
  MessageCircleIcon,
  WalletIcon,
  SparklesIcon,
} from 'lucide-react';
import type { MatchCandidate } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { CompatibilityRing, ScoreBar } from '../../components/ui/CompatibilityRing';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { monthDay, rupees, scoreTone, titleCase } from '../../utils/format';

export function WhyYouMatched() {
  const { user } = useAuth();
  const { profileId = '' } = useParams();
  const [match, setMatch] = useState<MatchCandidate | null | undefined>(undefined);
  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);

  const isSelf = Boolean(user && profileId && (user.id === profileId || (user as any)._id === profileId));

  // Resolve chat thread if match is already accepted
  useEffect(() => {
    if (isSelf) return;
    if (match?.status === 'accepted' && match?.profile?.id) {
      let alive = true;
      api
        .getChatThreads()
        .then((threads) => {
          if (!alive) return;
          const found = threads.find((t) => t.participantId === match.profile.id);
          if (found) {
            setChatThreadId(found.id);
          }
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }
  }, [isSelf, match?.status, match?.profile?.id]);

  // Fetch real match breakdown details from backend API
  useEffect(() => {
    if (isSelf) {
      setMatch(null);
      return;
    }
    let alive = true;
    api
      .getMatchDetail(profileId)
      .then((res) => {
        if (!alive) return;
        setMatch(res ?? null);
      })
      .catch(() => {
        if (alive) setMatch(null);
      });
    return () => {
      alive = false;
    };
  }, [isSelf, profileId]);

  if (isSelf) {
    return (
      <EmptyState
        title="This is your own profile"
        description="Compatibility calculations are designed for prospective flatmates and hosts. You cannot view compatibility with yourself."
        action={
          <Link to="/app/profile">
            <Button variant="primary">View your profile</Button>
          </Link>
        }
      />
    );
  }

  if (match === undefined) {
    return <LoadingState label="Loading compatibility breakdown…" />;
  }

  if (!match) {
    return (
      <EmptyState
        title="Profile not found"
        description="This member may have paused their account or does not exist."
        action={
          <Link to="/app/discover">
            <Button variant="primary">Back to discover</Button>
          </Link>
        }
      />
    );
  }

  const p = match.profile;
  const tone = scoreTone(match.score);

  // Send real match request to this candidate
  async function sendRequest() {
    setPending(true);
    try {
      await api.sendMatchRequest(p.id);
      setRequested(true);
      setMatch((prev) => (prev ? { ...prev, status: 'sent' } : prev));
    } catch (err: any) {
      alert(err?.message || 'Failed to send match request.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      {/* Ambient background blobs */}
      <FloatingBlob tone="sage" size="lg" className="-top-16 -left-20 opacity-70" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-60" />

      {/* Back navigation pill */}
      <div className="mb-6">
        <Link
          to="/app/discover"
          className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/90 px-4 py-2 text-xs font-medium text-wellness-muted transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-wellness-dark shadow-soft active:scale-[0.98]"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to discover</span>
        </Link>
      </div>

      {/* Profile & Match Hero Card */}
      <RevealOnScroll>
        <div className="overflow-hidden rounded-[2.5rem] border border-stone-200/80 bg-white/95 p-6 shadow-floating backdrop-blur-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-5">
              <Avatar name={p.name} src={p.avatar} size="xl" ring />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-wellness-dark">
                    {p.name}
                  </h1>
                  <VerificationBadge status={p.verification} />
                </div>
                <p className="mt-1 text-xs sm:text-sm text-wellness-muted">
                  {[p.age, p.gender && p.gender !== 'prefer_not_to_say' ? titleCase(p.gender) : null, [p.occupation, p.company].filter(Boolean).join(' at ')].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-0.5 text-xs text-stone-400">{p.lastActive}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-3xl border border-stone-200/70 bg-white/90 p-4 shadow-soft backdrop-blur-sm">
              <CompatibilityRing score={match.score} tone={tone} size="lg" />
              <div className="text-left pr-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-wellness-muted">
                  Lifestyle match
                </p>
                <p className="font-display text-base font-bold text-wellness-dark tracking-tight">
                  {match.score}% compatible
                </p>
                <p className="font-handwriting text-xl text-peach-500 font-normal">
                  {match.score >= 85 ? 'strong daily alignment' : 'balanced lifestyle fit'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Main Grid: Breakdown on left, details and CTA on right */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          {/* Factor Breakdown */}
          <RevealOnScroll delay={80}>
            <Card className="rounded-4xl border border-stone-200/70 bg-white/95 p-7 shadow-soft">
              <CardHeader
                title="Why you matched"
                description="Each factor is scored directly against your own quiz answers."
              />

              <ul className="space-y-6">
                {match.factors.map((f) => (
                  <li key={f.label} className="border-b border-stone-100 pb-5 last:border-b-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-base font-bold text-wellness-dark tracking-tight">
                        {f.label}
                      </h3>
                      <span className="font-display text-sm font-bold text-wellness-dark">
                        {f.score}%
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <ScoreBar
                        score={f.score}
                        tone={f.score >= 88 ? 'mint' : f.score >= 75 ? 'violet' : 'coral'}
                      />
                    </div>

                    <dl className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
                      <div className="rounded-2xl border border-stone-200/60 bg-stone-50/80 px-4 py-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-wellness-muted">
                          You
                        </dt>
                        <dd className="mt-0.5 text-xs font-semibold text-wellness-dark">{f.you}</dd>
                      </div>
                      <div className="rounded-2xl border border-sage-200/70 bg-sage-50/80 px-4 py-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-sage-700">
                          {p.name.split(' ')[0]}
                        </dt>
                        <dd className="mt-0.5 text-xs font-semibold text-wellness-dark">{f.them}</dd>
                      </div>
                    </dl>

                    <p className="mt-2.5 text-xs text-wellness-muted leading-relaxed">{f.note}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </RevealOnScroll>

          {/* About Candidate */}
          <RevealOnScroll delay={140}>
            <Card className="rounded-4xl border border-stone-200/70 bg-white/95 p-7 shadow-soft">
              <CardHeader title={`About ${p.name.split(' ')[0]}`} />
              <p className="text-sm leading-relaxed text-wellness-muted">{p.bio}</p>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: MapPinIcon, label: 'Looking in', value: `${p.locality}, ${p.city}` },
                  { icon: WalletIcon, label: 'Budget', value: `${rupees(p.budget)}/month` },
                  { icon: CalendarCheckIcon, label: 'Move-in', value: monthDay(p.moveIn) },
                  { icon: BriefcaseIcon, label: 'Work', value: `${p.occupation}, ${p.company}` },
                  { icon: LanguagesIcon, label: 'Languages', value: p.languages.join(', ') },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-stone-50/70 p-3.5"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-peach-500" aria-hidden="true" />
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-wellness-muted">
                          {row.label}
                        </dt>
                        <dd className="mt-0.5 text-xs font-semibold text-wellness-dark">
                          {row.value}
                        </dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </Card>
          </RevealOnScroll>
        </div>

        {/* Right Column: Interests, Lifestyle & Sticky CTA */}
        <div className="space-y-6">
          {/* Shared Interests */}
          <RevealOnScroll delay={100}>
            <Card className="rounded-4xl border border-stone-200/70 bg-white/95 p-7 shadow-soft">
              <CardHeader title="Shared interests" />
              {match.sharedInterests.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {match.sharedInterests.map((i) => (
                    <li key={i}>
                      <Badge tone="sage">{i}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-wellness-muted">
                  No overlapping interests yet — lifestyle fit still scores {match.score}%.
                </p>
              )}

              <h3 className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-wellness-muted">
                All interests
              </h3>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {p.interests.map((i) => (
                  <li key={i}>
                    <Badge tone="neutral">{i}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </RevealOnScroll>

          {/* Lifestyle Answers */}
          <RevealOnScroll delay={160}>
            <Card className="rounded-4xl border border-stone-200/70 bg-white/95 p-7 shadow-soft">
              <CardHeader title="Lifestyle answers" />
              <dl className="space-y-3 text-xs">
                {Object.entries(p.lifestyle).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2.5 last:border-b-0 last:pb-0">
                    <dt className="text-wellness-muted">{titleCase(key)}</dt>
                    <dd className="font-semibold text-wellness-dark">
                      {typeof value === 'boolean'
                        ? value
                          ? 'Yes'
                          : 'No'
                        : titleCase(String(value))}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </RevealOnScroll>

          {/* Sticky Match Action CTA */}
          <RevealOnScroll delay={200}>
            <Card className="sticky top-24 rounded-4xl border border-stone-200/70 bg-white/95 p-6 shadow-floating backdrop-blur-sm">
              {requested || match.status === 'sent' ? (
                <div className="rounded-2xl border border-sage-200/80 bg-sage-50 p-4 text-center text-xs font-semibold text-stone-700">
                  <span className="flex items-center justify-center gap-1.5">
                    <SparklesIcon className="h-4 w-4 text-sage-600" aria-hidden="true" />
                    Request sent
                  </span>
                  <p className="mt-1 font-normal text-wellness-muted">
                    You will be notified when {p.name.split(' ')[0]} replies.
                  </p>
                </div>
              ) : match.status === 'accepted' ? (
                <Link to={chatThreadId ? `/app/chat/${chatThreadId}` : '/app/chat'}>
                  <Button
                    variant="primary"
                    block
                    icon={<MessageCircleIcon className="h-4 w-4" aria-hidden="true" />}
                  >
                    Open chat
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  block
                  size="lg"
                  loading={pending}
                  onClick={sendRequest}
                >
                  Send match request
                </Button>
              )}
              <p className="mt-3 text-center text-[11px] text-wellness-muted">
                Chat unlocks once both of you accept.
              </p>
            </Card>
          </RevealOnScroll>
        </div>
      </div>
    </div>
  );
}