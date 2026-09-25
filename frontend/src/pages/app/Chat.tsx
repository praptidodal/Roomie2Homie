import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, MessageCircleIcon, SendIcon } from 'lucide-react';
import type { ChatMessage, ChatThread, Profile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/States';
import { api } from '../../services/api';
import { profiles } from '../../data/mock';

/**
 * Real-time placeholders:
 *   socket.on('message')  -> append incoming message
 *   socket.on('typing')   -> toggle the typing indicator
 *   socket.on('presence') -> update the online dot
 */
export function Chat() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    api.getThreads().then((t) => {
      if (!alive) return;
      setThreads(t);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!threadId) {
      setMessages(null);
      return;
    }
    let alive = true;
    setMessages(null);
    api.getMessages(threadId).then((m) => alive && setMessages(m));
    return () => {
      alive = false;
    };
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const activeThread = useMemo(
    () => threads?.find((t) => t.id === threadId),
    [threads, threadId]
  );
  const person: Profile | undefined = profiles.find((p) => p.id === activeThread?.participantId);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !threadId) return;
    const mine: ChatMessage = {
      id: `local-${Date.now()}`,
      threadId,
      senderId: 'me',
      body,
      at: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      read: true
    };
    setMessages((prev) => [...(prev ?? []), mine]);
    setDraft('');
    // TODO: socket.emit('message', { threadId, body })
    await api.sendMessage(threadId, body);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
      ...(prev ?? []),
      {
        id: `reply-${Date.now()}`,
        threadId,
        senderId: activeThread?.participantId ?? 'p2',
        body: 'Sounds good! I will confirm the visit time by evening.',
        at: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
        read: true
      }]
      );
    }, 1600);
  }

  const list =
  <ul className="scrollbar-thin divide-y divide-cream-300 overflow-y-auto">
      {(threads ?? []).map((t) => {
      const p = profiles.find((x) => x.id === t.participantId);
      return (
        <li key={t.id}>
            <button
            type="button"
            onClick={() => navigate(`/app/chat/${t.id}`)}
            className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors duration-150 ease-out hover:bg-cream-200 ${
            t.id === threadId ? 'bg-violet-50' : ''}`
            }>
            
              <Avatar name={p?.name ?? 'Member'} src={p?.avatar} size="sm" online={t.online} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-bold text-navy-900">{p?.name}</span>
                  <span className="shrink-0 text-[11px] text-navy-500">{t.lastAt}</span>
                </span>
                <span className="mt-0.5 block truncate text-sm text-navy-500">
                  {t.lastMessage}
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-violet-500">
                  {t.context}
                </span>
              </span>
              {t.unread > 0 &&
            <span className="mt-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-coral-400 px-1 text-[11px] font-bold text-white">
                  {t.unread}
                </span>
            }
            </button>
          </li>);

    })}
    </ul>;


  return (
    <div className="h-[calc(100vh-10.5rem)] overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-soft lg:h-[calc(100vh-7.5rem)]">
      <div className="grid h-full lg:grid-cols-[20rem_1fr]">
        <aside
          className={`flex h-full min-h-0 flex-col border-cream-300 lg:border-r ${
          threadId ? 'hidden lg:flex' : 'flex'}`
          }>
          
          <div className="border-b border-cream-300 px-4 py-4">
            <h1 className="font-display text-lg font-extrabold text-navy-900">Chat</h1>
            <p className="text-xs text-navy-500">Unlocked with accepted matches and room hosts</p>
          </div>
          {!threads ?
          <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div> :

          list
          }
        </aside>

        <section className={`flex h-full min-h-0 flex-col ${threadId ? 'flex' : 'hidden lg:flex'}`}>
          {!activeThread ?
          <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
              icon={<MessageCircleIcon className="h-6 w-6" aria-hidden />}
              title="Pick a conversation"
              description="Chats open once a match request is accepted or you enquire about a room." />
            
            </div> :

          <>
              <header className="flex items-center gap-3 border-b border-cream-300 px-4 py-3">
                <button
                type="button"
                onClick={() => navigate('/app/chat')}
                aria-label="Back to conversations"
                className="rounded-xl p-2 text-navy-500 hover:bg-cream-200 lg:hidden">
                
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <Avatar
                name={person?.name ?? 'Member'}
                src={person?.avatar}
                size="sm"
                online={activeThread.online} />
              
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-navy-900">{person?.name}</p>
                  <p className="text-xs text-navy-500">
                    {typing ? 'Typing…' : activeThread.online ? 'Online now' : 'Offline'}
                  </p>
                </div>
                <Badge tone="violet" className="hidden sm:inline-flex">
                  {activeThread.context}
                </Badge>
              </header>

              <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-cream-200 p-4">
                {!messages ?
              <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div> :

              <>
                    {messages.map((m) => {
                  const mine = m.senderId === 'me';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      
                          <div
                        className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[65%] ${
                        mine ?
                        'rounded-br-lg bg-violet-coral text-white' :
                        'rounded-bl-lg bg-white text-navy-800'}`
                        }>
                        
                            <p>{m.body}</p>
                            <p
                          className={`mt-1 text-[11px] ${
                          mine ? 'text-white/70' : 'text-navy-500'}`
                          }>
                          
                              {m.at}
                            </p>
                          </div>
                        </div>);

                })}
                    {typing &&
                <div className="flex justify-start">
                        <div className="flex gap-1 rounded-3xl rounded-bl-lg bg-white px-4 py-3 shadow-sm">
                          {[0, 1, 2].map((i) =>
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-violet-300"
                      style={{ animationDelay: `${i * 120}ms` }} />

                    )}
                        </div>
                      </div>
                }
                    <div ref={endRef} />
                  </>
              }
              </div>

              <form onSubmit={send} className="flex items-center gap-2 border-t border-cream-300 p-3">
                <label htmlFor="draft" className="sr-only">
                  Message
                </label>
                <input
                id="draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${person?.name.split(' ')[0] ?? ''}…`}
                className="h-11 flex-1 rounded-2xl border border-cream-300 bg-cream-200 px-4 text-sm text-navy-900 placeholder:text-navy-500/60 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200" />
              
                <Button
                type="submit"
                variant="gradient"
                disabled={!draft.trim()}
                aria-label="Send message"
                icon={<SendIcon className="h-4 w-4" aria-hidden />}>
                
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </>
          }
        </section>
      </div>
    </div>);

}