import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  FlagIcon,
  HomeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  XIcon } from
'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../../components/layout/Logo';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { api } from '../../services/api';
import { adminStats, profiles } from '../../data/mock';
import { rupeesShort } from '../../utils/format';

type Stats = typeof adminStats;

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState(adminStats.queue);
  const [decision, setDecision] = useState<{id: string;name: string;approve: boolean;} | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    // TODO: GET /api/admin/stats
    api.getAdminStats().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, []);

  const maxBar = Math.max(...adminStats.weekly.map((d) => d.matches));

  async function resolve() {
    if (!decision) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 450));
    setQueue((prev) => prev.filter((q) => q.id !== decision.id));
    setBusy(false);
    setDecision(null);
  }

  if (!stats) return <LoadingState label="Loading platform metrics…" />;

  return (
    <div className="min-h-screen w-full bg-cream-200">
      <header className="sticky top-0 z-40 border-b border-cream-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo to="/admin" />
            <Badge tone="navy" className="hidden sm:inline-flex">
              <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
              Admin console
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/dashboard"
              className="hidden items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-violet-700 sm:flex">
              
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Member view
            </Link>
            <Avatar name={user?.name ?? 'Admin'} src={user?.avatar} size="sm" />
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Overview"
          title="Platform health"
          description="Signups, matches, verification queue and flagged content across all cities." />
        

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total members"
            value={stats.totals.users.toLocaleString('en-IN')}
            hint={`${stats.totals.activeToday.toLocaleString('en-IN')} active today`}
            icon={<UsersIcon className="h-5 w-5" aria-hidden />}
            tone="gradient" />
          
          <StatCard
            label="Matches made"
            value={stats.totals.matchesMade.toLocaleString('en-IN')}
            hint="Accepted both ways"
            icon={<SparklesIcon className="h-5 w-5" aria-hidden />} />
          
          <StatCard
            label="Live rooms"
            value={stats.totals.rooms.toLocaleString('en-IN')}
            hint={`Revenue ${rupeesShort(stats.totals.revenue)} this month`}
            icon={<HomeIcon className="h-5 w-5" aria-hidden />} />
          
          <StatCard
            label="Pending verifications"
            value={stats.totals.pendingVerifications}
            hint={`${stats.totals.verifiedUsers.toLocaleString('en-IN')} verified so far`}
            icon={<ShieldCheckIcon className="h-5 w-5" aria-hidden />}
            tone="mint" />
          
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader
              title="This week"
              description="Signups and completed matches per day." />
            
            <div className="flex items-end gap-3 sm:gap-5">
              {stats.weekly.map((d) =>
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end justify-center gap-1">
                    <div
                    className="w-1/3 rounded-t-lg bg-violet-500"
                    style={{ height: `${d.signups / maxBar * 100}%` }}
                    title={`${d.signups} signups`} />
                  
                    <div
                    className="w-1/3 rounded-t-lg bg-coral-400"
                    style={{ height: `${d.matches / maxBar * 100}%` }}
                    title={`${d.matches} matches`} />
                  
                  </div>
                  <span className="text-xs font-semibold text-navy-500">{d.day}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-5 border-t border-cream-300 pt-4 text-xs font-semibold">
              <span className="flex items-center gap-2 text-navy-600">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" aria-hidden />
                Signups
              </span>
              <span className="flex items-center gap-2 text-navy-600">
                <span className="h-2.5 w-2.5 rounded-full bg-coral-400" aria-hidden />
                Matches
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Members by city" />
            <ul className="space-y-4">
              {stats.cityMix.map((c) =>
              <li key={c.city}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-navy-800">{c.city}</span>
                    <span className="font-bold text-navy-900">{c.users.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-300">
                    <div
                    className="h-full rounded-full bg-violet-coral"
                    style={{ width: `${c.users / stats.cityMix[0].users * 100}%` }} />
                  
                  </div>
                </li>
              )}
            </ul>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader
              title="Verification queue"
              description="Approve or reject submitted documents." />
            
            {queue.length === 0 ?
            <EmptyState title="Queue is clear" description="No documents waiting for review." /> :

            <ul className="divide-y divide-cream-300">
                {queue.map((q, i) =>
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={q.name} src={profiles[i % profiles.length]?.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-navy-900">{q.name}</p>
                        <p className="truncate text-xs text-navy-500">
                          {q.doc} · {q.city} · {q.at}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                    size="sm"
                    variant="gradient"
                    icon={<CheckIcon className="h-4 w-4" aria-hidden />}
                    onClick={() => setDecision({ id: q.id, name: q.name, approve: true })}>
                    
                        Approve
                      </Button>
                      <Button
                    size="sm"
                    variant="ghost"
                    className="text-coral-500 hover:bg-coral-50"
                    icon={<XIcon className="h-4 w-4" aria-hidden />}
                    onClick={() => setDecision({ id: q.id, name: q.name, approve: false })}>
                    
                        Reject
                      </Button>
                    </div>
                  </li>
              )}
              </ul>
            }
          </Card>

          <Card>
            <CardHeader title="Flagged content" description={`${stats.totals.reports} open reports`} />
            <ul className="divide-y divide-cream-300">
              {adminStats.flagged.map((f) =>
              <li key={f.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone="coral">
                          <FlagIcon className="h-3.5 w-3.5" aria-hidden />
                          {f.type}
                        </Badge>
                        <span className="text-xs text-navy-500">{f.at}</span>
                      </div>
                      <p className="mt-2 font-semibold text-navy-900">{f.subject}</p>
                      <p className="mt-0.5 text-sm text-navy-500">{f.reason}</p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Review
                    </Button>
                  </div>
                </li>
              )}
            </ul>
          </Card>
        </div>

        <Card className="mt-6" padded={false}>
          <div className="px-6 pt-6">
            <CardHeader title="Recent members" description="Newest signups across all cities." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-cream-200 text-xs font-bold uppercase tracking-wide text-navy-500">
                <tr>
                  <th scope="col" className="px-6 py-3">Member</th>
                  <th scope="col" className="px-6 py-3">City</th>
                  <th scope="col" className="px-6 py-3">Budget</th>
                  <th scope="col" className="px-6 py-3">Verification</th>
                  <th scope="col" className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {profiles.map((p) =>
                <tr key={p.id} className="hover:bg-cream-200/60">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} src={p.avatar} size="xs" />
                        <div>
                          <p className="font-semibold text-navy-900">{p.name}</p>
                          <p className="text-xs text-navy-500">{p.occupation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-navy-600">{p.city}</td>
                    <td className="px-6 py-3.5 font-semibold text-navy-800">
                      ₹{p.budget.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                      tone={
                      p.verification === 'verified' ?
                      'mint' :
                      p.verification === 'pending' ?
                      'amber' :
                      'neutral'
                      }>
                      
                        {p.verification === 'verified' ?
                      'Verified' :
                      p.verification === 'pending' ?
                      'In review' :
                      'Unverified'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-navy-600">{p.joinedAt}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.approve ? 'Approve verification?' : 'Reject verification?'}
        description={
        decision?.approve ?
        `${decision?.name} will get a verified badge immediately.` :
        `${decision?.name} will be asked to upload a clearer document.`
        }
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
            variant={decision?.approve ? 'gradient' : 'coral'}
            loading={busy}
            onClick={resolve}>
            
              {decision?.approve ? 'Approve' : 'Reject'}
            </Button>
          </>
        } />
      
    </div>);

}