import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, SparklesIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { cities, currentUserLifestyle, localities } from '../../data/mock';
import { rupees, titleCase } from '../../utils/format';

export function Profile() {
  const { user, update } = useAuth();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    city: user?.city ?? 'Bengaluru',
    locality: 'Koramangala',
    occupation: 'Frontend Developer',
    company: 'Postman',
    budget: '22000',
    moveIn: '2026-10-01',
    bio: 'Frontend developer, night owl, and a serious filter-coffee person. Looking for a calm flat in south Bengaluru with people who keep common areas tidy.',
    interests: 'Filter coffee, Indie music, Trekking, Cooking'
  });

  if (!user) return null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    // TODO: PATCH /api/users/me
    await new Promise((r) => setTimeout(r, 600));
    update({ name: form.name, city: form.city, profileStrength: 90 });
    setSaving(false);
    setEdit(false);
    setToast('Profile updated');
    setTimeout(() => setToast(''), 2400);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your profile"
        title="How others see you"
        description="A complete profile with a verified badge gets roughly three times more requests."
        action={
        <Button variant="secondary" onClick={() => setEdit(true)} icon={<PencilIcon className="h-4 w-4" aria-hidden />}>
            Edit profile
          </Button>
        } />
      

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card padded={false} className="overflow-hidden">
            <div className="h-24 bg-violet-coral" aria-hidden />
            <div className="px-6 pb-6">
              <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  <Avatar name={user.name} src={user.avatar} size="xl" className="ring-4 ring-white" />
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-extrabold text-navy-900">
                        {user.name}
                      </h2>
                      <VerificationBadge status={user.verification} />
                    </div>
                    <p className="mt-0.5 text-sm text-navy-500">
                      {form.occupation} at {form.company}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-navy-600">{form.bio}</p>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                ['Looking in', `${form.locality}, ${form.city}`],
                ['Budget', `${rupees(Number(form.budget))}/month`],
                ['Move-in from', form.moveIn],
                ['Email', user.email]].
                map(([label, value]) =>
                <div key={label} className="rounded-2xl border border-cream-300 p-3.5">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-navy-500">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-navy-800">{value}</dd>
                  </div>
                )}
              </dl>

              <h3 className="mt-6 text-[11px] font-bold uppercase tracking-wide text-navy-500">
                Interests
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {form.interests.split(',').map((i) =>
                <li key={i}>
                    <Badge tone="violet">{i.trim()}</Badge>
                  </li>
                )}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Lifestyle answers"
              description="These drive every compatibility score."
              action={
              <Link to="/app/quiz">
                  <Button variant="ghost" size="sm" icon={<SparklesIcon className="h-4 w-4" aria-hidden />}>
                    Retake quiz
                  </Button>
                </Link>
              } />
            
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(currentUserLifestyle).map(([key, value]) =>
              <div key={key} className="flex items-center justify-between rounded-2xl bg-cream-200 px-3.5 py-2.5">
                  <dt className="text-sm text-navy-500">{titleCase(key)}</dt>
                  <dd className="text-sm font-bold text-navy-800">
                    {typeof value === 'boolean' ? value ? 'Yes' : 'No' : titleCase(String(value))}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile strength" />
            <div className="flex items-baseline gap-2">
              <p className="font-display text-4xl font-extrabold text-navy-900">
                {user.profileStrength}%
              </p>
              <p className="text-sm text-navy-500">complete</p>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cream-300">
              <div className="h-full rounded-full bg-violet-coral" style={{ width: `${user.profileStrength}%` }} />
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
              ['Lifestyle quiz', user.quizCompleted],
              ['Profile photo', true],
              ['Bio and interests', true],
              ['Identity verified', user.verification === 'verified']].
              map(([label, ok]) =>
              <li key={label as string} className="flex items-center justify-between">
                  <span className="text-navy-600">{label as string}</span>
                  <span className={`text-xs font-bold ${ok ? 'text-mint-600' : 'text-coral-500'}`}>
                    {ok ? 'Done' : 'Pending'}
                  </span>
                </li>
              )}
            </ul>
            {user.verification !== 'verified' &&
            <Link to="/app/verification" className="mt-4 block">
                <Button variant="gradient" block>
                  Verify identity
                </Button>
              </Link>
            }
          </Card>

          <Card className="bg-navy-900 text-white">
            <CardHeader title="Tip" />
            <p className="text-sm leading-relaxed text-cream-200/75">
              Mention your daily routine in your bio — what time you leave, whether you cook, and
              how you feel about guests. Profiles with routine details get replied to twice as often.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title="Edit profile"
        description="Changes are visible to members you match with."
        size="lg">
        
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="pname" required>
              <Input id="pname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Occupation" htmlFor="pocc" required>
              <Input id="pocc" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" htmlFor="pcity" required>
              <Select
                id="pcity"
                value={form.city}
                onChange={(e) =>
                setForm({ ...form, city: e.target.value, locality: localities[e.target.value]?.[0] ?? '' })
                }>
                
                {cities.map((c) =>
                <option key={c} value={c}>{c}</option>
                )}
              </Select>
            </Field>
            <Field label="Preferred locality" htmlFor="ploc">
              <Select id="ploc" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })}>
                {(localities[form.city] ?? []).map((l) =>
                <option key={l} value={l}>{l}</option>
                )}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly budget (₹)" htmlFor="pbud" required>
              <Input id="pbud" type="number" min={5000} step={500} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </Field>
            <Field label="Move-in from" htmlFor="pmove" required>
              <Input id="pmove" type="date" value={form.moveIn} onChange={(e) => setForm({ ...form, moveIn: e.target.value })} />
            </Field>
          </div>
          <Field label="About you" htmlFor="pbio" hint="Routine details get more replies">
            <Textarea id="pbio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <Field label="Interests" htmlFor="pint" hint="Comma separated">
            <Input id="pint" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEdit(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {toast &&
      <div
        role="status"
        className="fixed bottom-24 left-1/2 z-[1300] -translate-x-1/2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-lift lg:bottom-8">
        
          {toast}
        </div>
      }
    </div>);

}