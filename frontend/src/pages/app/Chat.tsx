import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  MessageCircleIcon,
  SendIcon,
  AlertCircleIcon,
} from 'lucide-react';
import type { ChatMessage, ChatThread } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/States';
import { api } from '../../services/api';

export function Chat() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<ChatThread[] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Load user's active chat threads
  const loadThreads = async () => {
    try {
      const data = await api.getChatThreads();
      setThreads(data);
    } catch {
      setThreads([]);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  // Load messages for the selected thread and poll every 4 seconds
  useEffect(() => {
    if (!threadId) {
      setMessages(null);
      return;
    }
    let alive = true;

    const fetchMessages = async () => {
      try {
        const msgs = await api.getChatMessages(threadId);
        if (alive) setMessages(msgs);
      } catch {
        if (alive) setMessages([]);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const activeThread = useMemo(
    () => threads?.find((t) => t.id === threadId),
    [threads, threadId]
  );

  const person = activeThread?.participant;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !threadId || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const newMsg = await api.sendChatMessage(threadId, body);
      setMessages((prev) => [...(prev ?? []), newMsg]);
      setDraft('');
      // Update thread preview in sidebar
      setThreads((prev) =>
        prev?.map((t) =>
          t.id === threadId
            ? { ...t, lastMessage: body, lastAt: 'Just now' }
            : t
        ) ?? null
      );
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const list = (
    <ul className="scrollbar-thin divide-y divide-stone-100 overflow-y-auto">
      {(threads ?? []).map((t) => {
        const p = t.participant;
        const isSelected = t.id === threadId;
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => navigate(`/app/chat/${t.id}`)}
              className={`flex w-full items-start gap-3 p-3.5 text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-sage-100/70 border-l-4 border-sage-500'
                  : 'hover:bg-stone-50/80 text-stone-700'
              }`}
            >
              <Avatar name={p?.name ?? 'Member'} src={p?.avatar} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold text-wellness-dark">
                    {p?.name ?? 'Member'}
                  </span>
                  <span className="shrink-0 text-[10px] text-wellness-muted font-medium">{t.lastAt}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-wellness-muted">
                  {t.lastMessage}
                </span>
                {t.context && (
                  <span className="mt-1 inline-block text-[10px] font-semibold text-sage-700">
                    {t.context}
                  </span>
                )}
              </span>
              {t.unread > 0 && (
                <span className="mt-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-peach-500 px-1 text-[10px] font-bold text-white shadow-xs">
                  {t.unread}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="h-[calc(100vh-10.5rem)] overflow-hidden rounded-4xl border border-stone-200/80 bg-white/95 shadow-floating lg:h-[calc(100vh-7.5rem)] backdrop-blur-sm">
      <div className="grid h-full lg:grid-cols-[20rem_1fr]">
        {/* Thread Sidebar */}
        <aside
          className={`flex h-full min-h-0 flex-col border-stone-200/80 lg:border-r ${
            threadId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="border-b border-stone-100 px-5 py-4">
            <h1 className="font-display text-base font-bold text-wellness-dark tracking-tight">Conversations</h1>
            <p className="text-xs text-wellness-muted">Available with accepted matches</p>
          </div>
          {!threads ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs text-wellness-muted">
              <MessageCircleIcon className="mb-2 h-7 w-7 text-stone-300" aria-hidden />
              <p className="font-semibold text-wellness-dark">No conversations yet.</p>
              <p className="mt-1 text-[11px] text-stone-400">
                Match with roommates to start chatting.
              </p>
            </div>
          ) : (
            list
          )}
        </aside>

        {/* Message Area */}
        <section className={`flex h-full min-h-0 flex-col ${threadId ? 'flex' : 'hidden lg:flex'}`}>
          {!activeThread ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={<MessageCircleIcon className="h-6 w-6" aria-hidden />}
                title="Pick a conversation"
                description="Chats open once a match request is accepted."
              />
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="flex items-center gap-3 border-b border-stone-100 px-5 py-3.5 bg-white/90">
                <button
                  type="button"
                  onClick={() => navigate('/app/chat')}
                  aria-label="Back to conversations"
                  className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 lg:hidden cursor-pointer"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <Avatar
                  name={person?.name ?? 'Member'}
                  src={person?.avatar}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-wellness-dark">{person?.name ?? 'Member'}</p>
                    {person?.verification === 'verified' && (
                      <span className="text-[10px] font-semibold text-sage-700 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200/60">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-wellness-muted font-medium">
                    {person?.occupation || activeThread.context || 'Accepted Match'}
                  </p>
                </div>
                {activeThread.context && (
                  <Badge tone="sage" className="hidden sm:inline-flex">
                    {activeThread.context}
                  </Badge>
                )}
              </header>

              {/* Message Feed */}
              <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-stone-50/50 p-4 sm:p-5">
                {!messages ? (
                  <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-wellness-muted">
                    <MessageCircleIcon className="mb-2 h-7 w-7 text-stone-300" aria-hidden />
                    <p className="text-sm font-semibold text-wellness-dark">No messages yet. Say hello!</p>
                    <p className="mt-1 text-xs text-wellness-muted">
                      Break the ice about flat visits, neighborhoods, and move-in timelines.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((m) => {
                      const mine = m.senderId === 'me' || m.senderId === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs sm:max-w-[65%] ${
                              mine
                                ? 'rounded-2xl rounded-br-xs bg-stone-900 text-white'
                                : 'rounded-2xl rounded-bl-xs border border-stone-200/80 bg-white text-stone-800'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p
                              className={`mt-1 text-[10px] text-right font-medium ${
                                mine ? 'text-stone-300' : 'text-stone-400'
                              }`}
                            >
                              {m.at}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />
                  </>
                )}
              </div>

              {/* Error banner if send failed */}
              {sendError && (
                <div className="flex items-center gap-2 border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                  <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{sendError}</span>
                </div>
              )}

              {/* Message Composer */}
              <form onSubmit={send} className="flex items-center gap-2 border-t border-stone-100 p-3.5 bg-white/95">
                <label htmlFor="draft" className="sr-only">
                  Message
                </label>
                <input
                  id="draft"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${person?.name ? person.name.split(' ')[0] : 'roommate'}...`}
                  maxLength={1000}
                  disabled={sending}
                  className="h-11 flex-1 rounded-2xl border border-stone-200/80 bg-stone-50/70 px-4 text-xs sm:text-sm text-wellness-dark placeholder:text-stone-400 focus:border-sage-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-200 disabled:opacity-50 transition-colors"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!draft.trim() || sending}
                  loading={sending}
                  aria-label="Send message"
                  icon={<SendIcon className="h-3.5 w-3.5" aria-hidden />}
                >
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
