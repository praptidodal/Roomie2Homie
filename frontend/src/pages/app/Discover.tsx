import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontalIcon, SparklesIcon, UsersIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import type { MatchCandidate } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RoommateCard } from '../../components/roommates/RoommateCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../../components/ui/States';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { api } from '../../services/api';
import { cities } from '../../data/mock';

const defaults = {
  city: 'All cities',
  gender: 'any',
  maxBudget: 35000,
  minScore: 60,
  verifiedOnly: false,
  sleep: 'any',
  cleanliness: 'any',
  sort: 'score',
};

export function Discover() {
  const [all, setAll] = useState<MatchCandidate[] | null>(null);
  const [filters, setFilters] = useState(defaults);
  const [sheet, setSheet] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  // Fetch real candidate profiles from backend matching API
  useEffect(() => {
    let alive = true;
    api
      .getDiscoverCandidates()
      .then((m) => alive && setAll(m))
      .catch(() => alive && setAll([]));
    return () => {
      alive = false;
    };
  }, []);

  // Filter and sort candidates using existing criteria
  const results = useMemo(() => {
    if (!all) return [];
    const list = all.filter((m) => {
      const p = m.profile;
      if (filters.city !== 'All cities' && p.city !== filters.city) return false;
      if (filters.gender !== 'any' && p.gender !== filters.gender) return false;
      if (p.budget > filters.maxBudget) return false;
      if (m.score < filters.minScore) return false;
      if (filters.verifiedOnly && p.verification !== 'verified') return false;
      if (filters.sleep !== 'any' && p.lifestyle?.sleep !== filters.sleep) return false;
      if (filters.cleanliness !== 'any' && p.lifestyle?.cleanliness !== filters.cleanliness)
        return false;
      return true;
    });

    return list.sort((a, b) =>
      filters.sort === 'budget'
        ? a.profile.budget - b.profile.budget
        : filters.sort === 'moveIn'
        ? (a.profile.moveIn || '').localeCompare(b.profile.moveIn || '')
        : b.score - a.score
    );
  }, [all, filters]);

  // Send real match request
  async function request(match: MatchCandidate) {
    setRequesting(match.profile.id);
    try {
      await api.updateMatch(match.profile.id, 'request');
      setSent((prev) => [...prev, match.profile.id]);
      setAll((prev) =>
        prev?.map((m) =>
          m.profile.id === match.profile.id ? { ...m, status: 'sent' } : m
        ) ?? null
      );
      setToast(`Request sent to ${match.profile.name.split(' ')[0]}`);
    } catch (err: any) {
      setToast(err?.message || 'Failed to send match request.');
    } finally {
      setRequesting(null);
      setTimeout(() => setToast(''), 3000);
    }
  }

  // Count active non-default filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.city !== defaults.city) count++;
    if (filters.gender !== defaults.gender) count++;
    if (filters.maxBudget !== defaults.maxBudget) count++;
    if (filters.minScore !== defaults.minScore) count++;
    if (filters.verifiedOnly !== defaults.verifiedOnly) count++;
    if (filters.sleep !== defaults.sleep) count++;
    if (filters.cleanliness !== defaults.cleanliness) count++;
    return count;
  }, [filters]);

  // Filter controls reusable in both Desktop Sidebar and Mobile Modal
  const controls = (
    <div className="space-y-5 text-sm">
      <Field label="City" htmlFor="fcity">
        <Select
          id="fcity"
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

      <Field
        label={`Maximum budget · ₹${filters.maxBudget.toLocaleString('en-IN')}/mo`}
        htmlFor="fbudget"
      >
        <div className="pt-2">
          <input
            id="fbudget"
            type="range"
            min={8000}
            max={40000}
            step={1000}
            value={filters.maxBudget}
            onChange={(e) => setFilters({ ...filters, maxBudget: Number(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-peach-500"
          />
          <div className="mt-1 flex justify-between text-[11px] text-wellness-muted">
            <span>₹8k</span>
            <span>₹24k</span>
            <span>₹40k</span>
          </div>
        </div>
      </Field>

      <Field label={`Minimum compatibility · ${filters.minScore}%`} htmlFor="fscore">
        <div className="pt-2">
          <input
            id="fscore"
            type="range"
            min={50}
            max={95}
            step={5}
            value={filters.minScore}
            onChange={(e) => setFilters({ ...filters, minScore: Number(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-sage-500"
          />
          <div className="mt-1 flex justify-between text-[11px] text-wellness-muted">
            <span>50%</span>
            <span>75%</span>
            <span>95%</span>
          </div>
        </div>
      </Field>

      <Field label="Gender preference" htmlFor="fgender">
        <Select
          id="fgender"
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
        >
          <option value="any">Anyone</option>
          <option value="female">Women</option>
          <option value="male">Men</option>
          <option value="non_binary">Non-binary</option>
        </Select>
      </Field>

      <Field label="Sleep schedule" htmlFor="fsleep">
        <Select
          id="fsleep"
          value={filters.sleep}
          onChange={(e) => setFilters({ ...filters, sleep: e.target.value })}
        >
          <option value="any">Any schedule</option>
          <option value="early_bird">Early bird</option>
          <option value="flexible">Flexible</option>
          <option value="night_owl">Night owl</option>
        </Select>
      </Field>

      <Field label="Cleanliness" htmlFor="fclean">
        <Select
          id="fclean"
          value={filters.cleanliness}
          onChange={(e) => setFilters({ ...filters, cleanliness: e.target.value })}
        >
          <option value="any">Any preference</option>
          <option value="very_tidy">Very tidy</option>
          <option value="tidy">Tidy</option>
          <option value="relaxed">Relaxed</option>
        </Select>
      </Field>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/60 p-3 font-medium text-wellness-dark transition-colors hover:bg-stone-100/60">
        <input
          type="checkbox"
          checked={filters.verifiedOnly}
          onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
          className="h-4 w-4 rounded-md border-stone-300 text-sage-600 focus:ring-sage-500"
        />
        <span>Verified members only</span>
      </label>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          block
          onClick={() => setFilters(defaults)}
          icon={<RotateCcwIcon className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          Reset all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="relative">
      {/* Subtle ambient background blobs */}
      <FloatingBlob tone="sage" size="lg" className="-top-16 -left-20 opacity-70" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-60" />

      {/* Page Header with Outfit typography & Reenie Beanie annotation */}
      <PageHeader
        eyebrow="Discover"
        title="Roommates who match your lifestyle"
        annotation="scored on daily habits"
        description="Explore members whose daily routines, budgets, and habits align with yours, scored across sleep, cleanliness, social energy, and lifestyle."
        action={
          <div className="flex items-center gap-2.5">
            <Select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              aria-label="Sort candidates"
              className="h-11 w-44 rounded-full border border-stone-200/80 bg-white/90 text-xs font-medium text-wellness-dark shadow-soft"
            >
              <option value="score">Best match first</option>
              <option value="budget">Lowest budget</option>
              <option value="moveIn">Earliest move-in</option>
            </Select>

            <Button
              variant="secondary"
              className="lg:hidden h-11 px-4 text-xs font-medium"
              onClick={() => setSheet(true)}
              icon={<SlidersHorizontalIcon className="h-4 w-4" aria-hidden="true" />}
            >
              Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[17.5rem_1fr]">
        {/* ===================================================================== */}
        {/* DESKTOP FILTER SIDEBAR                                                */}
        {/* ===================================================================== */}
        <aside className="hidden lg:block">
          <Card className="sticky top-24 rounded-4xl border border-stone-200/70 bg-white/90 p-6 shadow-soft backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-wellness-dark">
                <SlidersHorizontalIcon className="h-4 w-4 text-peach-500" aria-hidden="true" />
                Filters
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters(defaults)}
                  className="text-xs font-semibold text-peach-500 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            {controls}
          </Card>
        </aside>

        {/* ===================================================================== */}
        {/* CANDIDATE RESULTS SECTION                                             */}
        {/* ===================================================================== */}
        <section className="min-w-0">
          {/* Quick Active Filter Pill Bar */}
          {activeFiltersCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-wellness-muted font-medium">Active filters:</span>
              {filters.city !== defaults.city && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-wellness-dark">
                  {filters.city}
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, city: defaults.city })}
                    className="hover:text-stone-900"
                    aria-label="Remove city filter"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.maxBudget < defaults.maxBudget && (
                <span className="inline-flex items-center gap-1 rounded-full bg-peach-100 px-3 py-1 text-xs font-medium text-wellness-dark">
                  Under ₹{filters.maxBudget.toLocaleString('en-IN')}
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, maxBudget: defaults.maxBudget })}
                    className="hover:text-stone-900"
                    aria-label="Remove budget filter"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.minScore > defaults.minScore && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lavender-100 px-3 py-1 text-xs font-medium text-wellness-dark">
                  Match ≥ {filters.minScore}%
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, minScore: defaults.minScore })}
                    className="hover:text-stone-900"
                    aria-label="Remove min score filter"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.verifiedOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-wellness-dark">
                  Verified only
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, verifiedOnly: false })}
                    className="hover:text-stone-900"
                    aria-label="Remove verified filter"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Loading State */}
          {!all ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : results.length === 0 ? (
            /* Empty State */
            <EmptyState
              icon={<UsersIcon className="h-6 w-6 text-stone-400" aria-hidden="true" />}
              title="No roommates match these filters"
              description="Try widening your budget, lowering the compatibility threshold, or selecting another city."
              action={
                <Button variant="primary" onClick={() => setFilters(defaults)}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            /* Results Grid with RevealOnScroll */
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium text-wellness-muted">
                  Showing <span className="font-bold text-wellness-dark">{results.length}</span>{' '}
                  compatible {results.length === 1 ? 'roommate' : 'roommates'}
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                {results.map((m, index) => (
                  <RevealOnScroll key={m.profile.id} delay={Math.min(index * 60, 240)}>
                    <RoommateCard
                      match={sent.includes(m.profile.id) ? { ...m, status: 'sent' } : m}
                      onRequest={request}
                      pending={requesting === m.profile.id}
                    />
                  </RevealOnScroll>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE FILTER MODAL                                                       */}
      {/* ========================================================================= */}
      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filter roommates"
        description="Find flatmates that suit your lifestyle preferences."
        size="sm"
        footer={
          <Button variant="primary" block onClick={() => setSheet(false)}>
            Show {results.length} results
          </Button>
        }
      >
        <div className="py-2">{controls}</div>
      </Modal>

      {/* ========================================================================= */}
      {/* MATCH REQUEST SUCCESS TOAST                                               */}
      {/* ========================================================================= */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[1300] -translate-x-1/2 rounded-full border border-stone-200/80 bg-wellness-dark/95 px-6 py-3 text-xs font-semibold text-white shadow-floating backdrop-blur-md lg:bottom-10"
        >
          <span className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-peach-400" aria-hidden="true" />
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}