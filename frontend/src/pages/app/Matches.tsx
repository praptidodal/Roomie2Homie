import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, HeartHandshakeIcon, MessageCircleIcon, XIcon } from 'lucide-react';
import type { MatchCandidate, MatchStatus } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CompatibilityRing } from '../../components/ui/CompatibilityRing';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../../components/ui/States';
import { api } from '../../services/api';
import { rupees, scoreTone } from '../../utils/format';

const tabs: Array<{key: MatchStatus | 'all';label: string;}> = [
{ key: 'incoming', label: 'Requests received' },
{ key: 'sent', label: 'Requests sent' },
{ key: 'accepted', label: 'Accepted' },
{ key: 'declined', label: 'Declined' }];


export function Matches() {
  const [list, setList] = useState<MatchCandidate[] | null>(null);
  const [tab, setTab] = useState<MatchStatus | 'all'>('incoming');
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<MatchCandidate | null>(null);

  useEffect(() => {
    let alive = true;
    api.getMatches().then((m) => alive && setList(m));
    return () => {
      alive = false;
    };
  }, []);

  const rows = (list ?? []).filter((m) => m.status === tab);

  async function decide(match: MatchCandidate, action: 'accept' | 'decline') {
    setBusy(match.profile.id);
    await api.updateMatch(match.profile.id, action);
    setList(
      (prev) =>
      prev?.map((m) =>
      m.profile.id === match.profile.id ?
      { ...m, status: action === 'accept' ? 'accepted' : 'declined' } :
      m
      ) ?? null
    );
    setBusy(null);
    setDeclining(null);
  }

  const counts = (key: MatchStatus | 'all') => (list ?? []).filter((m) => m.status === key).length;

  return (
    <div>
      <PageHeader
        eyebrow="Matches"
        title="Requests and accepted roommates"
        description="Accepting a request opens a chat so you can plan flat visits together." />
      

      <div
        role="tablist"
        aria-label="Match status"
        className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-cream-300 bg-white p-1.5">
        
        {tabs.map((t) =>
        <button
          key={t.key}
          role="tab"
          aria-selected={tab === t.key}
          onClick={() => setTab(t.key)}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out ${
          tab === t.key ? 'bg-navy-900 text-white' : 'text-navy-600 hover:bg-cream-200'}`
          }>
          
            {t.label}
            <span
            className={`rounded-full px-1.5 text-xs font-bold ${
            tab === t.key ? 'bg-white/20' : 'bg-cream-200 text-navy-600'}`
            }>
            
              {counts(t.key)}
            </span>
          </button>
        )}
      </div>

      {!list ?
      <div className="grid gap-5 xl:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div> :
      rows.length === 0 ?
      <EmptyState
        icon={<HeartHandshakeIcon className="h-6 w-6" aria-hidden />}
        title={
        tab === 'incoming' ?
        'No requests waiting' :
        tab === 'sent' ?
        'You have not sent any requests yet' :
        tab === 'accepted' ?
        'No accepted matches yet' :
        'Nothing declined'
        }
        description="Discovery refreshes every morning with new people who fit your lifestyle."
        action={
        <Link to="/app/discover">
              <Button variant="gradient">Discover roommates</Button>
            </Link>
        } /> :


      <ul className="grid gap-5 xl:grid-cols-2">
          {rows.map((m) =>
        <Card as="li" key={m.profile.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  <Avatar name={m.profile.name} src={m.profile.avatar} ring />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-navy-900">
                        {m.profile.name}
                      </h2>
                      <VerificationBadge status={m.profile.verification} />
                    </div>
                    <p className="mt-0.5 text-sm text-navy-500">
                      {m.profile.occupation} · {m.profile.locality}
                    </p>
                    <p className="mt-0.5 text-sm text-navy-500">
                      {rupees(m.profile.budget)}/mo · {m.requestedAt ?? m.profile.lastActive}
                    </p>
                  </div>
                </div>
                <CompatibilityRing score={m.score} tone={scoreTone(m.score)} size="sm" />
              </div>

              {m.message &&
          <p className="mt-4 rounded-2xl bg-cream-200 p-3.5 text-sm leading-relaxed text-navy-600">
                  “{m.message}”
                </p>
          }

              {m.sharedInterests.length > 0 &&
          <ul className="mt-4 flex flex-wrap gap-1.5">
                  {m.sharedInterests.map((i) =>
            <li key={i}>
                      <Badge tone="violet">{i}</Badge>
                    </li>
            )}
                </ul>
          }

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/app/discover/${m.profile.id}`} className="flex-1">
                  <Button variant="secondary" block>
                    View breakdown
                  </Button>
                </Link>
                {m.status === 'incoming' &&
            <>
                    <Button
                variant="gradient"
                className="flex-1"
                loading={busy === m.profile.id}
                icon={<CheckIcon className="h-4 w-4" aria-hidden />}
                onClick={() => decide(m, 'accept')}>
                
                      Accept
                    </Button>
                    <Button
                variant="ghost"
                className="text-coral-500 hover:bg-coral-50"
                icon={<XIcon className="h-4 w-4" aria-hidden />}
                onClick={() => setDeclining(m)}>
                
                      Decline
                    </Button>
                  </>
            }
                {m.status === 'accepted' &&
            <Link to="/app/chat/t1" className="flex-1">
                    <Button variant="gradient" block icon={<MessageCircleIcon className="h-4 w-4" aria-hidden />}>
                      Open chat
                    </Button>
                  </Link>
            }
                {m.status === 'sent' &&
            <Button variant="ghost" className="flex-1" disabled>
                    Awaiting reply
                  </Button>
            }
              </div>
            </Card>
        )}
        </ul>
      }

      <Modal
        open={!!declining}
        onClose={() => setDeclining(null)}
        title={`Decline ${declining?.profile.name.split(' ')[0]}'s request?`}
        description="They will not be notified with a reason, and the profile moves to your declined list."
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setDeclining(null)}>
              Keep request
            </Button>
            <Button
            variant="coral"
            loading={busy === declining?.profile.id}
            onClick={() => declining && decide(declining, 'decline')}>
            
              Decline request
            </Button>
          </>
        } />
      
    </div>);

}