import React from 'react';
import { Link } from 'react-router-dom';
import { BedDoubleIcon, MapPinIcon, SofaIcon, UsersIcon } from 'lucide-react';
import type { Room } from '../../types';
import { monthDay, rupees, titleCase } from '../../utils/format';
import { Badge } from '../ui/Badge';

export function RoomCard({ room }: {room: Room;}) {
  return (
    <Link
      to={`/app/rooms/${room.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-soft transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-violet-200 hover:shadow-lift">
      
      <div className="relative h-44 overflow-hidden">
        <img
          src={room.images[0]}
          alt={room.title}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
        
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone="navy">{titleCase(room.type)}</Badge>
          {room.verified && <Badge tone="mint">Verified</Badge>}
        </div>
        <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 px-3 py-1.5 shadow-sm">
          <p className="font-display text-base font-extrabold text-navy-900">
            {rupees(room.rent)}
            <span className="text-xs font-semibold text-navy-500">/mo</span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-navy-900">
          {room.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-navy-500">
          <MapPinIcon className="h-4 w-4 text-violet-500" aria-hidden />
          {room.locality}, {room.city}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-2xl bg-cream-200 p-2.5 text-center">
            <dt className="flex justify-center text-navy-500">
              <UsersIcon className="h-4 w-4" aria-hidden />
            </dt>
            <dd className="mt-1 font-bold text-navy-900">
              {room.flatmates === 0 ? 'Solo' : `${room.flatmates} flatmates`}
            </dd>
          </div>
          <div className="rounded-2xl bg-cream-200 p-2.5 text-center">
            <dt className="flex justify-center text-navy-500">
              <SofaIcon className="h-4 w-4" aria-hidden />
            </dt>
            <dd className="mt-1 font-bold text-navy-900">{titleCase(room.furnishing)}</dd>
          </div>
          <div className="rounded-2xl bg-cream-200 p-2.5 text-center">
            <dt className="flex justify-center text-navy-500">
              <BedDoubleIcon className="h-4 w-4" aria-hidden />
            </dt>
            <dd className="mt-1 font-bold text-navy-900">{monthDay(room.availableFrom).slice(0, 6)}</dd>
          </div>
        </dl>

        <p className="mt-auto pt-4 text-sm font-semibold text-violet-600">
          View listing details →
        </p>
      </div>
    </Link>);

}