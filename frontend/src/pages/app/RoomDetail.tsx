import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  MapPinIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
  HomeIcon,
} from 'lucide-react';
import type { Room } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { useAuth } from '../../contexts/AuthContext';
import { api, PublicProfileResponse } from '../../services/api';
import { monthDay, resolveImageUrl, rupees, titleCase } from '../../utils/format';

export function RoomDetail() {
  const { roomId = '' } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [host, setHost] = useState<PublicProfileResponse | undefined>();

  const [active, setActive] = useState(0);
  const [enquire, setEnquire] = useState(false);
  const [message, setMessage] = useState(
    'Hi! I saw your listing and my budget and move-in date line up. Is the room still available?'
  );
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getRoom(roomId).then(async (r) => {
      if (!alive) return;
      setRoom(r ?? null);
      if (r) setHost(await api.getProfile(r.hostId));
    });
    return () => {
      alive = false;
    };
  }, [roomId]);

  if (room === undefined) return <LoadingState label="Loading listing..." />;
  if (!room) {
    return (
      <EmptyState
        title="Listing not found"
        description="This room may have been taken down by the host or is no longer available."
        action={
          <Link to="/app/rooms">
            <Button variant="primary">Back to rooms</Button>
          </Link>
        }
      />
    );
  }

  const total =
    room.bills.rent + room.bills.maintenance + room.bills.internet + room.bills.electricity;

  const isHost =
    user && room && (user.id === room.hostId || (user as any)._id === room.hostId);

  const hasImages = room.images && room.images.length > 0 && Boolean(room.images[0]);

  async function send() {
    if (message.trim().length < 5) {
      setError('Please enter a message of at least 5 characters.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await api.createRoomEnquiry(roomId, message.trim());
      setSending(false);
      setSent(true);
      setEnquire(false);
    } catch (err: any) {
      setSending(false);
      setError(err.message || 'Failed to submit enquiry.');
    }
  }

  return (
    <div className="relative">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-60" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-50" />

      <Link
        to="/app/rooms"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-wellness-muted transition-colors hover:text-wellness-dark"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden />
        Back to rooms
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6 min-w-0">
          {/* Photos area */}
          <div>
            <div className="overflow-hidden rounded-4xl border border-stone-200/80 bg-white p-2 shadow-floating">
              {hasImages ? (
                <img
                  src={resolveImageUrl(room.images[active] || room.images[0])}
                  alt={`${room.title} - photo ${active + 1}`}
                  className="h-60 sm:h-72 md:h-96 w-full rounded-[1.75rem] object-cover"
                />
              ) : (
                <div className="flex h-60 sm:h-72 md:h-96 w-full flex-col items-center justify-center gap-2 rounded-[1.75rem] bg-stone-100 text-stone-400">
                  <HomeIcon className="h-12 w-12 text-stone-300" aria-hidden />
                  <span className="text-sm font-medium text-stone-500">No photos uploaded</span>
                </div>
              )}
            </div>

            {hasImages && room.images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {room.images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`View photo ${i + 1}`}
                    aria-current={active === i}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                      active === i
                        ? 'border-sage-500 ring-2 ring-sage-200'
                        : 'border-transparent hover:border-stone-300'
                    }`}
                  >
                    <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Info Card */}
          <Card className="rounded-4xl border border-stone-200/80 bg-white/95 p-6 sm:p-8 shadow-floating backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="navy">{titleCase(room.type)}</Badge>
                  {room.verified && (
                    <Badge tone="mint">
                      <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
                      Verified listing
                    </Badge>
                  )}
                  <Badge tone="neutral">{titleCase(room.furnishing)}</Badge>
                </div>

                <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-wellness-dark">
                  {room.title}
                </h1>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-wellness-muted">
                  <MapPinIcon className="h-3.5 w-3.5 text-sage-600 shrink-0" aria-hidden />
                  {room.locality}, {room.city}
                </p>
              </div>

              <div className="text-right">
                <p className="font-display text-3xl font-extrabold text-wellness-dark">
                  {rupees(room.rent)}
                </p>
                <p className="text-xs text-wellness-muted">per month</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-stone-600">{room.description}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-stone-50/80 p-4 border border-stone-100">
                <dt className="flex items-center gap-2 text-xs font-semibold text-wellness-muted">
                  <UsersIcon className="h-4 w-4 text-stone-400" aria-hidden />
                  Flatmates
                </dt>
                <dd className="mt-1 font-display text-base font-bold text-wellness-dark">
                  {room.flatmates === 0 ? 'Live solo' : `${room.flatmates} people`}
                </dd>
              </div>
              <div className="rounded-2xl bg-stone-50/80 p-4 border border-stone-100">
                <dt className="flex items-center gap-2 text-xs font-semibold text-wellness-muted">
                  <CalendarCheckIcon className="h-4 w-4 text-stone-400" aria-hidden />
                  Available
                </dt>
                <dd className="mt-1 font-display text-base font-bold text-wellness-dark">
                  {monthDay(room.availableFrom)}
                </dd>
              </div>
              <div className="rounded-2xl bg-stone-50/80 p-4 border border-stone-100">
                <dt className="text-xs font-semibold text-wellness-muted">
                  Preferred
                </dt>
                <dd className="mt-1 font-display text-base font-bold text-wellness-dark">
                  {room.preferredGender === 'any' ? 'Anyone' : titleCase(room.preferredGender)}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Amenities */}
          <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-soft backdrop-blur-sm">
            <CardHeader title="Amenities" />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {room.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm text-stone-700">
                  <CheckCircle2Icon className="h-4 w-4 shrink-0 text-sage-600" aria-hidden />
                  {a}
                </li>
              ))}
            </ul>
          </Card>

          {/* House Rules */}
          <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-soft backdrop-blur-sm">
            <CardHeader title="House rules" description="Agreed expectations for a peaceful home." />
            <ul className="space-y-2.5">
              {room.houseRules.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-peach-400" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6 min-w-0">
          {/* Monthly Cost Breakdown */}
          <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-soft backdrop-blur-sm">
            <CardHeader title="Monthly cost" description="Direct split of actual monthly expenses." />
            <dl className="space-y-2.5 text-sm">
              {[
                ['Rent', room.bills.rent],
                ['Maintenance', room.bills.maintenance],
                ['Internet', room.bills.internet],
                ['Electricity (avg)', room.bills.electricity],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <dt className="text-wellness-muted">{label as string}</dt>
                  <dd className="font-semibold text-wellness-dark">{rupees(value as number)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                <dt className="font-display font-bold text-wellness-dark">Total per month</dt>
                <dd className="font-display text-xl font-extrabold text-sage-700">
                  {rupees(total)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-wellness-muted">Security deposit</dt>
                <dd className="font-semibold text-wellness-dark">{rupees(room.deposit)}</dd>
              </div>
            </dl>
          </Card>

          {/* Listed By */}
          {host && (
            <Card className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-soft backdrop-blur-sm">
              <CardHeader title={isHost ? "Host (You)" : "Listed by"} />
              <div className="flex items-center gap-3">
                <Avatar name={host.name} src={host.avatarUrl} ring />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-wellness-dark">
                      {isHost ? `${host.name} (You)` : host.name}
                    </p>
                    <VerificationBadge status={host.verificationStatus} />
                  </div>
                  <p className="text-xs text-wellness-muted">
                    {host.occupation} · {host.lastActive}
                  </p>
                </div>
              </div>
              {!isHost && (
                <Link to={`/app/discover/${host.id}`} className="mt-4 block">
                  <Button variant="secondary" block size="sm">
                    View compatibility
                  </Button>
                </Link>
              )}
            </Card>
          )}

          {/* Sticky CTA Card */}
          <Card className="sticky top-24 rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-floating backdrop-blur-sm">
            {isHost ? (
              <div className="space-y-3">
                <span className="inline-block rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700 border border-sage-200/60">
                  Your listing
                </span>
                <h3 className="font-display text-lg font-bold text-wellness-dark">You are the host</h3>
                <p className="text-xs text-wellness-muted">
                  You created this room listing. You cannot enquire about your own room.
                </p>
                <Link to="/app/enquiries" className="block pt-1">
                  <Button variant="secondary" block>
                    View received enquiries
                  </Button>
                </Link>
              </div>
            ) : sent ? (
              <div className="space-y-3">
                <p className="rounded-2xl bg-sage-50 border border-sage-200/60 p-4 text-xs font-semibold text-sage-800">
                  Enquiry sent to {host?.name.split(' ')[0] ?? 'the host'}! You will receive a notification when they reply.
                </p>
                <Link to="/app/enquiries">
                  <Button variant="secondary" block>
                    View my enquiries
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={() => {
                    setError('');
                    setEnquire(true);
                  }}
                  icon={<MessageCircleIcon className="h-4 w-4" aria-hidden />}
                >
                  Send enquiry
                </Button>
                <p className="mt-3 text-center text-xs text-wellness-muted">
                  No broker fee. You message the host directly.
                </p>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Enquiry Modal */}
      <Modal
        open={enquire}
        onClose={() => setEnquire(false)}
        title="Send an enquiry"
        description={`Your message goes straight to ${host?.name ?? 'the host'}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEnquire(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={sending} onClick={send}>
              Send enquiry
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Message" htmlFor="enq" required hint="Minimum 5 characters">
            <Textarea
              id="enq"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself, your move-in timeline, and any questions..."
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}