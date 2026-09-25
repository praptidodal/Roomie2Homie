import React from 'react';
import {
  BellIcon,
  HeartHandshakeIcon,
  HomeIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserRoundIcon } from
'lucide-react';

export interface NavItem {
  label: string;
  short: string;
  to: string;
  icon: React.ReactNode;
}

const icon = (C: React.ElementType) => <C className="h-[18px] w-[18px]" aria-hidden />;

export const appNav: NavItem[] = [
{ label: 'Dashboard', short: 'Home', to: '/app/dashboard', icon: icon(LayoutDashboardIcon) },
{ label: 'Discover roommates', short: 'Discover', to: '/app/discover', icon: icon(SparklesIcon) },
{ label: 'Matches', short: 'Matches', to: '/app/matches', icon: icon(HeartHandshakeIcon) },
{ label: 'Room listings', short: 'Rooms', to: '/app/rooms', icon: icon(HomeIcon) },
{ label: 'Chat', short: 'Chat', to: '/app/chat', icon: icon(MessageCircleIcon) },
{ label: 'Profile & quiz', short: 'Profile', to: '/app/profile', icon: icon(UserRoundIcon) },
{ label: 'Notifications', short: 'Alerts', to: '/app/notifications', icon: icon(BellIcon) },
{ label: 'Verification', short: 'Verify', to: '/app/verification', icon: icon(ShieldCheckIcon) }];


/** Bottom bar on mobile keeps only the five highest-traffic destinations. */
export const mobileNav: NavItem[] = [
appNav[0],
appNav[1],
appNav[2],
appNav[3],
appNav[4]];