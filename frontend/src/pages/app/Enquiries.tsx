import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SendIcon,
  BuildingIcon,
  MapPinIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Field, Textarea, Select } from '../../components/ui/Field';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { api, RoomEnquiryResponse } from '../../services/api';
import { rupees } from '../../utils/format';

export function Enquiries() {
  const [tab, setTab] = useState<'mine' | 'received'>('mine');
  const [myEnquiries, setMyEnquiries] = useState<RoomEnquiryResponse[] | null>(null);
  const [receivedEnquiries, setReceivedEnquiries] = useState<RoomEnquiryResponse[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal response state for host
  const [respondingTo, setRespondingTo] = useState<RoomEnquiryResponse | null>(null);
  const [responseStatus, setResponseStatus] = useState<'responded' | 'closed'>('responded');
  const [responseMsg, setResponseMsg] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [mine, received] = await Promise.all([
        api.getMyEnquiries(),
        api.getReceivedEnquiries(),
      ]);
      setMyEnquiries(mine);
      setReceivedEnquiries(received);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitHostResponse() {
    if (!respondingTo) return;
    if (responseStatus === 'responded' && responseMsg.trim().length < 2) {
      setResponseError('Please enter a response message of at least 2 characters.');
      return;
    }
    setResponseError('');
    setSubmittingResponse(true);

    try {
      await api.respondToEnquiry(
        respondingTo.id,
        responseStatus,
        responseMsg.trim() || undefined
      );
      setSubmittingResponse(false);
      setRespondingTo(null);
      setResponseMsg('');
      await loadData();
    } catch (err: any) {
      setSubmittingResponse(false);
      setResponseError(err.message || 'Failed to submit response.');
    }
  }

  function renderStatusBadge(status: string) {
    if (status === 'responded') {
      return (
        <Badge tone="mint">
          <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden />
          Responded
        </Badge>
      );
    }
    if (status === 'closed') {
      return (
        <Badge tone="neutral">
          <XCircleIcon className="h-3.5 w-3.5" aria-hidden />
          Closed
        </Badge>
      );
    }
    return (
      <Badge tone="amber">
        <ClockIcon className="h-3.5 w-3.5" aria-hidden />
        Pending reply
      </Badge>
    );
  }

  return (
    <div className="relative">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-60" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-50" />

      <PageHeader
        eyebrow="DIRECT MESSAGES"
        title="Room enquiries"
        description="Direct messages between flatmates and room hosts. No middleman, no broker fees."
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-stone-200/80 pb-3">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            tab === 'mine'
              ? 'bg-wellness-dark text-white shadow-xs'
              : 'text-wellness-muted hover:bg-stone-100 hover:text-wellness-dark'
          }`}
        >
          <SendIcon className="h-3.5 w-3.5" aria-hidden />
          My enquiries
          {myEnquiries !== null && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                tab === 'mine' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {myEnquiries.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('received')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            tab === 'received'
              ? 'bg-wellness-dark text-white shadow-xs'
              : 'text-wellness-muted hover:bg-stone-100 hover:text-wellness-dark'
          }`}
        >
          <BuildingIcon className="h-3.5 w-3.5" aria-hidden />
          Received for my rooms
          {receivedEnquiries !== null && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                tab === 'received' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {receivedEnquiries.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <LoadingState label="Loading room enquiries..." />
      ) : tab === 'mine' ? (
        myEnquiries && myEnquiries.length > 0 ? (
          <RevealOnScroll>
            <div className="space-y-4">
              {myEnquiries.map((enq) => (
                <Card key={enq.id} className="rounded-3xl border border-stone-200/80 bg-white/95 p-5 sm:p-6 shadow-soft hover:shadow-floating transition-all backdrop-blur-sm">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {renderStatusBadge(enq.status)}
                        <span className="text-xs text-wellness-muted">
                          Sent on {new Date(enq.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Room Summary Header */}
                      {enq.room && (
                        <div className="flex items-center gap-3 rounded-2xl bg-stone-50/80 border border-stone-100 p-3">
                          {enq.room.image ? (
                            <img
                              src={enq.room.image}
                              alt={enq.room.title}
                              className="h-12 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                              <BuildingIcon className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/app/rooms/${enq.roomId}`}
                              className="font-bold text-sm text-wellness-dark hover:text-stone-900 truncate block transition-colors"
                            >
                              {enq.room.title}
                            </Link>
                            <p className="flex items-center gap-1 text-xs text-wellness-muted">
                              <MapPinIcon className="h-3 w-3 text-sage-600 shrink-0" />
                              {enq.room.locality}, {enq.room.city} ·{' '}
                              <span className="font-semibold text-wellness-dark">
                                {rupees(enq.room.rent)}/mo
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Host details */}
                      {enq.host && (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={enq.host.name} src={enq.host.avatarUrl} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-wellness-dark">
                                Host: {enq.host.name}
                              </p>
                              <VerificationBadge status={enq.host.verificationStatus as any} />
                            </div>
                            <p className="text-[11px] text-wellness-muted">{enq.host.city}</p>
                          </div>
                        </div>
                      )}

                      {/* My enquiry message */}
                      <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-wellness-muted">
                          Your message
                        </p>
                        <p className="mt-1 text-xs sm:text-sm text-stone-700 leading-relaxed">{enq.message}</p>
                      </div>

                      {/* Host response */}
                      {enq.responseMessage && (
                        <div
                          className={`rounded-2xl p-3.5 border ${
                            enq.status === 'responded'
                              ? 'bg-sage-50/90 border-sage-200 text-stone-800'
                              : 'bg-stone-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-sage-700">
                              Host reply
                            </p>
                            {enq.respondedAt && (
                              <span className="text-[11px] text-sage-600">
                                {new Date(enq.respondedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed">{enq.responseMessage}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between sm:items-end">
                      <Link to={`/app/rooms/${enq.roomId}`}>
                        <Button variant="secondary" size="sm">
                          View room
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </RevealOnScroll>
        ) : (
          <EmptyState
            title="No room enquiries yet"
            description="When you find a room you like, click 'Send enquiry' on the listing to message the host directly."
            action={
              <Link to="/app/rooms">
                <Button variant="primary">Browse listings</Button>
              </Link>
            }
          />
        )
      ) : receivedEnquiries && receivedEnquiries.length > 0 ? (
        <RevealOnScroll>
          <div className="space-y-4">
            {receivedEnquiries.map((enq) => (
              <Card key={enq.id} className="rounded-3xl border border-stone-200/80 bg-white/95 p-5 sm:p-6 shadow-soft hover:shadow-floating transition-all backdrop-blur-sm">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {renderStatusBadge(enq.status)}
                      <span className="text-xs text-wellness-muted">
                        Received on {new Date(enq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Room Summary Header */}
                    {enq.room && (
                      <div className="flex items-center gap-3 rounded-2xl bg-stone-50/80 border border-stone-100 p-3">
                        {enq.room.image ? (
                          <img
                            src={enq.room.image}
                            alt={enq.room.title}
                            className="h-12 w-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                            <BuildingIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/app/rooms/${enq.roomId}`}
                            className="font-bold text-sm text-wellness-dark hover:text-stone-900 truncate block transition-colors"
                          >
                            {enq.room.title}
                          </Link>
                          <p className="flex items-center gap-1 text-xs text-wellness-muted">
                            <MapPinIcon className="h-3 w-3 text-sage-600 shrink-0" />
                            {enq.room.locality}, {enq.room.city} ·{' '}
                            <span className="font-semibold text-wellness-dark">
                              {rupees(enq.room.rent)}/mo
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Requester Profile */}
                    {enq.requester && (
                      <div className="flex items-center gap-2.5">
                        <Avatar name={enq.requester.name} src={enq.requester.avatarUrl} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-wellness-dark">
                              Enquiry from {enq.requester.name}
                            </p>
                            <VerificationBadge status={enq.requester.verificationStatus as any} />
                          </div>
                          <p className="text-[11px] text-wellness-muted">
                            {enq.requester.occupation} · {enq.requester.city}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-wellness-muted">
                        Message from flatmate
                      </p>
                      <p className="mt-1 text-xs sm:text-sm text-stone-700 leading-relaxed">{enq.message}</p>
                    </div>

                    {/* Host reply */}
                    {enq.responseMessage && (
                      <div
                        className={`rounded-2xl p-3.5 border ${
                          enq.status === 'responded'
                            ? 'bg-sage-50/90 border-sage-200 text-stone-800'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-sage-700">
                            Your reply
                          </p>
                          {enq.respondedAt && (
                            <span className="text-[11px] text-sage-600">
                              {new Date(enq.respondedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed">{enq.responseMessage}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-3 sm:items-end">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={enq.status === 'pending' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => {
                          setRespondingTo(enq);
                          setResponseStatus(enq.status === 'closed' ? 'closed' : 'responded');
                          setResponseMsg(enq.responseMessage || '');
                          setResponseError('');
                        }}
                      >
                        {enq.status === 'pending' ? 'Respond' : 'Update response'}
                      </Button>
                      <Link to={`/app/rooms/${enq.roomId}`}>
                        <Button variant="secondary" size="sm">
                          View room
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </RevealOnScroll>
      ) : (
        <EmptyState
          title="No enquiries received yet"
          description="Enquiries from prospective flatmates for your room listings will appear here."
          action={
            <Link to="/app/rooms/create">
              <Button variant="primary">Post a room listing</Button>
            </Link>
          }
        />
      )}

      {/* Host Response Modal */}
      <Modal
        open={!!respondingTo}
        onClose={() => setRespondingTo(null)}
        title="Respond to room enquiry"
        description={`Respond to ${
          respondingTo?.requester?.name ?? 'the flatmate'
        } for "${respondingTo?.room?.title ?? 'Room'}".`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRespondingTo(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submittingResponse}
              onClick={submitHostResponse}
            >
              Send reply
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Action" htmlFor="respStatus">
            <Select
              id="respStatus"
              value={responseStatus}
              onChange={(e) => setResponseStatus(e.target.value as any)}
            >
              <option value="responded">Reply & confirm availability</option>
              <option value="closed">Close enquiry / room no longer available</option>
            </Select>
          </Field>

          <Field
            label="Response message"
            htmlFor="respMsg"
            required={responseStatus === 'responded'}
            hint="Share your contact preference, next steps, or schedule a viewing"
          >
            <Textarea
              id="respMsg"
              rows={4}
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              placeholder="Hi! Yes, the room is available. Let's connect..."
            />
          </Field>

          {responseError && (
            <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
              {responseError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
