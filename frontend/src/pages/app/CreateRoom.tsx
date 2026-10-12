import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  XIcon,
  AlertCircleIcon,
  CheckIcon,
  HomeIcon,
  UploadCloudIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { cities } from '../../data/mock';

interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const COMMON_AMENITIES = [
  'Wi-Fi 300 Mbps',
  'Attached bathroom',
  'Washing machine',
  'Power backup',
  'Balcony',
  'Lift',
  'Air Conditioning',
  'Cook service',
  'Covered parking',
  '24x7 Security',
];

const COMMON_RULES = [
  'No smoking indoors',
  'Guests with a heads-up',
  'Quiet hours after 11pm',
  'Pet friendly',
  'Vegetarian cooking only',
  'Clean up shared spaces after cooking',
];

export function CreateRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [locality, setLocality] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState<number>(20000);
  const [deposit, setDeposit] = useState<number>(40000);
  const [type, setType] = useState<'private_room' | 'shared_room' | 'studio' | 'full_flat'>('private_room');
  const [furnishing, setFurnishing] = useState<'furnished' | 'semi_furnished' | 'unfurnished'>('furnished');
  const [availableFrom, setAvailableFrom] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [flatmates, setFlatmates] = useState<number>(1);
  const [preferredGender, setPreferredGender] = useState<'any' | 'female' | 'male'>('any');

  // Bills
  const [maintenance, setMaintenance] = useState<number>(1500);
  const [internet, setInternet] = useState<number>(500);
  const [electricity, setElectricity] = useState<number>(1000);

  // Photos
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Amenities and Rules
  const [amenities, setAmenities] = useState<string[]>([
    'Wi-Fi 300 Mbps',
    'Attached bathroom',
    'Washing machine',
  ]);
  const [houseRules, setHouseRules] = useState<string[]>([
    'No smoking indoors',
    'Quiet hours after 11pm',
  ]);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [selectedPhotos]);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleRule = (item: string) => {
    setHouseRules((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    if (selectedPhotos.length + fileList.length > MAX_PHOTOS) {
      setPhotoError(
        `You can upload up to ${MAX_PHOTOS} photos. You already selected ${selectedPhotos.length}.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validNewPhotos: SelectedPhoto[] = [];

    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setPhotoError(
          `"${file.name}" is not a supported image format. Please select JPG, JPEG, PNG, or WEBP images.`
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setPhotoError(
          `"${file.name}" exceeds the 10 MB file size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      validNewPhotos.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setSelectedPhotos((prev) => [...prev, ...validNewPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (idToRemove: string) => {
    setPhotoError(null);
    setSelectedPhotos((prev) => {
      const item = prev.find((p) => p.id === idToRemove);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((p) => p.id !== idToRemove);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhotoError(null);

    // Client-side validations
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (!locality.trim()) {
      setError('Locality is required.');
      return;
    }
    if (rent < 2000 || rent > 200000) {
      setError('Monthly rent must be between ₹2,000 and ₹2,000,000.');
      return;
    }
    if (deposit < 0 || deposit > 1000000) {
      setError('Security deposit must be between ₹0 and ₹1,000,000.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters long.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('city', city);
      formData.append('locality', locality.trim());
      formData.append('rent', String(rent));
      formData.append('deposit', String(deposit));
      formData.append('type', type);
      formData.append('furnishing', furnishing);
      formData.append('availableFrom', availableFrom);
      formData.append('flatmates', String(flatmates));
      formData.append('preferredGender', preferredGender);
      formData.append('description', description.trim());
      formData.append('amenities', JSON.stringify(amenities));
      formData.append('houseRules', JSON.stringify(houseRules));
      formData.append('bills', JSON.stringify({
        rent: Number(rent),
        maintenance: Number(maintenance) || 0,
        internet: Number(internet) || 0,
        electricity: Number(electricity) || 0,
      }));

      // Append real files
      selectedPhotos.forEach((photo) => {
        formData.append('photos', photo.file);
      });

      const created = await api.createRoom(formData);

      // Redirect directly to the newly created room detail page
      navigate(`/app/rooms/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create room listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl pb-16">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-60" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-50" />

      <div className="mb-4">
        <Link
          to="/app/rooms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-wellness-muted hover:text-wellness-dark transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden />
          Back to rooms
        </Link>
      </div>

      <PageHeader
        eyebrow="HOST A SPACE"
        title="List your room"
        description="Share details about your space, living routine, bill split, and house rules to find aligned flatmates."
      />

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Overview */}
        <Card className="rounded-4xl border border-stone-200/80 bg-white/95 p-6 sm:p-8 shadow-floating backdrop-blur-sm">
          <CardHeader
            title="1. Listing overview"
            description="Clear details help suitable flatmates find your place quickly."
          />
          <div className="space-y-4">
            <Field label="Listing headline" htmlFor="title" required hint="e.g. Master bedroom in 3BHK near metro">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunlit private room in a calm 3BHK near HSR"
                required
                maxLength={100}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="city" required>
                <Select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Locality / Neighborhood" htmlFor="locality" required hint="e.g. Koramangala 4th Block">
                <Input
                  id="locality"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Indiranagar, 12th Main"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Room type" htmlFor="type" required>
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  required
                >
                  <option value="private_room">Private Room</option>
                  <option value="shared_room">Shared Room</option>
                  <option value="studio">Studio Apartment</option>
                  <option value="full_flat">Full Flat / House</option>
                </Select>
              </Field>

              <Field label="Furnishing" htmlFor="furnishing" required>
                <Select
                  id="furnishing"
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as any)}
                  required
                >
                  <option value="furnished">Fully Furnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </Select>
              </Field>
            </div>

            <Field label="Room & flat description" htmlFor="description" required hint="Minimum 20 characters">
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the room, flat layout, sunlight, balcony, amenities, and current flatmates..."
                required
              />
            </Field>
          </div>
        </Card>

        {/* Section 2: Rent & Bills */}
        <Card className="rounded-4xl border border-stone-200/80 bg-white/95 p-6 sm:p-8 shadow-floating backdrop-blur-sm">
          <CardHeader
            title="2. Rent, deposit & bills"
            description="Clear financials prevent awkward conversations later."
          />
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Monthly rent (₹)" htmlFor="rent" required>
                <Input
                  id="rent"
                  type="number"
                  min={2000}
                  max={200000}
                  step={500}
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                  required
                />
              </Field>

              <Field label="Security deposit (₹)" htmlFor="deposit" required>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  max={1000000}
                  step={1000}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  required
                />
              </Field>

              <Field label="Available from" htmlFor="availableFrom" required>
                <Input
                  id="availableFrom"
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  required
                />
              </Field>
            </div>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Monthly utility splits (optional estimates)
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Maintenance / mo (₹)" htmlFor="maint">
                <Input
                  id="maint"
                  type="number"
                  min={0}
                  step={100}
                  value={maintenance}
                  onChange={(e) => setMaintenance(Number(e.target.value))}
                />
              </Field>

              <Field label="Internet / mo (₹)" htmlFor="net">
                <Input
                  id="net"
                  type="number"
                  min={0}
                  step={50}
                  value={internet}
                  onChange={(e) => setInternet(Number(e.target.value))}
                />
              </Field>

              <Field label="Electricity approx (₹)" htmlFor="elec">
                <Input
                  id="elec"
                  type="number"
                  min={0}
                  step={100}
                  value={electricity}
                  onChange={(e) => setElectricity(Number(e.target.value))}
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* Section 3: Room Dynamics */}
        <Card className="rounded-4xl border border-stone-200/80 bg-white/95 p-6 sm:p-8 shadow-floating backdrop-blur-sm">
          <CardHeader
            title="3. Living dynamics"
            description="Who lives in the flat right now and who would fit in best."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of existing flatmates" htmlFor="flatmates" required hint="0 if you live solo">
              <Input
                id="flatmates"
                type="number"
                min={0}
                max={10}
                value={flatmates}
                onChange={(e) => setFlatmates(Number(e.target.value))}
                required
              />
            </Field>

            <Field label="Preferred gender" htmlFor="gender" required>
              <Select
                id="gender"
                value={preferredGender}
                onChange={(e) => setPreferredGender(e.target.value as any)}
                required
              >
                <option value="any">Any gender</option>
                <option value="female">Female only</option>
                <option value="male">Male only</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* Section 4: Photos */}
        <Card className="rounded-4xl border border-stone-200/80 bg-white/95 p-6 sm:p-8 shadow-floating backdrop-blur-sm">
          <CardHeader
            title="4. Photos of the room & flat"
            description="Upload real photos directly from your device. Listings with photos receive up to 4x more enquiries."
          />

          <div className="space-y-4">
            {/* Upload Area / Dropzone */}
            {selectedPhotos.length < MAX_PHOTOS && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-8 text-center transition-all duration-200 hover:border-sage-400 hover:bg-sage-50/40"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  onChange={handleFileSelect}
                  className="sr-only"
                  aria-label="Upload room photos"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-stone-200 group-hover:border-sage-300 group-hover:bg-sage-50 transition-colors">
                  <UploadCloudIcon className="h-6 w-6 text-stone-500 group-hover:text-sage-700 transition-colors" />
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-wellness-dark">
                  Select photos from your device
                </p>
                <p className="mt-1 text-xs text-wellness-muted">
                  Supports JPG, JPEG, PNG, or WEBP up to 10 MB each · Up to {MAX_PHOTOS} photos
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3 pointer-events-none"
                  icon={<PlusIcon className="h-4 w-4" />}
                >
                  Browse files
                </Button>
              </div>
            )}

            {/* Validation Error Message */}
            {photoError && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
                <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Selected Photos List / Previews */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-wellness-muted">
                  Photos selected ({selectedPhotos.length} of {MAX_PHOTOS})
                </p>
                {selectedPhotos.length > 0 && selectedPhotos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-sage-700 hover:text-sage-800 transition-colors cursor-pointer"
                  >
                    + Add more photos
                  </button>
                )}
              </div>

              {selectedPhotos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center text-xs text-wellness-muted">
                  <HomeIcon className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                  <p className="font-semibold text-wellness-dark">No photos selected yet</p>
                  <p className="mt-0.5">
                    You can publish without photos or select up to {MAX_PHOTOS} photos from your local device.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {selectedPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-xs"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={`Selected photo ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-stone-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        aria-label={`Remove photo ${index + 1}`}
                        className="absolute right-1.5 top-1.5 rounded-full bg-stone-900/70 p-1 text-white shadow-xs transition-transform hover:scale-110 hover:bg-rose-600 cursor-pointer"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Section 5: Amenities & House Rules */}
        <Card className="rounded-4xl border border-stone-200/80 bg-white/95 p-6 sm:p-8 shadow-floating backdrop-blur-sm">
          <CardHeader
            title="5. Amenities & house rules"
            description="Select everything that applies to your flat."
          />
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-wellness-muted mb-3">
                Included amenities:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_AMENITIES.map((item) => {
                  const active = amenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAmenity(item)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-sage-100 text-stone-800 ring-1 ring-sage-300'
                          : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {active ? (
                        <CheckIcon className="h-3.5 w-3.5 text-sage-600" />
                      ) : (
                        <PlusIcon className="h-3.5 w-3.5 text-stone-400" />
                      )}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-wellness-muted mb-3">
                House rules & living preferences:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_RULES.map((rule) => {
                  const active = houseRules.includes(rule);
                  return (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => toggleRule(rule)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-peach-100 text-stone-800 ring-1 ring-peach-300'
                          : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {active ? (
                        <CheckIcon className="h-3.5 w-3.5 text-peach-600" />
                      ) : (
                        <PlusIcon className="h-3.5 w-3.5 text-stone-400" />
                      )}
                      <span>{rule}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
          <Link to="/app/rooms" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" block className="sm:w-auto">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            block
            className="sm:w-auto"
            icon={<HomeIcon className="h-4 w-4" aria-hidden />}
          >
            Publish room listing
          </Button>
        </div>
      </form>
    </div>
  );
}
