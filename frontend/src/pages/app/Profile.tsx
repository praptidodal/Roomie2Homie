import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  PencilIcon,
  SparklesIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  LightbulbIcon,
  CameraIcon,
  UploadIcon,
  Trash2Icon,
  RotateCcwIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { cities, localities } from '../../data/mock';
import { rupees, titleCase } from '../../utils/format';
import { api, BackendUserResponse } from '../../services/api';
import type { Lifestyle } from '../../types';

export function Profile() {
  const { user, update } = useAuth();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  // Full backend user data (richer than CurrentUser in AuthContext)
  const [backendUser, setBackendUser] = useState<BackendUserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable form state — initialized from backend data once loaded
  const [form, setForm] = useState({
    name: '',
    city: 'Bengaluru',
    locality: '',
    occupation: '',
    company: '',
    budget: '20000',
    moveIn: '',
    bio: '',
    interests: '',
    gender: '',
  });

  // Photo upload and staging state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingRemoveAvatar, setPendingRemoveAvatar] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Fetch full user profile from backend on mount
  useEffect(() => {
    let alive = true;
    api
      .getMe()
      .then((data) => {
        if (!alive) return;
        setBackendUser(data);
        setForm({
          name: data.name,
          city: data.city,
          locality: data.locality ?? '',
          occupation: data.occupation ?? '',
          company: data.company ?? '',
          budget: String(data.budget ?? 20000),
          moveIn: data.moveInDate
            ? data.moveInDate.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          bio: data.bio ?? '',
          interests: (data.interests ?? []).join(', '),
          gender: data.gender ?? '',
        });
      })
      .catch(() => {
        if (alive && user) {
          setForm((prev) => ({
            ...prev,
            name: user.name,
            city: user.city,
            gender: (user as any).gender ?? '',
          }));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed image formats
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setPhotoError('Invalid file format. Only JPG, JPEG, PNG, and WEBP formats are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 5 MB maximum file size limit
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setPhotoError('File size exceeds the 5 MB limit. Please select a photo under 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Revoke previous blob preview if exists
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setAvatarPreview(previewUrl);
    setPendingRemoveAvatar(false);
  };

  const handleRemoveOrRevertPhoto = () => {
    setPhotoError('');
    if (selectedFile) {
      // Revert staged photo back to currently saved avatar
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setSelectedFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (backendUser?.avatarUrl || user.avatar) {
      // Stage removal of existing saved photo
      setPendingRemoveAvatar(true);
      setAvatarPreview(null);
    }
  };

  const handleCancelEdit = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setSelectedFile(null);
    setAvatarPreview(null);
    setPendingRemoveAvatar(false);
    setPhotoError('');
    setSaveError('');
    setEdit(false);
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      let updatedAvatarUrl = backendUser?.avatarUrl ?? user?.avatar ?? '';

      // 1. Process avatar upload or removal first
      if (selectedFile) {
        const uploadRes = await api.uploadAvatar(selectedFile);
        updatedAvatarUrl = uploadRes.avatarUrl;
      } else if (pendingRemoveAvatar) {
        const deleteRes = await api.deleteAvatar();
        updatedAvatarUrl = deleteRes.avatarUrl;
      }

      // 2. Save profile fields
      const interestsList = form.interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await api.saveProfile({
        name: form.name,
        city: form.city,
        locality: form.locality,
        occupation: form.occupation,
        company: form.company,
        budget: Number(form.budget),
        moveInDate: form.moveIn ? new Date(form.moveIn).toISOString() : undefined,
        bio: form.bio,
        interests: interestsList,
        gender: (form.gender || undefined) as any,
      });

      const finalUser: BackendUserResponse = {
        ...updated,
        avatarUrl: updatedAvatarUrl,
      };

      setBackendUser(finalUser);
      update({
        name: finalUser.name,
        city: finalUser.city,
        avatar: updatedAvatarUrl,
        profileStrength: finalUser.profileStrength,
        gender: finalUser.gender,
      });

      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setSelectedFile(null);
      setAvatarPreview(null);
      setPendingRemoveAvatar(false);
      setEdit(false);
      setToast('Profile updated');
      setTimeout(() => setToast(''), 2400);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const lifestyle: Lifestyle | null = backendUser?.lifestyle ?? null;
  const displayLocality = backendUser?.locality || form.locality;
  const displayOccupation = backendUser?.occupation || form.occupation;
  const displayCompany = backendUser?.company || form.company;
  const displayBio = backendUser?.bio || form.bio;
  const displayInterests =
    (backendUser?.interests ?? []).length > 0
      ? backendUser!.interests!
      : form.interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  const displayBudget = backendUser?.budget ?? Number(form.budget);
  const displayMoveIn = backendUser?.moveInDate?.slice(0, 10) ?? form.moveIn;
  const GENDER_LABELS: Record<string, string> = {
    female: 'Female',
    male: 'Male',
    non_binary: 'Non-binary',
    prefer_not_to_say: 'Prefer not to say',
  };
  const currentGenderVal = backendUser?.gender || form.gender || user.gender;
  const displayGender = currentGenderVal ? (GENDER_LABELS[currentGenderVal] || currentGenderVal) : 'Not specified';

  return (
    <div className="relative">
      {/* Ambient background blobs */}
      <FloatingBlob tone="sage" size="lg" className="-top-16 -left-20 opacity-70" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-60" />

      {/* Page Header */}
      <PageHeader
        eyebrow="Your profile"
        title="How others see you"
        description="A complete profile with a verified badge gets roughly three times more requests."
        action={
          <Button
            variant="secondary"
            onClick={() => setEdit(true)}
            icon={<PencilIcon className="h-4 w-4" aria-hidden="true" />}
          >
            Edit profile
          </Button>
        }
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          {/* Profile Hero & Identity Card */}
          <RevealOnScroll>
            <Card padded={false} className="overflow-hidden rounded-4xl border border-stone-200/70 bg-white/95 shadow-soft">
              {/* Soft pastel banner */}
              <div
                className="h-28 w-full border-b border-stone-100 bg-sage-100/70"
                aria-hidden="true"
              />
              <div className="px-7 pb-7">
                <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div className="relative group">
                      <Avatar
                        name={user.name}
                        src={backendUser?.avatarUrl || user.avatar}
                        size="xl"
                        className="ring-4 ring-white shadow-soft"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEdit(true);
                          setTimeout(() => fileInputRef.current?.click(), 120);
                        }}
                        aria-label="Upload profile photo"
                        title="Upload or change profile photo"
                        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200/80 bg-white text-wellness-dark shadow-soft transition-transform hover:scale-105 active:scale-95"
                      >
                        <CameraIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-wellness-dark">
                          {user.name}
                        </h2>
                        <VerificationBadge status={user.verification} />
                      </div>
                      <p className="mt-0.5 text-xs text-wellness-muted">
                        {displayOccupation && displayCompany
                          ? `${displayOccupation} at ${displayCompany}`
                          : displayOccupation || displayCompany || 'Update your occupation'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-wellness-muted">
                  {displayBio || 'Add a bio to introduce yourself to potential flatmates.'}
                </p>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Gender', displayGender],
                    ['Looking in', displayLocality ? `${displayLocality}, ${user.city}` : user.city],
                    ['Budget', `${rupees(displayBudget)}/month`],
                    ['Move-in from', displayMoveIn || '—'],
                    ['Email', user.email],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3.5">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-wellness-muted">
                        {label}
                      </dt>
                      <dd className="mt-0.5 text-xs font-semibold text-wellness-dark">{value}</dd>
                    </div>
                  ))}
                </dl>

                <h3 className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-wellness-muted">
                  Interests
                </h3>
                {displayInterests.length > 0 ? (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {displayInterests.map((i) => (
                      <li key={i}>
                        <Badge tone="sage">{i.trim()}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-stone-400">No interests added yet.</p>
                )}
              </div>
            </Card>
          </RevealOnScroll>

          {/* Lifestyle Answers Card */}
          <RevealOnScroll delay={100}>
            <Card className="rounded-4xl border border-stone-200/70 bg-white/95 p-7 shadow-soft">
              <CardHeader
                title="Lifestyle answers"
                description="These drive every compatibility score."
                action={
                  <Link to="/app/quiz">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<SparklesIcon className="h-4 w-4" aria-hidden="true" />}
                    >
                      Retake quiz
                    </Button>
                  </Link>
                }
              />

              {lifestyle ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(lifestyle).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3"
                    >
                      <dt className="text-xs text-wellness-muted">{titleCase(key)}</dt>
                      <dd className="text-xs font-semibold text-wellness-dark">
                        {typeof value === 'boolean'
                          ? value
                            ? 'Yes'
                            : 'No'
                          : titleCase(String(value))}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-stone-400">
                  {loading
                    ? 'Loading lifestyle data…'
                    : 'Take the lifestyle quiz to fill this section.'}
                </p>
              )}
            </Card>
          </RevealOnScroll>
        </div>

        {/* Right column: Profile strength & Tip */}
        <div className="space-y-6">
          <RevealOnScroll delay={80}>
            <Card className="rounded-4xl border border-stone-200/70 bg-white/95 p-7 shadow-soft">
              <CardHeader title="Profile strength" />
              <div className="flex items-baseline gap-2">
                <p className="font-display text-4xl font-bold tracking-tight text-wellness-dark">
                  {user.profileStrength}%
                </p>
                <p className="text-xs font-medium text-wellness-muted">complete</p>
              </div>

              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-stone-200/70">
                <div
                  className="h-full rounded-full bg-sage-500"
                  style={{ width: `${user.profileStrength}%` }}
                />
              </div>

              <ul className="mt-6 space-y-3 text-xs">
                {[
                  ['Lifestyle quiz', user.quizCompleted],
                  ['Profile photo', Boolean(backendUser?.avatarUrl)],
                  ['Bio and interests', Boolean(displayBio && displayInterests.length > 0)],
                  ['Identity verified', user.verification === 'verified'],
                ].map(([label, ok]) => (
                  <li key={label as string} className="flex items-center justify-between">
                    <span className="text-wellness-muted">{label as string}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        ok ? 'text-sage-600' : 'text-peach-500'
                      }`}
                    >
                      {ok ? (
                        <>
                          <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          Done
                        </>
                      ) : (
                        <>
                          <AlertCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          Pending
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {user.verification !== 'verified' && (
                <Link to="/app/verification" className="mt-6 block">
                  <Button variant="primary" block>
                    Verify identity
                  </Button>
                </Link>
              )}
            </Card>
          </RevealOnScroll>

          <RevealOnScroll delay={140}>
            <div className="rounded-4xl border border-stone-200/80 bg-white/95 p-6 text-wellness-dark shadow-soft">
              <div className="flex items-center gap-2">
                <LightbulbIcon className="h-4 w-4 text-peach-500" aria-hidden="true" />
                <h3 className="font-display text-sm font-bold tracking-tight text-wellness-dark">
                  Profile Tip
                </h3>
              </div>
              <p className="mt-2.5 text-xs text-wellness-muted leading-relaxed">
                Mention your daily routine in your bio — what time you leave, whether you cook, and
                how you feel about guests. Profiles with routine details get replied to twice as often.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={edit}
        onClose={handleCancelEdit}
        title="Edit profile"
        description="Changes are visible to members you match with."
        size="lg"
      >
        <form onSubmit={save} className="flex flex-col">
          {/* Compact, polished profile photo section */}
          <div className="rounded-3xl border border-stone-200/80 bg-stone-50/70 p-3.5 sm:p-4 mb-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="relative shrink-0">
                <Avatar
                  name={form.name || user.name}
                  src={
                    pendingRemoveAvatar
                      ? null
                      : avatarPreview || backendUser?.avatarUrl || user.avatar
                  }
                  size="lg"
                  className="ring-2 ring-white shadow-soft"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-wellness-dark">
                    Profile photo
                  </h4>
                  <p className="text-[11px] text-wellness-muted leading-tight">
                    JPG, JPEG, PNG, or WEBP up to 5 MB.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload profile photo"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<UploadIcon className="h-3 w-3" aria-hidden="true" />}
                    className="h-8 text-xs px-3"
                  >
                    {selectedFile || ((backendUser?.avatarUrl || user.avatar) && !pendingRemoveAvatar)
                      ? 'Change photo'
                      : 'Upload photo'}
                  </Button>

                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveOrRevertPhoto}
                      icon={<RotateCcwIcon className="h-3 w-3" aria-hidden="true" />}
                      className="h-8 text-xs px-2.5 text-stone-600 hover:text-stone-900"
                    >
                      Revert
                    </Button>
                  )}

                  {!selectedFile && (backendUser?.avatarUrl || user.avatar) && !pendingRemoveAvatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveOrRevertPhoto}
                      icon={<Trash2Icon className="h-3 w-3" aria-hidden="true" />}
                      className="h-8 text-xs px-2.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </Button>
                  )}

                  {pendingRemoveAvatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingRemoveAvatar(false)}
                      icon={<RotateCcwIcon className="h-3 w-3" aria-hidden="true" />}
                      className="h-8 text-xs px-2.5 text-stone-600 hover:text-stone-900"
                    >
                      Undo removal
                    </Button>
                  )}
                </div>

                {photoError && (
                  <p role="alert" className="text-[11px] font-semibold text-rose-600">
                    {photoError}
                  </p>
                )}

                {selectedFile && !photoError && (
                  <p className="text-[11px] font-medium text-emerald-600 truncate">
                    Selected: {selectedFile.name}
                  </p>
                )}

                {pendingRemoveAvatar && (
                  <p className="text-[11px] font-medium text-amber-600">
                    Photo will be removed when you save.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Unified responsive form grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field label="Full name" htmlFor="pname" required>
              <Input
                id="pname"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field label="Gender" htmlFor="pgender">
              <Select
                id="pgender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </Field>

            <Field label="Occupation" htmlFor="pocc">
              <Input
                id="pocc"
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              />
            </Field>

            <Field label="Company / College" htmlFor="pcomp">
              <Input
                id="pcomp"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </Field>

            <Field label="City" htmlFor="pcity" required>
              <Select
                id="pcity"
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                    locality: localities[e.target.value]?.[0] ?? '',
                  })
                }
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Preferred locality" htmlFor="ploc">
              <Select
                id="ploc"
                value={form.locality}
                onChange={(e) => setForm({ ...form, locality: e.target.value })}
              >
                <option value="">Any locality</option>
                {(localities[form.city] ?? []).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Monthly budget (₹)" htmlFor="pbud" required>
              <Input
                id="pbud"
                type="number"
                min={5000}
                step={500}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </Field>

            <Field label="Move-in from" htmlFor="pmove">
              <Input
                id="pmove"
                type="date"
                value={form.moveIn}
                onChange={(e) => setForm({ ...form, moveIn: e.target.value })}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="About you" htmlFor="pbio" hint="Routine details get more replies">
                <Textarea
                  id="pbio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Interests" htmlFor="pint" hint="Comma separated">
                <Input
                  id="pint"
                  value={form.interests}
                  onChange={(e) => setForm({ ...form, interests: e.target.value })}
                />
              </Field>
            </div>
          </div>

          {saveError && (
            <p
              role="alert"
              className="mt-3 rounded-2xl border border-peach-200 bg-peach-50 px-4 py-3 text-xs font-semibold text-rose-600"
            >
              {saveError}
            </p>
          )}

          {/* Pinned Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 -mx-6 -mb-5 sm:-mx-7 sm:-mb-6 mt-4 border-t border-stone-200/80 bg-white/95 px-6 py-3.5 sm:px-7 sm:py-4 backdrop-blur-md flex items-center justify-end gap-2.5 z-10">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[1300] -translate-x-1/2 rounded-full border border-stone-200/80 bg-wellness-dark/95 px-6 py-3 text-xs font-semibold text-white shadow-floating backdrop-blur-md lg:bottom-10"
        >
          {toast}
        </div>
      )}
    </div>
  );
}