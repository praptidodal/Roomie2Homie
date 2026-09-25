import React, { useEffect, useMemo, useState } from 'react';
import { HomeIcon, SlidersHorizontalIcon } from 'lucide-react';
import type { Room } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RoomCard } from '../../components/rooms/RoomCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../../components/ui/States';
import { api } from '../../services/api';
import { cities } from '../../data/mock';

const defaults = {
  q: '',
  city: 'All cities',
  type: 'any',
  furnishing: 'any',
  maxRent: 30000,
  verifiedOnly: false
};

export function Rooms() {
  const [all, setAll] = useState<Room[] | null>(null);
  const [filters, setFilters] = useState(defaults);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let alive = true;
    // TODO: GET /api/rooms?filters
    api.getRooms().then((r) => alive && setAll(r));
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!all) return [];
    return all.filter((r) => {
      const q = filters.q.trim().toLowerCase();
      if (q && !`${r.title} ${r.locality} ${r.city}`.toLowerCase().includes(q)) return false;
      if (filters.city !== 'All cities' && r.city !== filters.city) return false;
      if (filters.type !== 'any' && r.type !== filters.type) return false;
      if (filters.furnishing !== 'any' && r.furnishing !== filters.furnishing) return false;
      if (r.rent > filters.maxRent) return false;
      if (filters.verifiedOnly && !r.verified) return false;
      return true;
    });
  }, [all, filters]);

  const controls =
  <div className="space-y-4">
      <Field label="Search" htmlFor="rq">
        <Input
        id="rq"
        value={filters.q}
        onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        placeholder="Locality or keyword" />
      
      </Field>
      <Field label="City" htmlFor="rcity">
        <Select
        id="rcity"
        value={filters.city}
        onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
        
          <option>All cities</option>
          {cities.map((c) =>
        <option key={c} value={c}>{c}</option>
        )}
        </Select>
      </Field>
      <Field label="Room type" htmlFor="rtype">
        <Select
        id="rtype"
        value={filters.type}
        onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
        
          <option value="any">Any type</option>
          <option value="private_room">Private room</option>
          <option value="shared_room">Shared room</option>
          <option value="studio">Studio</option>
          <option value="full_flat">Full flat</option>
        </Select>
      </Field>
      <Field label="Furnishing" htmlFor="rfurn">
        <Select
        id="rfurn"
        value={filters.furnishing}
        onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}>
        
          <option value="any">Any</option>
          <option value="furnished">Furnished</option>
          <option value="semi_furnished">Semi furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </Select>
      </Field>
      <Field label={`Maximum rent · ₹${filters.maxRent.toLocaleString('en-IN')}`} htmlFor="rrent">
        <input
        id="rrent"
        type="range"
        min={8000}
        max={40000}
        step={1000}
        value={filters.maxRent}
        onChange={(e) => setFilters({ ...filters, maxRent: Number(e.target.value) })}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-300 accent-violet-600" />
      
      </Field>
      <label className="flex items-center gap-2.5 text-sm font-semibold text-navy-700">
        <input
        type="checkbox"
        checked={filters.verifiedOnly}
        onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
        className="h-4 w-4 rounded border-cream-300 text-violet-600 focus:ring-violet-400" />
      
        Verified listings only
      </label>
      <Button variant="ghost" block onClick={() => setFilters(defaults)}>
        Reset filters
      </Button>
    </div>;


  return (
    <div>
      <PageHeader
        eyebrow="Rooms"
        title="Rooms and flats posted by members"
        description="Each listing shows who already lives there, the house rules and the full monthly bill split."
        action={
        <Button
          variant="secondary"
          className="lg:hidden"
          onClick={() => setSheet(true)}
          icon={<SlidersHorizontalIcon className="h-4 w-4" aria-hidden />}>
          
            Filters
          </Button>
        } />
      

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-navy-900">
              <SlidersHorizontalIcon className="h-4 w-4 text-violet-500" aria-hidden />
              Filters
            </h2>
            {controls}
          </Card>
        </aside>

        <section>
          {!all ?
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div> :
          results.length === 0 ?
          <EmptyState
            icon={<HomeIcon className="h-6 w-6" aria-hidden />}
            title="No rooms match these filters"
            description="Try raising the rent ceiling or removing the furnishing filter."
            action={
            <Button variant="gradient" onClick={() => setFilters(defaults)}>
                  Reset filters
                </Button>
            } /> :


          <>
              <p className="mb-4 text-sm text-navy-500">
                <span className="font-bold text-navy-900">{results.length}</span> rooms available
              </p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((room) =>
              <RoomCard key={room.id} room={room} />
              )}
              </div>
            </>
          }
        </section>
      </div>

      <Modal open={sheet} onClose={() => setSheet(false)} title="Filters" size="sm">
        {controls}
        <Button variant="gradient" block className="mt-5" onClick={() => setSheet(false)}>
          Show {results.length} rooms
        </Button>
      </Modal>
    </div>);

}