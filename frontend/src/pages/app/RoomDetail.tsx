import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  MapPinIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  UsersIcon } from
'lucide-react';
import type { Profile, Room } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { api } from '../../services/api';
import { monthDay, rupees, titleCase } from '../../utils/format';

export function RoomDetail() {
  const { roomId = '' } = useParams();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [host, setHost] = useState<Profile | undefined>();
  const [active, setActive] = useState(0);
  const [enquire, setEnquire] = useState(false);
  const [message, setMessage] = useState(
    'Hi! I saw your listing and my budget and move-in date line up. Is the room still available?'
  );
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

  if (room === undefined) return <LoadingState label="Loading listing…" />;
  if (!room)
  return (
    <EmptyState
      title="Listing not found"
      description="This room may have been taken down by the host."
      action={
      <Link to="/app/rooms">
            <Button variant="gradient">Back to rooms</Button>
          </Link>
      } />);



  const total =
  room.bills.rent + room.bills.maintenance + room.bills.internet + room.bills.electricity;

  async function send() {
    setSending(true);
    // TODO: POST /api/chat/threads → then socket.emit('message')
    await api.sendMessage('new', message);
    setSending(false);
    setSent(true);
    setEnquire(false);
  }

  return (
    <div>
      <Link
        to="/app/rooms"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 transition-colors duration-150 ease-out hover:text-navy-900">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        Back to rooms
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div>
            <div className="overflow-hidden rounded-3xl border border-cream-300 bg-white p-2 shadow-soft">
              <img
                src={room.images[active]}
                alt={`${room.title} — photo ${active + 1}`}
                className="h-72 w-full rounded-[1.25rem] object-cover sm:h-96" />
              
            </div>
            <div className="mt-3 flex gap-3">
              {room.images.map((img, i) =>
              <button
                key={img}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View photo ${i + 1}`}
                aria-current={active === i}
                className={`h-16 w-24 overflow-hidden rounded-2xl border-2 transition-colors duration-150 ease-out ${
                active === i ? 'border-violet-500' : 'border-transparent hover:border-cream-300'}`
                }>
                
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              )}
            </div>
          </div>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="navy">{titleCase(room.type)}</Badge>
                  {room.verified &&
                  <Badge tone="mint">
                      <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
                      Verified listing
                    </Badge>
                  }
                  <Badge tone="neutral">{titleCase(room.furnishing)}</Badge>
                </div>
                <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy-900">
                  {room.title}
                </h1>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-navy-500">
                  <MapPinIcon className="h-4 w-4 text-violet-500" aria-hidden />
                  {room.locality}, {room.city}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-extrabold text-navy-900">
                  {rupees(room.rent)}
                </p>
                <p className="text-sm text-navy-500">per month</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-navy-600">{room.description}</p>

            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-cream-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-500">
                  <UsersIcon className="h-4 w-4" aria-hidden />
                  Flatmates
                </dt>
                <dd className="mt-1 font-display text-lg font-bold text-navy-900">
                  {room.flatmates === 0 ? 'Live solo' : `${room.flatmates} people`}
                </dd>
              </div>
              <div className="rounded-2xl bg-cream-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-500">
                  <CalendarCheckIcon className="h-4 w-4" aria-hidden />
                  Available
                </dt>
                <dd className="mt-1 font-display text-lg font-bold text-navy-900">
                  {monthDay(room.availableFrom)}
                </dd>
              </div>
              <div className="rounded-2xl bg-cream-200 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">
                  Preferred
                </dt>
                <dd className="mt-1 font-display text-lg font-bold text-navy-900">
                  {room.preferredGender === 'any' ? 'Anyone' : titleCase(room.preferredGender)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Amenities" />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {room.amenities.map((a) =>
              <li key={a} className="flex items-center gap-2 text-sm text-navy-700">
                  <CheckCircle2Icon className="h-4 w-4 shrink-0 text-mint-500" aria-hidden />
                  {a}
                </li>
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader title="House rules" description="Agreed by everyone in the flat." />
            <ul className="space-y-2.5">
              {room.houseRules.map((r) =>
              <li key={r} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral-400" aria-hidden />
                  {r}
                </li>
              )}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Monthly cost" description="What you actually pay each month." />
            <dl className="space-y-2.5 text-sm">
              {[
              ['Rent', room.bills.rent],
              ['Maintenance', room.bills.maintenance],
              ['Internet', room.bills.internet],
              ['Electricity (avg)', room.bills.electricity]].
              map(([label, value]) =>
              <div key={label as string} className="flex items-center justify-between">
                  <dt className="text-navy-500">{label as string}</dt>
                  <dd className="font-semibold text-navy-800">{rupees(value as number)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-cream-300 pt-3">
                <dt className="font-display font-bold text-navy-900">Total per month</dt>
                <dd className="font-display text-xl font-extrabold text-violet-600">
                  {rupees(total)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-navy-500">Security deposit</dt>
                <dd className="font-semibold text-navy-800">{rupees(room.deposit)}</dd>
              </div>
            </dl>
          </Card>

          {host &&
          <Card>
              <CardHeader title="Listed by" />
              <div className="flex items-center gap-3">
                <Avatar name={host.name} src={host.avatar} ring />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-navy-900">{host.name}</p>
                    <VerificationBadge status={host.verification} />
                  </div>
                  <p className="text-xs text-navy-500">
                    {host.occupation} · {host.lastActive}
                  </p>
                </div>
              </div>
              <Link to={`/app/discover/${host.id}`} className="mt-4 block">
                <Button variant="secondary" block>
                  View compatibility
                </Button>
              </Link>
            </Card>
          }

          <Card className="sticky top-24">
            {sent ?
            <div className="space-y-3">
                <p className="rounded-2xl bg-mint-50 p-4 text-sm font-semibold text-mint-600">
                  Enquiry sent to {host?.name.split(' ')[0]}. Replies land in your chat.
                </p>
                <Link to="/app/chat">
                  <Button variant="secondary" block>
                    Go to chat
                  </Button>
                </Link>
              </div> :

            <>
                <Button
                variant="gradient"
                size="lg"
                block
                onClick={() => setEnquire(true)}
                icon={<MessageCircleIcon className="h-4 w-4" aria-hidden />}>
                
                  Enquire about this room
                </Button>
                <p className="mt-3 text-center text-xs text-navy-500">
                  No broker fee. You message the host directly.
                </p>
              </>
            }
          </Card>
        </div>
      </div>

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
            <Button variant="gradient" loading={sending} onClick={send}>
              Send enquiry
            </Button>
          </>
        }>
        
        <Field label="Message" htmlFor="enq" required>
          <Textarea
            id="enq"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)} />
          
        </Field>
      </Modal>
    </div>);

}