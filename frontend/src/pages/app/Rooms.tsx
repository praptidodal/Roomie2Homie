import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, PlusIcon, SlidersHorizontalIcon, XIcon, RotateCcwIcon } from 'lucide-react';
import type { Room } from '../../types';

import { PageHeader } from '../../components/dashboard/PageHeader';
import { RoomCard } from '../../components/rooms/RoomCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../../components/ui/States';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { api } from '../../services/api';
import { cities } from '../../data/mock';

const defaults = {
  q: '',
  city: 'All cities',
  type: 'any',
  furnishing: 'any',
  maxRent: 40000,
  verifiedOnly: false,
};

export function Rooms() {
  const [all, setAll] = useState<Room[] | null>(null);
  const [filters, setFilters] = useState(defaults);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let alive = true;
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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.q.trim()) count++;
    if (filters.city !== 'All cities') count++;
    if (filters.type !== 'any') count++;
    if (filters.furnishing !== 'any') count++;
    if (filters.maxRent < 40000) count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  const controls = (
    <div className="space-y-4">
      <Field label="Search" htmlFor="rq">
        <Input
          id="rq"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="Locality or keyword"
        />
      </Field>

      <Field label="City" htmlFor="rcity">
        <Select
          id="rcity"
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        >
          <option>All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Room type" htmlFor="rtype">
        <Select
          id="rtype"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
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
          onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}
        >
          <option value="any">Any</option>
          <option value="furnished">Furnished</option>
          <option value="semi_furnished">Semi furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </Select>
      </Field>

      <Field
        label={`Maximum rent · ₹${filters.maxRent.toLocaleString('en-IN')}`}
        htmlFor="rrent"
      >
        <input
          id="rrent"
          type="range"
          min={8000}
          max={40000}
          step={1000}
          value={filters.maxRent}
          onChange={(e) => setFilters({ ...filters, maxRent: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-sage-600"
        />
      </Field>

      <label className="flex items-center gap-2.5 text-xs font-semibold text-wellness-dark cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={filters.verifiedOnly}
          onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
          className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500 accent-sage-600"
        />
        Verified listings only
      </label>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          block
          size="sm"
          onClick={() => setFilters(defaults)}
          icon={<RotateCcwIcon className="h-3.5 w-3.5" aria-hidden />}
        >
          Reset filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-60" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-50" />

      <PageHeader
        eyebrow="ROOMS"
        title="Find a place that fits your life"
        description="Explore flats and rooms posted by community members, with transparent house rules and bill splits."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="lg:hidden"
              onClick={() => setSheet(true)}
              icon={<SlidersHorizontalIcon className="h-4 w-4" aria-hidden />}
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
            <Link to="/app/rooms/create">
              <Button
                variant="primary"
                icon={<PlusIcon className="h-4 w-4" aria-hidden />}
              >
                Post a room
              </Button>
            </Link>
          </div>
        }
      />

      {/* Active filter pill tags */}
      {activeFiltersCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-wellness-muted mr-1">Active:</span>

          {filters.q.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 border border-sage-200/80 px-3 py-1 text-xs font-medium text-wellness-dark">
              &quot;{filters.q}&quot;
              <button
                type="button"
                onClick={() => setFilters({ ...filters, q: '' })}
                className="text-wellness-muted hover:text-wellness-dark"
                aria-label="Remove search filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.city !== 'All cities' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 border border-sage-200/80 px-3 py-1 text-xs font-medium text-wellness-dark">
              {filters.city}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, city: 'All cities' })}
                className="text-wellness-muted hover:text-wellness-dark"
                aria-label="Remove city filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.type !== 'any' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 border border-sage-200/80 px-3 py-1 text-xs font-medium text-wellness-dark">
              {filters.type.replace('_', ' ')}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, type: 'any' })}
                className="text-wellness-muted hover:text-wellness-dark"
                aria-label="Remove room type filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.furnishing !== 'any' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 border border-sage-200/80 px-3 py-1 text-xs font-medium text-wellness-dark">
              {filters.furnishing.replace('_', ' ')}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, furnishing: 'any' })}
                className="text-wellness-muted hover:text-wellness-dark"
                aria-label="Remove furnishing filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.maxRent < 40000 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 border border-sage-200/80 px-3 py-1 text-xs font-medium text-wellness-dark">
              Under ₹{filters.maxRent.toLocaleString('en-IN')}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, maxRent: 40000 })}
                className="text-wellness-muted hover:text-wellness-dark"
                aria-label="Remove rent ceiling filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.verifiedOnly && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 border border-sage-200/80 px-3 py-1 text-xs font-medium text-wellness-dark">
              Verified only
              <button
                type="button"
                onClick={() => setFilters({ ...filters, verifiedOnly: false })}
                className="text-wellness-muted hover:text-wellness-dark"
                aria-label="Remove verified filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => setFilters(defaults)}
            className="text-xs font-semibold text-sage-700 hover:text-sage-800 ml-1 underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block">
          <Card className="sticky top-24 rounded-3xl border border-stone-200/80 bg-white/95 p-5 shadow-soft backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-wellness-dark">
              <SlidersHorizontalIcon className="h-4 w-4 text-sage-600" aria-hidden />
              Filters
            </h2>
            {controls}
          </Card>
        </aside>

        {/* Room listing results */}
        <section>
          {!all ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={<HomeIcon className="h-6 w-6" aria-hidden />}
              title="No rooms match these filters"
              description="Try adjusting your filters, raising the rent ceiling, or clearing search criteria."
              action={
                <Button variant="primary" onClick={() => setFilters(defaults)}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <>
              <p className="mb-4 text-xs font-semibold text-wellness-muted">
                <span className="font-bold text-wellness-dark font-display">{results.length}</span>{' '}
                {results.length === 1 ? 'room' : 'rooms'} available
              </p>
              <RevealOnScroll>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </RevealOnScroll>
            </>
          )}
        </section>
      </div>

      {/* Mobile filter bottom sheet modal */}
      <Modal open={sheet} onClose={() => setSheet(false)} title="Filters" size="sm">
        {controls}
        <Button
          variant="primary"
          block
          className="mt-5"
          onClick={() => setSheet(false)}
        >
          Show {results.length} rooms
        </Button>
      </Modal>
    </div>
  );
}