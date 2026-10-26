import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon } from 'lucide-react';
import type { AppNotification } from '../../types';
import { api } from '../../services/api';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Poll unread count every 20 seconds while app is active
  useEffect(() => {
    let alive = true;
    const fetchCount = async () => {
      try {
        const count = await api.getUnreadNotificationCount();
        if (alive) setUnreadCount(count);
      } catch {
        // Non-blocking
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 20000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch full notifications list whenever the dropdown is opened
  useEffect(() => {
    if (!open) return;
    let alive = true;
    api
      .getNotifications()
      .then((data) => {
        if (!alive) return;
        setItems(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      })
      .catch(() => {});

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => {
      alive = false;
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Non-blocking
    }
  };

  const handleItemClick = async (n: AppNotification) => {
    if (!n.read) {
      api.markNotificationRead(n.id).catch(() => {});
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
    navigate(n.link || '/app/notifications');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-wellness-dark transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50/80 shadow-soft active:scale-[0.96]"
      >
        <BellIcon className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-peach-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 z-50 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/95 shadow-floating backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <p className="font-display text-sm font-bold text-wellness-dark tracking-tight">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-stone-500 hover:text-wellness-dark transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="scrollbar-thin max-h-80 divide-y divide-stone-100 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-5 py-8 text-center text-xs text-wellness-muted">
                  No notifications yet.
                </li>
              ) : (
                items.slice(0, 6).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`flex w-full gap-3 px-5 py-3.5 text-left transition-colors duration-150 ease-out hover:bg-stone-50/80 ${
                        n.read ? '' : 'bg-sage-50/50'
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.read ? 'bg-stone-300' : 'bg-peach-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-wellness-dark">{n.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-wellness-muted">{n.body}</span>
                        <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-stone-400">
                          {n.at}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/app/notifications');
              }}
              className="w-full border-t border-stone-100 px-5 py-3 text-center text-xs font-semibold text-wellness-dark hover:bg-stone-50 transition-colors"
            >
              View all notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}