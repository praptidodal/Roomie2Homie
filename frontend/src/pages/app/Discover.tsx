import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontalIcon, SparklesIcon, UsersIcon } from 'lucide-react';
import type { MatchCandidate } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RoommateCard } from '../../components/roommates/RoommateCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../../components/ui/States';
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
  sort: 'score'
};

export function Discover() {
  const [all, setAll] = useState<MatchCandidate[] | null>(null);
  const [filters, setFilters] = useState(defaults);
  const [sheet, setSheet] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let alive = true;
    // TODO: GET /api/matches/suggestions?filters
    api.getMatches().then((m) => alive && setAll(m));
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!all) return [];
    const list = all.filter((m) => {
      const p = m.profile;
      if (filters.city !== 'All cities' && p.city !== filters.city) return false;
      if (filters.gender !== 'any' && p.gender !== filters.gender) return false;
      if (p.budget > filters.maxBudget) return false;
      if (m.score < filters.minScore) return false;
      if (filters.verifiedOnly && p.verification !== 'verified') return false;
      if (filters.sleep !== 'any' && p.lifestyle.sleep !== filters.sleep) return false;
      if (filters.cleanliness !== 'any' && p.lifestyle.cleanliness !== filters.cleanliness)
      return false;
      return true;
    });
    return list.sort((a, b) =>
    filters.sort === 'budget' ?
    a.profile.budget - b.profile.budget :
    filters.sort === 'moveIn' ?
    a.profile.moveIn.localeCompare(b.profile.moveIn) :
    b.score - a.score
    );
  }, [all, filters]);

  async function request(match: MatchCandidate) {
    setRequesting(match.profile.id);
    await api.updateMatch(match.profile.id, 'request');
    setRequesting(null);
    setSent((prev) => [...prev, match.profile.id]);
    setToast(`Request sent to ${match.profile.name.split(' ')[0]}`);
    setTimeout(() => setToast(''), 2600);
  }

  const controls =
  <div className="space-y-4">
      <Field label="City" htmlFor="fcity">
        <Select
        id="fcity"
        value={filters.city}
        onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
        
          <option>All cities</option>
          {cities.map((c) =>
        <option key={c} value={c}>{c}</option>
        )}
        </Select>
      </Field>

      <Field label={`Maximum budget · ₹${filters.maxBudget.toLocaleString('en-IN')}`} htmlFor="fbudget">
        <input
        id="fbudget"
        type="range"
        min={8000}
        max={40000}
        step={1000}
        value={filters.maxBudget}
        onChange={(e) => setFilters({ ...filters, maxBudget: Number(e.target.value) })}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-300 accent-violet-600" />
      
      </Field>

      <Field label={`Minimum compatibility · ${filters.minScore}%`} htmlFor="fscore">
        <input
        id="fscore"
        type="range"
        min={50}
        max={95}
        step={5}
        value={filters.minScore}
        onChange={(e) => setFilters({ ...filters, minScore: Number(e.target.value) })}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-300 accent-violet-600" />
      
      </Field>

      <Field label="Gender preference" htmlFor="fgender">
        <Select
        id="fgender"
        value={filters.gender}
        onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
        
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
        onChange={(e) => setFilters({ ...filters, sleep: e.target.value })}>
        
          <option value="any">Any</option>
          <option value="early_bird">Early bird</option>
          <option value="flexible">Flexible</option>
          <option value="night_owl">Night owl</option>
        </Select>
      </Field>

      <Field label="Cleanliness" htmlFor="fclean">
        <Select
        id="fclean"
        value={filters.cleanliness}
        onChange={(e) => setFilters({ ...filters, cleanliness: e.target.value })}>
        
          <option value="any">Any</option>
          <option value="very_tidy">Very tidy</option>
          <option value="tidy">Tidy</option>
          <option value="relaxed">Relaxed</option>
        </Select>
      </Field>

      <label className="flex items-center gap-2.5 text-sm font-semibold text-navy-700">
        <input
        type="checkbox"
        checked={filters.verifiedOnly}
        onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
        className="h-4 w-4 rounded border-cream-300 text-violet-600 focus:ring-violet-400" />
      
        Verified members only
      </label>

      <Button variant="ghost" block onClick={() => setFilters(defaults)}>
        Reset filters
      </Button>
    </div>;


  return (
    <div>
      <PageHeader
        eyebrow="Discover"
        title="Roommates who match your lifestyle"
        description="Ranked by compatibility across sleep, cleanliness, kitchen, social energy, habits and budget."
        action={
        <div className="flex gap-2">
            <Select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            aria-label="Sort results"
            className="w-44">
            
              <option value="score">Best match first</option>
              <option value="budget">Lowest budget</option>
              <option value="moveIn">Earliest move-in</option>
            </Select>
            <Button
            variant="secondary"
            className="lg:hidden"
            onClick={() => setSheet(true)}
            icon={<SlidersHorizontalIcon className="h-4 w-4" aria-hidden />}>
            
              Filters
            </Button>
          </div>
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
          <div className="grid gap-5 xl:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div> :
          results.length === 0 ?
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" aria-hidden />}
            title="No roommates match these filters"
            description="Try widening your budget, lowering the compatibility threshold, or including more cities."
            action={
            <Button variant="gradient" onClick={() => setFilters(defaults)}>
                  Reset filters
                </Button>
            } /> :


          <>
              <p className="mb-4 text-sm text-navy-500">
                <span className="font-bold text-navy-900">{results.length}</span> people match your
                filters
              </p>
              <div className="grid gap-5 xl:grid-cols-2">
                {results.map((m) =>
              <RoommateCard
                key={m.profile.id}
                match={sent.includes(m.profile.id) ? { ...m, status: 'sent' } : m}
                onRequest={request}
                pending={requesting === m.profile.id} />

              )}
              </div>
            </>
          }
        </section>
      </div>

      <Modal open={sheet} onClose={() => setSheet(false)} title="Filters" size="sm">
        {controls}
        <Button variant="gradient" block className="mt-5" onClick={() => setSheet(false)}>
          Show {results.length} results
        </Button>
      </Modal>

      {toast &&
      <div
        role="status"
        className="fixed bottom-24 left-1/2 z-[1300] -translate-x-1/2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-lift lg:bottom-8">
        
          <span className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-mint-400" aria-hidden />
            {toast}
          </span>
        </div>
      }
    </div>);

}