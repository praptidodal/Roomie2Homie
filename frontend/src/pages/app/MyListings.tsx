import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, PlusIcon, AlertCircleIcon } from 'lucide-react';
import type { Room } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RoomCard } from '../../components/rooms/RoomCard';
import { Button } from '../../components/ui/Button';
import { EmptyState, SkeletonCard } from '../../components/ui/States';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { api } from '../../services/api';

export function MyListings() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyRooms();
      setRooms(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load your room listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  return (
    <div className="relative">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-60" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-50" />

      <PageHeader
        eyebrow="MY LISTINGS"
        title="Rooms and flats you manage"
        description="Manage your active listings, check who has enquired, or post a new room."
        action={
          <Link to="/app/rooms/create">
            <Button
              variant="primary"
              icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            >
              Post a room
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadListings}>
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !rooms || rooms.length === 0 ? (
        <EmptyState
          icon={<HomeIcon className="h-6 w-6" aria-hidden />}
          title="You don't have any listings yet"
          description="Have a spare room or available space? List your space to connect with verified roommates."
          action={
            <Link to="/app/rooms/create">
              <Button
                variant="primary"
                icon={<PlusIcon className="h-4 w-4" aria-hidden />}
              >
                + List a room
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold text-wellness-muted">
              <span className="font-bold text-wellness-dark font-display">{rooms.length}</span> active{' '}
              {rooms.length === 1 ? 'listing' : 'listings'}
            </p>
            <Link to="/app/rooms" className="text-xs font-semibold text-sage-700 hover:text-sage-800 transition-colors">
              Browse all community rooms →
            </Link>
          </div>
          <RevealOnScroll>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </RevealOnScroll>
        </>
      )}
    </div>
  );
}
