import React from 'react';
import {
  BellIcon,
  BuildingIcon,
  HeartHandshakeIcon,
  HomeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserRoundIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  short: string;
  to: string;
  icon: React.ReactNode;
}

const icon = (C: React.ElementType) => <C className="h-[18px] w-[18px]" aria-hidden />;

export const appNav: NavItem[] = [
  { label: 'Dashboard', short: 'Home', to: '/app/dashboard', icon: icon(LayoutDashboardIcon) },
  { label: 'Discover', short: 'Discover', to: '/app/discover', icon: icon(SparklesIcon) },
  { label: 'Matches', short: 'Matches', to: '/app/matches', icon: icon(HeartHandshakeIcon) },
  { label: 'Rooms', short: 'Rooms', to: '/app/rooms', icon: icon(HomeIcon) },
  { label: 'My listings', short: 'My Rooms', to: '/app/rooms/mine', icon: icon(BuildingIcon) },
  { label: 'Room enquiries', short: 'Enquiries', to: '/app/enquiries', icon: icon(InboxIcon) },
  { label: 'Chat', short: 'Chat', to: '/app/chat', icon: icon(MessageCircleIcon) },
  { label: 'Profile & quiz', short: 'Profile', to: '/app/profile', icon: icon(UserRoundIcon) },
  { label: 'Notifications', short: 'Alerts', to: '/app/notifications', icon: icon(BellIcon) },
  { label: 'Verification', short: 'Verify', to: '/app/verification', icon: icon(ShieldCheckIcon) },
];

/** Primary floating navigation items for desktop */
export const primaryNav: NavItem[] = [
  appNav[0], // Dashboard
  appNav[1], // Discover
  appNav[2], // Matches
  appNav[3], // Rooms
  appNav[6], // Chat
];

/** Secondary items for overflow dropdown */
export const secondaryNav: NavItem[] = [
  appNav[4], // My listings
  appNav[5], // Room enquiries
  appNav[7], // Profile & quiz
  appNav[8], // Notifications
  appNav[9], // Verification
];

/** Bottom floating pill bar on mobile (5 core touch destinations) */
export const mobileNav: NavItem[] = [
  appNav[0], // Home
  appNav[1], // Discover
  appNav[2], // Matches
  appNav[3], // Rooms
  appNav[6], // Chat
];