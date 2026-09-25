import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  BellIcon,
  HeartHandshakeIcon,
  HomeIcon,
  MessageCircleIcon,
  SparklesIcon } from
'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { RoommateCard } from '../../components/roommates/RoommateCard';
import { RoomCard } from '../../components/rooms/RoomCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { SkeletonCard } from '../../components/ui/States';
import { api } from '../../services/api';
import { notifications, profiles, rooms, threads } from '../../data/mock';
import { greeting, rupees } from '../../utils/format';
import type { MatchCandidate } from '../../types';

export function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);

  useEffect(() => {
    let alive = true;
    api.getMatches().then((m) => alive && setMatches(m));
    return () => {
      alive = false;
    };
  }, []);

  const top = matches?.filter((m) => m.status === 'suggested').slice(0, 2) ?? [];
  const incoming = matches?.filter((m) => m.status === 'incoming') ?? [];
  const unreadMessages = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div>
      <PageHeader
        eyebrow={`${greeting()}, ${user?.name.split(' ')[0]}`}
        title="Your flat-hunt at a glance"
        description="Two new people fit your lifestyle this week, and one request is waiting on you."
        action={
        <Link to="/app/discover">
            <Button variant="gradient" icon={<SparklesIcon className="h-4 w-4" aria-hidden />}>
              Discover roommates
            </Button>
          </Link>
        } />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Compatible roommates"
          value={matches?.length ?? '—'}
          hint="Above 70% compatibility"
          icon={<SparklesIcon className="h-5 w-5" aria-hidden />}
          to="/app/discover"
          tone="gradient" />
        
        <StatCard
          label="Match requests"
          value={incoming.length}
          hint="Waiting for your reply"
          icon={<HeartHandshakeIcon className="h-5 w-5" aria-hidden />}
          to="/app/matches" />
        
        <StatCard
          label="Unread messages"
          value={unreadMessages}
          hint={`${threads.length} active chats`}
          icon={<MessageCircleIcon className="h-5 w-5" aria-hidden />}
          to="/app/chat" />
        
        <StatCard
          label="Saved rooms"
          value={rooms.length}
          hint={`From ${rupees(11000)}/month`}
          icon={<HomeIcon className="h-5 w-5" aria-hidden />}
          to="/app/rooms"
          tone="mint" />
        
      </div>

      {user?.verification !== 'verified' &&
      <Card className="mt-6 border-violet-200 bg-violet-50/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-navy-900">
                {user?.verification === 'pending' ?
              'Your documents are under review' :
              'Get verified to unlock more matches'}
              </h2>
              <p className="mt-1 text-sm text-navy-600">
                Verified members appear 3× more often in discovery and can message room hosts directly.
              </p>
            </div>
            <Link to="/app/verification">
              <Button variant="secondary">
                {user?.verification === 'pending' ? 'Check status' : 'Verify now'}
              </Button>
            </Link>
          </div>
        </Card>
      }

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold text-navy-900">
              Top matches for you
            </h2>
            <Link to="/app/discover" className="text-sm font-bold text-violet-600 hover:text-violet-700">
              See all
            </Link>
          </div>
          <div className="grid gap-5">
            {!matches ?
            <>
                <SkeletonCard />
                <SkeletonCard />
              </> :

            top.map((m) => <RoommateCard key={m.profile.id} match={m} />)
            }
          </div>
        </section>

        <div className="space-y-6">
          {incoming[0] &&
          <Card>
              <CardHeader title="Request waiting" description="Reply within 7 days" />
              <div className="flex items-center gap-3">
                <Avatar
                name={incoming[0].profile.name}
                src={incoming[0].profile.avatar}
                size="sm" />
              
                <div className="min-w-0">
                  <p className="truncate font-bold text-navy-900">{incoming[0].profile.name}</p>
                  <p className="text-xs text-navy-500">
                    {incoming[0].score}% compatible · {incoming[0].requestedAt}
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-2xl bg-cream-200 p-3 text-sm text-navy-600">
                “{incoming[0].message}”
              </p>
              <Link to="/app/matches" className="mt-4 block">
                <Button variant="gradient" block icon={<ArrowRightIcon className="h-4 w-4" aria-hidden />}>
                  Review request
                </Button>
              </Link>
            </Card>
          }

          <Card>
            <CardHeader
              title="Recent activity"
              action={
              <Link to="/app/notifications" aria-label="All notifications">
                  <BellIcon className="h-4 w-4 text-navy-500" aria-hidden />
                </Link>
              } />
            
            <ul className="divide-y divide-cream-300">
              {notifications.slice(0, 4).map((n) =>
              <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                  <Link to={n.link} className="block">
                    <p className="text-sm font-semibold text-navy-900">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-navy-500">{n.body}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-navy-500/70">
                      {n.at}
                    </p>
                  </Link>
                </li>
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Your lifestyle snapshot" description="Used to rank every match" />
            <ul className="flex flex-wrap gap-1.5">
              <Badge tone="violet">Night owl</Badge>
              <Badge tone="mint">Tidy</Badge>
              <Badge tone="coral">Vegetarian</Badge>
              <Badge tone="neutral">Non-smoker</Badge>
              <Badge tone="neutral">Pet friendly</Badge>
              <Badge tone="neutral">Works from home</Badge>
            </ul>
            <Link to="/app/quiz" className="mt-4 block">
              <Button variant="secondary" block>
                Retake lifestyle quiz
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-extrabold text-navy-900">
            Rooms near {user?.city}
          </h2>
          <Link to="/app/rooms" className="text-sm font-bold text-violet-600 hover:text-violet-700">
            Browse all
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.slice(0, 3).map((room) =>
          <RoomCard key={room.id} room={room} />
          )}
        </div>
      </section>

      <section className="mt-8">
        <Card className="bg-navy-900 text-white">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {profiles.slice(0, 4).map((p) =>
                <img
                  key={p.id}
                  src={p.avatar}
                  alt={p.name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-navy-900" />

                )}
              </div>
              <div>
                <p className="font-display text-lg font-bold">
                  312 people in {user?.city} are looking this month
                </p>
                <p className="mt-0.5 text-sm text-cream-200/70">
                  Complete your profile to appear higher in their discovery feed.
                </p>
              </div>
            </div>
            <Link to="/app/profile">
              <Button variant="gradient">Complete profile</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>);

}