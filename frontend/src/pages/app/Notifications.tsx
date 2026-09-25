import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  HeartHandshakeIcon,
  HomeIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  SparklesIcon } from
'lucide-react';
import type { AppNotification, NotificationKind } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { api } from '../../services/api';

const icons: Record<NotificationKind, React.ElementType> = {
  match_request: HeartHandshakeIcon,
  match_accepted: SparklesIcon,
  message: MessageCircleIcon,
  room: HomeIcon,
  verification: ShieldCheckIcon,
  system: BellIcon
};

const tabs = [
{ key: 'all', label: 'All' },
{ key: 'unread', label: 'Unread' }] as
const;

export function Notifications() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('all');

  useEffect(() => {
    let alive = true;
    // TODO: GET /api/notifications + socket.on('notify')
    api.getNotifications().then((n) => alive && setItems(n));
    return () => {
      alive = false;
    };
  }, []);

  const rows = (items ?? []).filter((n) => tab === 'unread' ? !n.read : true);
  const unread = (items ?? []).filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Everything that needs you"
        description="Match requests, messages, room alerts and verification updates in one place."
        action={
        unread > 0 ?
        <Button
          variant="secondary"
          onClick={() => setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null)}>
          
              Mark all as read
            </Button> :
        undefined
        } />
      

      <div role="tablist" aria-label="Notification filter" className="mb-6 flex gap-1 rounded-2xl border border-cream-300 bg-white p-1.5">
        {tabs.map((t) =>
        <button
          key={t.key}
          role="tab"
          aria-selected={tab === t.key}
          onClick={() => setTab(t.key)}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out ${
          tab === t.key ? 'bg-navy-900 text-white' : 'text-navy-600 hover:bg-cream-200'}`
          }>
          
            {t.label}
            {t.key === 'unread' && unread > 0 && ` (${unread})`}
          </button>
        )}
      </div>

      {!items ?
      <LoadingState label="Loading notifications…" /> :
      rows.length === 0 ?
      <EmptyState
        icon={<BellIcon className="h-6 w-6" aria-hidden />}
        title={tab === 'unread' ? 'You are all caught up' : 'No notifications yet'}
        description="New match requests and messages will show up here in real time." /> :


      <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-cream-300">
            {rows.map((n) => {
            const Icon = icons[n.kind];
            return (
              <li key={n.id}>
                  <Link
                  to={n.link}
                  onClick={() =>
                  setItems(
                    (prev) => prev?.map((x) => x.id === n.id ? { ...x, read: true } : x) ?? null
                  )
                  }
                  className={`flex gap-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-cream-200 ${
                  n.read ? '' : 'bg-violet-50/50'}`
                  }>
                  
                    <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    n.read ? 'bg-cream-200 text-navy-500' : 'bg-violet-coral text-white'}`
                    }>
                    
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-bold text-navy-900">{n.title}</span>
                        {!n.read &&
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral-400" aria-label="Unread" />
                      }
                      </span>
                      <span className="mt-0.5 block text-sm text-navy-600">{n.body}</span>
                      <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-wide text-navy-500/70">
                        {n.at}
                      </span>
                    </span>
                  </Link>
                </li>);

          })}
          </ul>
        </Card>
      }
    </div>);

}