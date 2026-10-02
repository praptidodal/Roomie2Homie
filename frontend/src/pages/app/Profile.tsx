import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, SparklesIcon } from 'lucide-react';

import {
  API_BASE_URL,
  api,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import {
  Badge,
  VerificationBadge,
} from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Card,
  CardHeader,
} from '../../components/ui/Card';
import {
  Field,
  Input,
  Select,
  Textarea,
} from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import {
  cities,
  localities,
} from '../../data/mock';
import {
  rupees,
  titleCase,
} from '../../utils/format';

interface StoredProfile {
  occupation?: string;
  collegeOrCompany?: string;
  currentLocation?: string;
  preferredLocations?: string[];
  monthlyBudget?: number;
  moveInDate?: string;
  bio?: string;
  interests?: string[];
  profilePhoto?: string;
  lifestyle?: Record<string, unknown>;
  quizCompleted?: boolean;
  isVerified?: boolean;
}

interface ProfileResponse {
  user: {
    fullName: string;
  };
  profile: StoredProfile | null;
}

function getProfilePhotoUrl(
  photoPath?: string
) {
  if (!photoPath) return '';

  if (
    photoPath.startsWith('http://') ||
    photoPath.startsWith('https://')
  ) {
    return photoPath;
  }

  const serverUrl = API_BASE_URL.replace(
    /\/api\/?$/,
    ''
  );

  return `${serverUrl}${
    photoPath.startsWith('/')
      ? photoPath
      : `/${photoPath}`
  }`;
}

function calculateProfileStrength(
  fullName: string,
  profile: StoredProfile | null
) {
  const completedFields = [
    Boolean(fullName),
    Boolean(profile?.occupation),
    Boolean(profile?.currentLocation),
    Boolean(profile?.monthlyBudget),
    Boolean(profile?.moveInDate),
    Boolean(profile?.bio),
    Boolean(profile?.interests?.length),
    Boolean(profile?.quizCompleted),
    Boolean(profile?.profilePhoto),
    Boolean(profile?.isVerified),
  ];

  return completedFields.filter(Boolean).length * 10;
}

