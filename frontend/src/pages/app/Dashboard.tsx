import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  BellIcon,
  HeartHandshakeIcon,
  HomeIcon,
  MessageCircleIcon,
  SparklesIcon,
} from 'lucide-react';
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
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { api, BackendUserResponse } from '../../services/api';
import { greeting, rupees } from '../../utils/format';
import type { AppNotification, MatchCandidate, Room } from '../../types';

export function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);
  const [nearbyRooms, setNearbyRooms] = useState<Room[] | null>(null);
  const [myRooms, setMyRooms] = useState<Room[] | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[] | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [backendUser, setBackendUser] = useState<BackendUserResponse | null>(null);

  useEffect(() => {
    let alive = true;

    // Load matches & discover candidates
    Promise.all([
      api.getDiscoverCandidates({ city: user?.city }),
      api.getMyMatches(),
    ])
      .then(([discover, myMatches]) => {
        if (!alive) return;
        setMatches([
          ...myMatches,
          ...discover.filter((d) => !myMatches.some((m) => m.profile.id === d.profile.id)),
        ]);
      })
      .catch(() => {
        if (alive) setMatches([]);
      });

    // Load rooms in city
    api.getRooms({ city: user?.city }).then((r) => alive && setNearbyRooms(r));

    // Load user's own listings
    api.getMyRooms().then((r) => alive && setMyRooms(r)).catch(() => {
      if (alive) setMyRooms([]);
    });

    // Load notifications
    api.getNotifications().then((n) => alive && setRecentNotifications(n)).catch(() => {});

    // Load chat threads
    api.getChatThreads().then((t) => alive && setThreads(t)).catch(() => {});

    // Load real backend profile for lifestyle snapshot
    api.getMe().then((me) => alive && setBackendUser(me)).catch(() => {});

    return () => {
      alive = false;
    };
  }, [user?.city]);

  const top = matches?.filter((m) => m.status === 'suggested').slice(0, 2) ?? [];
  const incoming = matches?.filter((m) => m.status === 'incoming') ?? [];
  const unreadMessages = threads.reduce((sum, t) => sum + (t.unread || 0), 0);

  const lifestyle = backendUser?.lifestyle;
  const hasLifestyle = Boolean(
    lifestyle && (lifestyle.sleep || lifestyle.cleanliness || lifestyle.food || lifestyle.social)
  );

  return (
    <div className="relative">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-60" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-50" />

      <PageHeader
        eyebrow={`${greeting()}, ${user?.name.split(' ')[0] ?? 'there'}`}
        title="Your flat-hunt at a glance"
        description={
          incoming.length > 0
            ? `You have ${incoming.length} match request${incoming.length === 1 ? '' : 's'} waiting on your reply.`
            : 'Track your compatible roommate matches, room listings, and active conversations in one place.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/app/rooms/create">
              <Button variant="secondary" icon={<HomeIcon className="h-4 w-4" aria-hidden />}>
                List a room
              </Button>
            </Link>
            <Link to="/app/discover">
              <Button variant="primary" icon={<SparklesIcon className="h-4 w-4" aria-hidden />}>
                Discover roommates
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Compatible roommates"
          value={matches?.length ?? '—'}
          hint="Candidates in your city"
          icon={<SparklesIcon className="h-5 w-5" aria-hidden />}
          to="/app/discover"
          tone="plain"
        />

        <StatCard
          label="Match requests"
          value={incoming.length}
          hint={incoming.length === 1 ? '1 request waiting' : `${incoming.length} waiting on reply`}
          icon={<HeartHandshakeIcon className="h-5 w-5" aria-hidden />}
          to="/app/matches"
        />

        <StatCard
          label="Unread messages"
          value={unreadMessages}
          hint={`${threads.length} active conversation${threads.length === 1 ? '' : 's'}`}
          icon={<MessageCircleIcon className="h-5 w-5" aria-hidden />}
          to="/app/chat"
        />

        <StatCard
          label="Rooms nearby"
          value={nearbyRooms?.length ?? '—'}
          hint={
            nearbyRooms && nearbyRooms.length > 0
              ? `From ${rupees(Math.min(...nearbyRooms.map((r) => r.rent)))}/mo`
              : 'Browse all rooms'
          }
          icon={<HomeIcon className="h-5 w-5" aria-hidden />}
          to="/app/rooms"
          tone="mint"
        />
      </div>

      {/* Verification prompt banner */}
      {user?.verification !== 'verified' && (
        <Card className="mt-6 border-sage-200/80 bg-sage-50/60 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-wellness-dark">
                {user?.verification === 'pending'
                  ? 'Your verification is under review'
                  : 'Get verified to build trust with roommates'}
              </h2>
              <p className="mt-1 text-xs text-wellness-muted">
                Verified community members appear with a verified badge in discovery and search.
              </p>
            </div>
            <Link to="/app/verification">
              <Button variant="secondary" size="sm">
                {user?.verification === 'pending' ? 'Check status' : 'Verify now'}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Listing state banner: conditional on whether user has rooms */}
      {myRooms && myRooms.length > 0 ? (
        <Card className="mt-6 border-sage-200/80 bg-sage-50/60 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="sage">{myRooms.length} active {myRooms.length === 1 ? 'listing' : 'listings'}</Badge>
                <h2 className="font-display text-base font-bold text-wellness-dark">
                  Manage your room listings
                </h2>
              </div>
              <p className="mt-1 text-xs text-wellness-muted">
                View incoming room enquiries, check listing status, or post an additional room.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/app/rooms/mine">
                <Button variant="secondary" size="sm">
                  My listings
                </Button>
              </Link>
              <Link to="/app/rooms/create">
                <Button variant="primary" size="sm" icon={<HomeIcon className="h-3.5 w-3.5" aria-hidden />}>
                  + List a room
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : myRooms && myRooms.length === 0 ? (
        <Card className="mt-6 border-stone-200/80 bg-stone-50/70 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-wellness-dark">
                Have a spare room or flat to share?
              </h2>
              <p className="mt-1 text-xs text-wellness-muted">
                List your space to connect directly with verified, lifestyle-compatible roommates in {user?.city || 'your area'}.
              </p>
            </div>
            <Link to="/app/rooms/create">
              <Button variant="secondary" size="sm" icon={<HomeIcon className="h-3.5 w-3.5" aria-hidden />}>
                List a room
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {/* Main Grid: Matches on Left, Activity & Snapshot on Right */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Top Matches */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-wellness-dark">
              Top matches for you
            </h2>
            <Link to="/app/discover" className="text-xs font-semibold text-sage-700 hover:text-sage-800 transition-colors">
              See all →
            </Link>
          </div>
          <div className="grid gap-5">
            {!matches ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : top.length === 0 ? (
              <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-8 text-center text-xs text-wellness-muted">
                <p className="font-semibold text-wellness-dark text-sm">No new suggested matches right now.</p>
                <p className="mt-1">Browse all roommate candidates in your area to connect.</p>
                <Link to="/app/discover" className="mt-4 inline-block">
                  <Button variant="secondary" size="sm">
                    Browse discovery
                  </Button>
                </Link>
              </Card>
            ) : (
              <RevealOnScroll>
                <div className="space-y-4">
                  {top.map((m) => (
                    <RoommateCard key={m.profile.id} match={m} />
                  ))}
                </div>
              </RevealOnScroll>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Incoming match request preview */}
          {incoming[0] && (
            <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-soft backdrop-blur-sm">
              <CardHeader title="Request waiting" description="Reply to connect" />
              <div className="flex items-center gap-3">
                <Avatar
                  name={incoming[0].profile.name}
                  src={incoming[0].profile.avatar}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-sm text-wellness-dark">{incoming[0].profile.name}</p>
                  <p className="text-xs text-wellness-muted">
                    {incoming[0].score}% compatible · {incoming[0].requestedAt || 'Recent'}
                  </p>
                </div>
              </div>
              {incoming[0].message && (
                <p className="mt-3 rounded-2xl bg-stone-50 border border-stone-100 p-3 text-xs text-stone-700 leading-relaxed italic">
                  &quot;{incoming[0].message}&quot;
                </p>
              )}
              <Link to="/app/matches" className="mt-4 block">
                <Button variant="primary" block size="sm" icon={<ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />}>
                  Review request
                </Button>
              </Link>
            </Card>
          )}

          {/* Recent Notifications / Activity */}
          <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-soft backdrop-blur-sm">
            <CardHeader
              title="Recent activity"
              action={
                <Link to="/app/notifications" aria-label="All notifications" className="text-wellness-muted hover:text-wellness-dark transition-colors">
                  <BellIcon className="h-4 w-4" aria-hidden />
                </Link>
              }
            />

            {!recentNotifications || recentNotifications.length === 0 ? (
              <p className="py-3 text-xs text-wellness-muted">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {recentNotifications.slice(0, 4).map((n) => (
                  <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                    <Link to={n.link || '/app/notifications'} className="block group">
                      <p className="text-xs sm:text-sm font-semibold text-wellness-dark group-hover:text-stone-900 transition-colors">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-wellness-muted">{n.body}</p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                        {n.at}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Lifestyle snapshot card - derived from real backend user data */}
          <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-soft backdrop-blur-sm">
            <CardHeader title="Your lifestyle snapshot" description="Preferences used to rank compatibility" />
            {hasLifestyle ? (
              <ul className="flex flex-wrap gap-1.5">
                {lifestyle?.sleep && (
                  <Badge tone="lavender">
                    Sleep: {String(lifestyle.sleep).replace('_', ' ')}
                  </Badge>
                )}
                {lifestyle?.cleanliness && (
                  <Badge tone="sage">
                    Tidiness: {String(lifestyle.cleanliness).replace('_', ' ')}
                  </Badge>
                )}
                {lifestyle?.food && (
                  <Badge tone="peach">
                    Food: {String(lifestyle.food).replace('_', ' ')}
                  </Badge>
                )}
                {lifestyle?.social && (
                  <Badge tone="neutral">
                    Social: {String(lifestyle.social).replace('_', ' ')}
                  </Badge>
                )}
                {lifestyle?.pets !== undefined && (
                  <Badge tone="neutral">
                    {lifestyle.pets ? 'Pets welcome' : 'No pets'}
                  </Badge>
                )}
                {lifestyle?.workFromHome !== undefined && (
                  <Badge tone="neutral">
                    {lifestyle.workFromHome ? 'Works from home' : 'Works on site'}
                  </Badge>
                )}
              </ul>
            ) : (
              <p className="text-xs text-wellness-muted">
                You haven&apos;t completed the lifestyle quiz yet. Take the quiz to match based on sleep, cleanliness, and diet.
              </p>
            )}
            <Link to="/app/quiz" className="mt-4 block">
              <Button variant="secondary" block size="sm">
                {hasLifestyle ? 'Retake lifestyle quiz' : 'Take lifestyle quiz'}
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Rooms Section */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold tracking-tight text-wellness-dark">
            Rooms near {user?.city}
          </h2>
          <Link to="/app/rooms" className="text-xs font-semibold text-sage-700 hover:text-sage-800 transition-colors">
            Browse all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {!nearbyRooms ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : nearbyRooms.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-stone-200/80 bg-white/95 p-8 text-center text-xs text-wellness-muted">
              <p className="font-semibold text-wellness-dark text-sm">No rooms posted in {user?.city} yet.</p>
              <p className="mt-1">Have an available flat or looking for a room partner? List your space!</p>
              <Link to="/app/rooms/create" className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  Post a room
                </Button>
              </Link>
            </div>
          ) : (
            <RevealOnScroll>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 col-span-full">
                {nearbyRooms.slice(0, 3).map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </RevealOnScroll>
          )}
        </div>
      </section>

      {/* Factual Community Banner (Zero Mock / Fake Numbers) */}
      <section className="mt-10 mb-6">
        <Card className="rounded-4xl border border-stone-200/80 bg-stone-900 text-white p-6 sm:p-8 shadow-floating">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="font-display text-lg sm:text-xl font-bold tracking-tight">
                Looking for a flatmate in {user?.city}?
              </p>
              <p className="mt-1 text-xs sm:text-sm text-stone-300">
                Keep your profile and lifestyle preferences updated to appear at the top of compatible roommate discovery.
              </p>
            </div>
            <Link to="/app/profile">
              <Button variant="primary" size="md" className="bg-white text-wellness-dark hover:bg-stone-100">
                Update profile
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}