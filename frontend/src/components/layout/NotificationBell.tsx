import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon } from 'lucide-react';
import { notifications as seed } from '../../data/mock';

/** TODO: replace the seed list with socket.on('notify') pushes. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(seed);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cream-300 bg-white text-navy-700 transition-colors duration-150 ease-out hover:border-violet-200 hover:text-violet-700">
        
        <BellIcon className="h-5 w-5" aria-hidden />
        {unread > 0 &&
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-coral-400 px-1 text-[11px] font-bold text-white">
            {unread}
          </span>
        }
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 z-50 mt-2 w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-lift">
          
            <div className="flex items-center justify-between border-b border-cream-300 px-4 py-3">
              <p className="font-display text-sm font-bold text-navy-900">Notifications</p>
              {unread > 0 &&
            <button
              type="button"
              onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700">
              
                  Mark all read
                </button>
            }
            </div>
            <ul className="scrollbar-thin max-h-80 divide-y divide-cream-300 overflow-y-auto">
              {items.slice(0, 6).map((n) =>
            <li key={n.id}>
                  <button
                type="button"
                onClick={() => {
                  setItems((prev) =>
                  prev.map((x) => x.id === n.id ? { ...x, read: true } : x)
                  );
                  setOpen(false);
                  navigate(n.link);
                }}
                className={`flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-cream-200 ${
                n.read ? '' : 'bg-violet-50/60'}`
                }>
                
                    <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  n.read ? 'bg-cream-300' : 'bg-coral-400'}`
                  }
                  aria-hidden />
                
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-navy-900">{n.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-navy-500">{n.body}</span>
                      <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-navy-500/70">
                        {n.at}
                      </span>
                    </span>
                  </button>
                </li>
            )}
            </ul>
            <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/app/notifications');
            }}
            className="w-full border-t border-cream-300 px-4 py-3 text-sm font-semibold text-violet-600 hover:bg-cream-200">
            
              View all notifications
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}