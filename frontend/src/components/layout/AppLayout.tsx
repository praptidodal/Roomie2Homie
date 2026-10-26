import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  ShieldCheckIcon,
  XIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { VerificationBadge } from '../ui/Badge';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { appNav, mobileNav, primaryNav, secondaryNav } from './navConfig';
import { GrainOverlay } from '../ui/GrainOverlay';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);

  // Close menus on route change
  useEffect(() => {
    setDrawer(false);
    setMoreOpen(false);
  }, [location.pathname]);

  // Click outside & Escape listener for desktop "More" dropdown
  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  if (!user) return null;

  const isSecondaryActive =
    secondaryNav.some((item) => location.pathname.startsWith(item.to)) ||
    (user.role === 'admin' && location.pathname.startsWith('/admin'));

  return (
    <div className="relative min-h-screen w-full bg-wellness text-wellness-dark flex flex-col font-sans">
      <GrainOverlay />

      {/* ========================================================================= */}
      {/* DESKTOP FLOATING NAVIGATION (>= 1024px)                                   */}
      {/* ========================================================================= */}
      <header className="sticky top-4 z-40 hidden w-full px-6 lg:block">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-full border border-stone-200/70 bg-white/90 px-6 shadow-floating backdrop-blur-md"
        >
          {/* Brand Logo */}
          <div className="shrink-0">
            <Logo to="/app/dashboard" />
          </div>

          {/* Primary Nav Links */}
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ease-out ${
                      isActive
                        ? 'bg-sage-100 text-wellness-dark shadow-sm'
                        : 'text-wellness-muted hover:bg-stone-100/70 hover:text-wellness-dark'
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.short}</span>
                </NavLink>
              </li>
            ))}

            {/* "More" Overflow Dropdown */}
            <li className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-150 ease-out ${
                  isSecondaryActive || moreOpen
                    ? 'bg-sage-100 text-wellness-dark shadow-sm'
                    : 'text-wellness-muted hover:bg-stone-100/70 hover:text-wellness-dark'
                }`}
              >
                <span>More</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 ${
                    moreOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute left-0 mt-3 w-56 overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/95 p-2 shadow-floating backdrop-blur-md"
                  >
                    <ul className="space-y-0.5">
                      {secondaryNav.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={() => setMoreOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-sage-100 text-wellness-dark'
                                  : 'text-wellness-muted hover:bg-stone-100 hover:text-wellness-dark'
                              }`
                            }
                          >
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      ))}

                      {user.role === 'admin' && (
                        <li>
                          <NavLink
                            to="/admin"
                            onClick={() => setMoreOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${
                                isActive
                                  ? 'bg-wellness-dark text-white'
                                  : 'text-stone-700 hover:bg-stone-100'
                              }`
                            }
                          >
                            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                            <span>Admin console</span>
                          </NavLink>
                        </li>
                      )}
                    </ul>

                    <div className="mt-1.5 border-t border-stone-100 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          setConfirm(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-full px-4 py-2 text-left text-xs font-medium text-peach-500 hover:bg-peach-50/70 transition-colors"
                      >
                        <LogOutIcon className="h-4 w-4" aria-hidden="true" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          </ul>

          {/* Quick Actions (Badge, Notifications, Profile) */}
          <div className="flex shrink-0 items-center gap-3">
            <VerificationBadge status={user.verification} className="hidden xl:inline-flex" />

            <NotificationBell />

            <Link
              to="/app/profile"
              aria-label="Your profile"
              className="rounded-full transition-transform hover:scale-105 active:scale-95"
            >
              <Avatar name={user.name} src={user.avatar} size="sm" ring />
            </Link>
          </div>
        </nav>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE & TABLET FLOATING TOP HEADER (< 1024px)                            */}
      {/* ========================================================================= */}
      <header className="sticky top-3 z-40 mx-3 sm:mx-6 flex h-14 items-center justify-between rounded-full border border-stone-200/70 bg-white/90 px-3 shadow-floating backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200/80 bg-white text-wellness-dark transition-colors hover:bg-stone-50 active:scale-95"
          >
            <MenuIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <Logo to="/app/dashboard" compact={false} />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link
            to="/app/profile"
            aria-label="Your profile"
            className="rounded-full transition-transform active:scale-95"
          >
            <Avatar name={user.name} src={user.avatar} size="sm" ring />
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER FOR MOBILE & TABLET                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[1100] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />

            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col rounded-r-[2.5rem] border-r border-stone-200/80 bg-white p-6 shadow-floating"
            >
              <div className="flex items-center justify-between pb-4">
                <Logo to="/app/dashboard" />
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label="Close menu"
                  className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                >
                  <XIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Profile Strength Card in Drawer */}
              <div className="mb-5 rounded-3xl border border-sage-200/70 bg-sage-50/70 p-4 text-wellness-dark">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-wellness-muted">
                    Profile strength
                  </p>
                  <span className="font-display text-sm font-bold text-wellness-dark">
                    {user.profileStrength}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/60">
                  <div
                    className="h-full rounded-full bg-sage-500"
                    style={{ width: `${user.profileStrength}%` }}
                  />
                </div>
                <Link
                  to="/app/profile"
                  onClick={() => setDrawer(false)}
                  className="mt-2.5 inline-block text-xs font-semibold text-stone-700 hover:text-wellness-dark underline underline-offset-2"
                >
                  Improve your profile
                </Link>
              </div>

              {/* Navigation Destination List */}
              <ul className="scrollbar-thin flex-1 space-y-1 overflow-y-auto pr-1">
                {appNav.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setDrawer(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-sage-100 text-wellness-dark font-semibold'
                            : 'text-wellness-muted hover:bg-stone-50 hover:text-wellness-dark'
                        }`
                      }
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                ))}

                {user.role === 'admin' && (
                  <li>
                    <NavLink
                      to="/admin"
                      onClick={() => setDrawer(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-wellness-dark text-white'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`
                      }
                    >
                      <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                      <span>Admin console</span>
                    </NavLink>
                  </li>
                )}
              </ul>

              {/* Drawer Footer User Info & Logout */}
              <div className="border-t border-stone-100 pt-4">
                <div className="mb-3 flex items-center gap-3 rounded-2xl px-2 py-1">
                  <Avatar name={user.name} src={user.avatar} size="sm" ring />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-wellness-dark">{user.name}</p>
                    <p className="truncate text-xs text-wellness-muted">{user.city}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDrawer(false);
                    setConfirm(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-full border border-peach-200/80 bg-peach-50/50 px-4 py-2.5 text-xs font-semibold text-peach-500 hover:bg-peach-100 transition-colors"
                >
                  <LogOutIcon className="h-4 w-4" aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MAIN APPLICATION CONTENT                                                  */}
      {/* ========================================================================= */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-12">
        <Outlet />
      </main>

      {/* ========================================================================= */}
      {/* MOBILE FLOATING BOTTOM DOCK (< 768px)                                     */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-sm px-3 md:hidden"
      >
        <div className="flex h-14 items-center justify-around rounded-full border border-stone-200/70 bg-white/95 px-2 shadow-floating backdrop-blur-md">
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-wellness-dark font-bold'
                    : 'text-stone-400 hover:text-wellness-dark'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.short}</span>
                  {isActive && (
                    <motion.span
                      layoutId="mobileActiveDock"
                      className="absolute -bottom-1 h-1 w-5 rounded-full bg-peach-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* LOGOUT CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Log out of Roomie2Homie?"
        description="Your matches, listings, and messages stay saved. You will need to sign in again to reach them."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Stay signed in
            </Button>
            <Button
              variant="coral"
              onClick={() => {
                setConfirm(false);
                logout();
              }}
            >
              Log out
            </Button>
          </>
        }
      />
    </div>
  );
}