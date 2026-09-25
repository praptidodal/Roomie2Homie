import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOutIcon, MenuIcon, SearchIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { VerificationBadge } from '../ui/Badge';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { appNav, mobileNav } from './navConfig';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => setDrawer(false), [location.pathname]);

  if (!user) return null;

  const sidebar =
  <nav className="flex h-full flex-col" aria-label="Main">
      <div className="px-5 py-5">
        <Logo to="/app/dashboard" />
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-violet-coral p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          Profile strength
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold">{user.profileStrength}%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${user.profileStrength}%` }} />
        </div>
        <Link
        to="/app/profile"
        className="mt-3 inline-block text-xs font-bold underline decoration-white/50 underline-offset-2">
        
          Improve your profile
        </Link>
      </div>

      <ul className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {appNav.map((item) =>
      <li key={item.to}>
            <NavLink
          to={item.to}
          className={({ isActive }) =>
          `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out ${
          isActive ?
          'bg-navy-900 text-white' :
          'text-navy-600 hover:bg-violet-50 hover:text-violet-700'}`

          }>
          
              {item.icon}
              <span className="truncate">{item.label}</span>
            </NavLink>
          </li>
      )}
        {user.role === 'admin' &&
      <li>
            <NavLink
          to="/admin"
          className={({ isActive }) =>
          `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out ${
          isActive ? 'bg-navy-900 text-white' : 'text-navy-600 hover:bg-violet-50'}`

          }>
          
              <ShieldCheckIcon className="h-[18px] w-[18px]" aria-hidden />
              Admin console
            </NavLink>
          </li>
      }
      </ul>

      <div className="border-t border-cream-300 p-3">
        <div className="mb-1 flex items-center gap-3 rounded-2xl px-2 py-2">
          <Avatar name={user.name} src={user.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-navy-900">{user.name}</p>
            <p className="truncate text-xs text-navy-500">{user.city}</p>
          </div>
        </div>
        <button
        type="button"
        onClick={() => setConfirm(true)}
        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-coral-500 transition-colors duration-150 ease-out hover:bg-coral-50">
        
          <LogOutIcon className="h-[18px] w-[18px]" aria-hidden />
          Log out
        </button>
      </div>
    </nav>;


  return (
    <div className="min-h-screen w-full bg-cream-200">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-cream-300 bg-white lg:block">
        {sidebar}
      </aside>

      <AnimatePresence>
        {drawer &&
        <div className="fixed inset-0 z-[1100] lg:hidden">
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 bg-navy-900/50"
            onClick={() => setDrawer(false)} />
          
            <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-y-0 left-0 w-72 bg-white">
            
              <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
              className="absolute right-3 top-5 rounded-full p-2 text-navy-500 hover:bg-cream-200">
              
                <XIcon className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.aside>
          </div>
        }
      </AnimatePresence>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-cream-300 bg-cream-200/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cream-300 bg-white text-navy-800 lg:hidden">
              
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo to="/app/dashboard" />
            </div>
            <Link
              to="/app/discover"
              className="hidden items-center gap-2 rounded-2xl border border-cream-300 bg-white px-4 py-2.5 text-sm text-navy-500 transition-colors duration-150 ease-out hover:border-violet-200 hover:text-violet-700 lg:flex lg:w-80">
              
              <SearchIcon className="h-4 w-4" aria-hidden />
              Search roommates, rooms, localities
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <VerificationBadge status={user.verification} className="hidden sm:inline-flex" />
            <NotificationBell />
            <Link to="/app/profile" aria-label="Your profile">
              <Avatar name={user.name} src={user.avatar} size="sm" ring />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>

        <nav
          aria-label="Mobile"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-cream-300 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          
          {mobileNav.map((item) =>
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors duration-150 ease-out ${
            isActive ? 'text-violet-600' : 'text-navy-500'}`

            }>
            
              {item.icon}
              {item.short}
            </NavLink>
          )}
        </nav>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Log out of Roomie2Homie?"
        description="Your matches and chats stay saved. You will need to sign in again to reach them."
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
            }}>
            
              Log out
            </Button>
          </>
        } />
      
    </div>);

}