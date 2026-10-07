import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  HeartHandshakeIcon,
  HomeIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react';
import type { AppNotification, NotificationKind } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { RevealOnScroll } from '../../components/ui/RevealOnScroll';
import { api } from '../../services/api';

const icons: Record<NotificationKind, React.ElementType> = {
  match_request: HeartHandshakeIcon,
  match_accepted: SparklesIcon,
  message: MessageCircleIcon,
  room: HomeIcon,
  verification: ShieldCheckIcon,
  system: BellIcon,
};

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
] as const;

export function Notifications() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('all');

  useEffect(() => {
    let alive = true;
    api.getNotifications().then((n) => alive && setItems(n));
    return () => {
      alive = false;
    };
  }, []);

  const rows = (items ?? []).filter((n) => (tab === 'unread' ? !n.read : true));
  const unread = (items ?? []).filter((n) => !n.read).length;

  return (
    <div className="relative">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-60" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-50" />

      <PageHeader
        eyebrow="NOTIFICATIONS"
        title="Everything that needs you"
        description="Match requests, messages, room alerts and verification updates in one place."
        action={
          unread > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await api.markAllNotificationsRead();
                } catch {
                  // Non-blocking
                }
                setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
              }}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div
        role="tablist"
        aria-label="Notification filter"
        className="mb-6 inline-flex gap-1.5 rounded-2xl border border-stone-200/80 bg-white/90 p-1.5 shadow-xs"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-wellness-dark text-white shadow-xs'
                : 'text-wellness-muted hover:bg-stone-100 hover:text-wellness-dark'
            }`}
          >
            {t.label}
            {t.key === 'unread' && unread > 0 && ` (${unread})`}
          </button>
        ))}
      </div>

      {!items ? (
        <LoadingState label="Loading notifications..." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-6 w-6" aria-hidden />}
          title={tab === 'unread' ? 'You are all caught up' : 'No notifications yet'}
          description="New match requests and messages will show up here in real time."
        />
      ) : (
        <RevealOnScroll>
          <Card padded={false} className="overflow-hidden rounded-4xl border border-stone-200/80 bg-white/95 shadow-floating backdrop-blur-sm">
            <ul className="divide-y divide-stone-100">
              {rows.map((n) => {
                const Icon = icons[n.kind] || BellIcon;
                return (
                  <li key={n.id}>
                    <Link
                      to={n.link || '/app/notifications'}
                      onClick={() => {
                        if (!n.read) {
                          api.markNotificationRead(n.id).catch(() => {});
                        }
                        setItems(
                          (prev) =>
                            prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null
                        );
                      }}
                      className={`flex gap-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-stone-50/80 ${
                        n.read ? '' : 'bg-sage-50/40'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          n.read
                            ? 'bg-stone-100 text-stone-500'
                            : 'bg-sage-100 text-sage-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className="text-sm font-bold text-wellness-dark">{n.title}</span>
                          {!n.read && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-peach-500"
                              aria-label="Unread"
                            />
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-stone-600 leading-relaxed">{n.body}</span>
                        <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wider text-wellness-muted">
                          {n.at}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </RevealOnScroll>
      )}
    </div>
  );
}