export function Profile() {
  const { user, update } = useAuth();

  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);
  const [loadingProfile, setLoadingProfile] =
    useState(true);
  const [toast, setToast] = useState('');
  const [profilePhoto, setProfilePhoto] =
    useState('');
  const [lifestyle, setLifestyle] = useState<
    Record<string, unknown>
  >({});

  const [form, setForm] = useState({
    name: user?.name ?? '',
    city: '',
    locality: '',
    occupation: '',
    company: '',
    budget: '',
    moveIn: '',
    bio: '',
    interests: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data =
          (await api.getMyProfile()) as ProfileResponse;

        if (cancelled) return;

        const profile = data.profile;
        const photoUrl = getProfilePhotoUrl(
          profile?.profilePhoto
        );

        setForm({
          name:
            data.user.fullName ||
            user?.name ||
            '',
          city:
            profile?.currentLocation || '',
          locality:
            profile?.preferredLocations?.[0] ||
            '',
          occupation:
            profile?.occupation || '',
          company:
            profile?.collegeOrCompany || '',
          budget:
            profile?.monthlyBudget?.toString() ||
            '',
          moveIn:
            profile?.moveInDate?.slice(0, 10) ||
            '',
          bio: profile?.bio || '',
          interests:
            profile?.interests?.join(', ') ||
            '',
        });

        setProfilePhoto(photoUrl);
        setLifestyle(
          profile?.lifestyle || {}
        );

        const profileStrength =
          calculateProfileStrength(
            data.user.fullName,
            profile
          );

        update({
          name: data.user.fullName,
          avatar: photoUrl,
          city:
            profile?.currentLocation || '',
          quizCompleted: Boolean(
            profile?.quizCompleted
          ),
          verification:
            profile?.isVerified
              ? 'verified'
              : 'unverified',
          profileStrength,
        });
      } catch (error) {
        setToast(
          error instanceof Error
            ? error.message
            : 'Unable to load profile'
        );
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, update]);

  if (!user) {
    return null;
  }

  if (loadingProfile) {
    return (
      <p className="p-6">
        Loading profile...
      </p>
    );
  }

  const interests = form.interests
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean);

  const completionItems: Array<
    [string, boolean]
  > = [
    [
      'Lifestyle quiz',
      user.quizCompleted,
    ],
    [
      'Profile photo',
      Boolean(profilePhoto),
    ],
    [
      'Bio and interests',
      Boolean(
        form.bio.trim() &&
          interests.length
      ),
    ],
    [
      'Identity verified',
      user.verification === 'verified',
    ],
  ];

  async function uploadPhoto(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setToast(
        'Please select a JPG, PNG or WebP image'
      );
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast(
        'Profile photo must be smaller than 5 MB'
      );
      input.value = '';
      return;
    }

    setUploadingPhoto(true);
    setToast('');

    try {
      const hadPhoto =
        Boolean(profilePhoto);

      const result =
        await api.uploadProfilePhoto(file);

      const photoUrl =
        getProfilePhotoUrl(
          result.profilePhoto
        );

      setProfilePhoto(photoUrl);

      update({
        avatar: photoUrl,
        profileStrength: hadPhoto
          ? user.profileStrength
          : Math.min(
              100,
              user.profileStrength + 10
            ),
      });

      setToast(
        'Profile photo updated successfully'
      );

      setTimeout(() => {
        setToast('');
      }, 2400);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : 'Unable to upload profile photo'
      );
    } finally {
      setUploadingPhoto(false);
      input.value = '';
    }
  }

  async function save(
    event: React.FormEvent
  ) {
    event.preventDefault();
    setSaving(true);
    setToast('');

    const savedInterests =
      form.interests
        .split(',')
        .map((interest) =>
          interest.trim()
        )
        .filter(Boolean);

    try {
      const result =
        (await api.updateMyProfile({
          fullName: form.name,
          occupation: form.occupation,
          collegeOrCompany:
            form.company,
          currentLocation: form.city,
          preferredLocations:
            form.locality
              ? [form.locality]
              : [],
          monthlyBudget: form.budget
            ? Number(form.budget)
            : undefined,
          moveInDate:
            form.moveIn || undefined,
          bio: form.bio,
          interests: savedInterests,
        })) as {
          profile: StoredProfile;
        };

      const savedProfile =
        result.profile;

      const photoUrl =
        getProfilePhotoUrl(
          savedProfile.profilePhoto
        );

      setProfilePhoto(photoUrl);

      const profileStrength =
        calculateProfileStrength(
          form.name,
          savedProfile
        );

      update({
        name: form.name,
        avatar: photoUrl,
        city: form.city,
        quizCompleted: Boolean(
          savedProfile.quizCompleted
        ),
        verification:
          savedProfile.isVerified
            ? 'verified'
            : 'unverified',
        profileStrength,
      });

      setEdit(false);
      setToast(
        'Profile updated successfully'
      );

      setTimeout(() => {
        setToast('');
      }, 2400);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : 'Unable to update profile'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your profile"
        title="How others see you"
        description="Complete your profile to help potential roommates understand your preferences."
        action={
          <Button
            variant="secondary"
            onClick={() =>
              setEdit(true)
            }
            icon={
              <PencilIcon
                className="h-4 w-4"
                aria-hidden
              />
            }
          >
            Edit profile
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card
            padded={false}
            className="overflow-hidden"
          >
            <div
              className="h-24 bg-violet-coral"
              aria-hidden
            />

            <div className="px-6 pb-6">
              <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar
                      name={user.name}
                      src={
                        profilePhoto ||
                        null
                      }
                      size="xl"
                      className="ring-4 ring-white"
                    />

                    <label className="cursor-pointer rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-600 shadow-card transition hover:bg-violet-50">
                      {uploadingPhoto
                        ? 'Uploading...'
                        : profilePhoto
                          ? 'Change photo'
                          : 'Add photo'}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={
                          uploadingPhoto
                        }
                        onChange={
                          uploadPhoto
                        }
                      />
                    </label>
                  </div>

                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-extrabold text-navy-900">
                        {user.name}
                      </h2>

                      <VerificationBadge
                        status={
                          user.verification
                        }
                      />
                    </div>

                    <p className="mt-0.5 text-sm text-navy-500">
                      {form.occupation ||
                        'Occupation not added'}

                      {form.company
                        ? ` at ${form.company}`
                        : ''}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-navy-600">
                {form.bio ||
                  'No bio added yet.'}
              </p>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  [
                    'Looking in',
                    form.city
                      ? [
                          form.locality,
                          form.city,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : 'Not provided',
                  ],
                  [
                    'Budget',
                    form.budget
                      ? `${rupees(
                          Number(
                            form.budget
                          )
                        )}/month`
                      : 'Not provided',
                  ],
                  [
                    'Move-in from',
                    form.moveIn ||
                      'Not provided',
                  ],
                  [
                    'Email',
                    user.email,
                  ],
                ].map(
                  ([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-cream-300 p-3.5"
                    >
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-navy-500">
                        {label}
                      </dt>

                      <dd className="mt-0.5 text-sm font-semibold text-navy-800">
                        {value}
                      </dd>
                    </div>
                  )
                )}
              </dl>

              <h3 className="mt-6 text-[11px] font-bold uppercase tracking-wide text-navy-500">
                Interests
              </h3>

              {interests.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {interests.map(
                    (interest) => (
                      <li key={interest}>
                        <Badge tone="violet">
                          {interest}
                        </Badge>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-navy-500">
                  No interests added yet.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Lifestyle answers"
              description="These answers are used to calculate roommate compatibility."
              action={
                <Link to="/app/quiz">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={
                      <SparklesIcon
                        className="h-4 w-4"
                        aria-hidden
                      />
                    }
                  >
                    {user.quizCompleted
                      ? 'Retake quiz'
                      : 'Take quiz'}
                  </Button>
                </Link>
              }
            />

            {Object.keys(lifestyle)
              .length > 0 ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(
                  lifestyle
                ).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-2xl bg-cream-200 px-3.5 py-2.5"
                    >
                      <dt className="text-sm text-navy-500">
                        {titleCase(key)}
                      </dt>

                      <dd className="text-sm font-bold text-navy-800">
                        {typeof value ===
                        'boolean'
                          ? value
                            ? 'Yes'
                            : 'No'
                          : titleCase(
                              String(value)
                            )}
                      </dd>
                    </div>
                  )
                )}
              </dl>
            ) : (
              <p className="text-sm text-navy-500">
                Complete the lifestyle
                quiz to add your
                preferences.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile strength" />

            <div className="flex items-baseline gap-2">
              <p className="font-display text-4xl font-extrabold text-navy-900">
                {user.profileStrength}%
              </p>

              <p className="text-sm text-navy-500">
                complete
              </p>
            </div>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cream-300">
              <div
                className="h-full rounded-full bg-violet-coral transition-all duration-300"
                style={{
                  width: `${user.profileStrength}%`,
                }}
              />
            </div>

            <ul className="mt-5 space-y-2.5 text-sm">
              {completionItems.map(
                ([label, complete]) => (
                  <li
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-navy-600">
                      {label}
                    </span>

                    <span
                      className={`text-xs font-bold ${
                        complete
                          ? 'text-mint-600'
                          : 'text-coral-500'
                      }`}
                    >
                      {complete
                        ? 'Done'
                        : 'Pending'}
                    </span>
                  </li>
                )
              )}
            </ul>

            {user.verification !==
              'verified' && (
              <Link
                to="/app/verification"
                className="mt-4 block"
              >
                <Button
                  variant="gradient"
                  block
                >
                  Verify identity
                </Button>
              </Link>
            )}
          </Card>

          <Card className="bg-navy-900 text-white">
            <CardHeader title="Profile tip" />

            <p className="text-sm leading-relaxed text-cream-200/75">
              Mention your daily routine,
              cooking habits and guest
              preferences so potential
              roommates can understand
              whether your lifestyles are
              compatible.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={edit}
        onClose={() =>
          setEdit(false)
        }
        title="Edit profile"
        description="Changes are visible to members you match with."
        size="lg"
      >
        <form
          onSubmit={save}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              htmlFor="pname"
              required
            >
              <Input
                id="pname"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name:
                      event.target.value,
                  })
                }
              />
            </Field>

            <Field
              label="Occupation"
              htmlFor="pocc"
              required
            >
              <Input
                id="pocc"
                value={
                  form.occupation
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    occupation:
                      event.target.value,
                  })
                }
              />
            </Field>
          </div>

          <Field
            label="College or company"
            htmlFor="pcompany"
          >
            <Input
              id="pcompany"
              value={form.company}
              onChange={(event) =>
                setForm({
                  ...form,
                  company:
                    event.target.value,
                })
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="City"
              htmlFor="pcity"
              required
            >
              <Select
                id="pcity"
                value={form.city}
                onChange={(event) =>
                  setForm({
                    ...form,
                    city:
                      event.target.value,
                    locality: '',
                  })
                }
              >
                <option value="">
                  Select city
                </option>

                {cities.map((city) => (
                  <option
                    key={city}
                    value={city}
                  >
                    {city}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Preferred locality"
              htmlFor="ploc"
              required
            >
              <Select
                id="ploc"
                value={
                  form.locality
                }
                disabled={!form.city}
                onChange={(event) =>
                  setForm({
                    ...form,
                    locality:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  {form.city
                    ? 'Select preferred locality'
                    : 'Select a city first'}
                </option>

                {(
                  localities[
                    form.city
                  ] || []
                ).map((locality) => (
                  <option
                    key={locality}
                    value={locality}
                  >
                    {locality}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Monthly budget (₹)"
              htmlFor="pbud"
              required
            >
              <Input
                id="pbud"
                type="number"
                min={5000}
                step={500}
                value={form.budget}
                onChange={(event) =>
                  setForm({
                    ...form,
                    budget:
                      event.target.value,
                  })
                }
              />
            </Field>

            <Field
              label="Move-in from"
              htmlFor="pmove"
              required
            >
              <Input
                id="pmove"
                type="date"
                value={form.moveIn}
                onChange={(event) =>
                  setForm({
                    ...form,
                    moveIn:
                      event.target.value,
                  })
                }
              />
            </Field>
          </div>

          <Field
            label="About you"
            htmlFor="pbio"
            hint="Mention your routine and roommate preferences"
          >
            <Textarea
              id="pbio"
              rows={4}
              value={form.bio}
              onChange={(event) =>
                setForm({
                  ...form,
                  bio:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Interests"
            htmlFor="pint"
            hint="Separate interests using commas"
          >
            <Input
              id="pint"
              value={form.interests}
              onChange={(event) =>
                setForm({
                  ...form,
                  interests:
                    event.target.value,
                })
              }
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setEdit(false)
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="gradient"
              loading={saving}
            >
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[1300] -translate-x-1/2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-lift lg:bottom-8"
        >
          {toast}
        </div>
      )}
    </div>
  );
}