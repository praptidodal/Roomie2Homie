import { Link } from 'react-router-dom';
import { BedDoubleIcon, MapPinIcon, SofaIcon, UsersIcon, HomeIcon } from 'lucide-react';
import type { Room } from '../../types';
import { monthDay, resolveImageUrl, rupees, titleCase } from '../../utils/format';
import { Badge } from '../ui/Badge';

export function RoomCard({ room }: { room: Room }) {
  const hasImage = room.images && room.images.length > 0 && Boolean(room.images[0]);

  return (
    <Link
      to={`/app/rooms/${room.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/95 shadow-soft transition-all duration-200 ease-out hover:-translate-y-1 hover:border-sage-300 hover:shadow-floating"
    >
      {/* Media area */}
      <div className="relative h-48 overflow-hidden bg-stone-100">
        {hasImage ? (
          <img
            src={resolveImageUrl(room.images[0])}
            alt={room.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-stone-100 text-stone-400">
            <HomeIcon className="h-8 w-8 text-stone-300" aria-hidden />
            <span className="text-xs font-medium text-stone-400">No photo provided</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="navy">{titleCase(room.type)}</Badge>
          {room.verified && <Badge tone="mint">Verified</Badge>}
        </div>

        <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-xs border border-stone-200/60">
          <p className="font-display text-sm font-bold text-wellness-dark">
            {rupees(room.rent)}
            <span className="text-[11px] font-normal text-wellness-muted">/mo</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-wellness-dark group-hover:text-stone-900 transition-colors">
          {room.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-wellness-muted">
          <MapPinIcon className="h-3.5 w-3.5 text-sage-600 shrink-0" aria-hidden />
          <span className="truncate">{room.locality}, {room.city}</span>
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-2xl bg-stone-50/80 p-2.5 text-center border border-stone-100">
            <dt className="flex justify-center text-stone-400">
              <UsersIcon className="h-3.5 w-3.5" aria-hidden />
            </dt>
            <dd className="mt-1 font-semibold text-wellness-dark">
              {room.flatmates === 0 ? 'Solo' : `${room.flatmates} flatmates`}
            </dd>
          </div>
          <div className="rounded-2xl bg-stone-50/80 p-2.5 text-center border border-stone-100">
            <dt className="flex justify-center text-stone-400">
              <SofaIcon className="h-3.5 w-3.5" aria-hidden />
            </dt>
            <dd className="mt-1 font-semibold text-wellness-dark truncate">
              {titleCase(room.furnishing)}
            </dd>
          </div>
          <div className="rounded-2xl bg-stone-50/80 p-2.5 text-center border border-stone-100">
            <dt className="flex justify-center text-stone-400">
              <BedDoubleIcon className="h-3.5 w-3.5" aria-hidden />
            </dt>
            <dd className="mt-1 font-semibold text-wellness-dark">
              {monthDay(room.availableFrom).slice(0, 6)}
            </dd>
          </div>
        </dl>

        <p className="mt-auto pt-4 text-xs font-semibold text-sage-700 group-hover:text-sage-800 transition-colors">
          View listing details →
        </p>
      </div>
    </Link>
  );
}