import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  FlagIcon,
  HomeIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
  LayoutDashboardIcon,
  BuildingIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  PauseCircleIcon,
  PlayCircleIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../../components/layout/Logo';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/States';
import {
  api,
  AdminPlatformStats,
  AdminVerificationItem,
  AdminUserItem,
  AdminRoomItem,
} from '../../services/api';
import { rupees } from '../../utils/format';
import { cities } from '../../data/mock';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'users' | 'rooms' | 'reports'>('overview');

  // Verification queue state
  const [queue, setQueue] = useState<AdminVerificationItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [decision, setDecision] = useState<{
    id: string;
    name: string;
    institution?: string;
    idNumber?: string;
    approve: boolean;
    reason?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // All verifications tab state
  const [verificationsFilter, setVerificationsFilter] = useState<string>('pending');
  const [allVerifications, setAllVerifications] = useState<AdminVerificationItem[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  // Users tab state
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userCityFilter, setUserCityFilter] = useState('');
  const [userVerifFilter, setUserVerifFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionBusy, setUserActionBusy] = useState<string | null>(null);

  // Rooms tab state
  const [roomsList, setRoomsList] = useState<AdminRoomItem[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomCityFilter, setRoomCityFilter] = useState('');
  const [roomActiveFilter, setRoomActiveFilter] = useState('');
  const [roomVerifFilter, setRoomVerifFilter] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomActionBusy, setRoomActionBusy] = useState<string | null>(null);

  // Report resolution modal state
  const [reportAction, setReportAction] = useState<{
    id: string;
    subject: string;
    action: 'resolve' | 'dismiss';
  } | null>(null);
  const [reportBusy, setReportBusy] = useState(false);

  // Load overview stats and initial pending queue
  function loadStatsAndQueue() {
    api.getAdminStats().then(setStats).catch(() => {});
    api.getAdminVerifications({ status: 'pending' })
      .then((items) => {
        setQueue(items);
        setLoadingQueue(false);
      })
      .catch(() => {
        setLoadingQueue(false);
      });
  }

  useEffect(() => {
    loadStatsAndQueue();
  }, []);

  // Load all verifications tab data
  useEffect(() => {
    if (activeTab === 'verifications') {
      setLoadingVerifications(true);
      api.getAdminVerifications({ status: verificationsFilter === 'all' ? undefined : verificationsFilter })
        .then((items) => {
          setAllVerifications(items);
          setLoadingVerifications(false);
        })
        .catch(() => setLoadingVerifications(false));
    }
  }, [activeTab, verificationsFilter]);

  // Load users tab data
  useEffect(() => {
    if (activeTab === 'users') {
      setLoadingUsers(true);
      api.getAdminUsers({
        search: userSearch.trim() || undefined,
        city: userCityFilter || undefined,
        verificationStatus: userVerifFilter || undefined,
      })
        .then((items) => {
          setUsersList(items);
          setLoadingUsers(false);
        })
        .catch(() => setLoadingUsers(false));
    }
  }, [activeTab, userSearch, userCityFilter, userVerifFilter]);

  // Load rooms tab data
  useEffect(() => {
    if (activeTab === 'rooms') {
      setLoadingRooms(true);
      api.getAdminRooms({
        search: roomSearch.trim() || undefined,
        city: roomCityFilter || undefined,
        isActive: roomActiveFilter === '' ? undefined : roomActiveFilter === 'true',
        isVerified: roomVerifFilter === '' ? undefined : roomVerifFilter === 'true',
      })
        .then((items) => {
          setRoomsList(items);
          setLoadingRooms(false);
        })
        .catch(() => setLoadingRooms(false));
    }
  }, [activeTab, roomSearch, roomCityFilter, roomActiveFilter, roomVerifFilter]);

  // Resolve verification decision (Approve / Reject)
  async function resolveDecision() {
    if (!decision) return;
    setBusy(true);
    try {
      await api.resolveVerification(
        decision.id,
        decision.approve ? 'approve' : 'reject',
        decision.approve ? undefined : decision.reason?.trim() || 'College ID could not be verified.'
      );
      // Remove from pending queue
      setQueue((prev) => prev.filter((q) => q.id !== decision.id));
      // Update allVerifications if in that tab
      setAllVerifications((prev) =>
        prev.map((q) =>
          q.id === decision.id
            ? { ...q, status: decision.approve ? 'approved' : 'rejected' }
            : q
        )
      );
      // Refresh stats totals
      if (stats) {
        setStats({
          ...stats,
          totals: {
            ...stats.totals,
            pendingVerifications: Math.max(0, stats.totals.pendingVerifications - 1),
            verifiedUsers: decision.approve
              ? stats.totals.verifiedUsers + 1
              : stats.totals.verifiedUsers,
          },
        });
      }
    } catch (err) {
      console.error('Failed to resolve verification:', err);
    } finally {
      setBusy(false);
      setDecision(null);
    }
  }

  // Toggle user active / paused status
  async function toggleUserStatus(u: AdminUserItem) {
    setUserActionBusy(u.id);
    try {
      const nextPaused = !u.isPaused;
      await api.updateAdminUser(u.id, { isPaused: nextPaused });
      setUsersList((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isPaused: nextPaused } : item))
      );
    } catch (err) {
      console.error('Failed to update user status:', err);
    } finally {
      setUserActionBusy(null);
    }
  }

  // Toggle room verified or active status
  async function toggleRoomStatus(r: AdminRoomItem, field: 'isVerified' | 'isActive') {
    setRoomActionBusy(r.id);
    try {
      const patch = { [field]: !r[field] };
      await api.updateAdminRoom(r.id, patch);
      setRoomsList((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, [field]: !r[field] } : item))
      );
      if (field === 'isActive' && stats) {
        setStats({
          ...stats,
          totals: {
            ...stats.totals,
            rooms: !r.isActive ? stats.totals.rooms + 1 : Math.max(0, stats.totals.rooms - 1),
          },
        });
      }
    } catch (err) {
      console.error('Failed to update room status:', err);
    } finally {
      setRoomActionBusy(null);
    }
  }

  // Resolve flagged content report
  async function resolveReport() {
    if (!reportAction) return;
    setReportBusy(true);
    try {
      await api.resolveAdminReport(reportAction.id, reportAction.action);
      if (stats) {
        setStats({
          ...stats,
          flagged: stats.flagged.filter((f) => f.id !== reportAction.id),
          totals: {
            ...stats.totals,
            reports: Math.max(0, stats.totals.reports - 1),
          },
        });
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
    } finally {
      setReportBusy(false);
      setReportAction(null);
    }
  }

  const maxBar = Math.max(1, ...(stats?.weekly.map((d) => Math.max(d.matches, d.signups)) || [1]));

  if (!stats) return <LoadingState label="Loading platform metrics…" />;

  const TABS: Array<{
    id: 'overview' | 'verifications' | 'users' | 'rooms' | 'reports';
    label: string;
    icon: React.ElementType;
    count?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
    {
      id: 'verifications',
      label: 'Verifications',
      icon: ShieldCheckIcon,
      count: stats.totals.pendingVerifications,
    },
    { id: 'users', label: 'Members', icon: UsersIcon, count: stats.totals.users },
    { id: 'rooms', label: 'Room Listings', icon: HomeIcon, count: stats.totals.rooms },
    { id: 'reports', label: 'Safety & Reports', icon: FlagIcon, count: stats.totals.reports },
  ];

  return (
    <div className="min-h-screen w-full bg-cream-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-cream-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo to="/admin" />
            <Badge tone="navy" className="hidden sm:inline-flex">
              <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
              Admin console
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/dashboard"
              className="hidden items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-wellness-dark sm:flex"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Member view
            </Link>
            <Avatar name={user?.name ?? 'Admin'} src={user?.avatar} size="sm" />
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="OPERATIONS & SAFETY"
          title="Platform management"
          description="Real-time community metrics, identity verification review, user directory, and marketplace listings."
        />

        {/* Real Platform Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total members"
            value={stats.totals.users.toLocaleString('en-IN')}
            hint={`${stats.totals.activeToday.toLocaleString('en-IN')} active today`}
            icon={<UsersIcon className="h-5 w-5" aria-hidden />}
            tone="plain"
          />
          <StatCard
            label="Matches made"
            value={stats.totals.matchesMade.toLocaleString('en-IN')}
            hint="Accepted both ways"
            icon={<SparklesIcon className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label="Live rooms"
            value={stats.totals.rooms.toLocaleString('en-IN')}
            hint={`${stats.totals.pendingEnquiries ?? 0} pending enquiries`}
            icon={<HomeIcon className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label="Pending verifications"
            value={stats.totals.pendingVerifications}
            hint={`${stats.totals.verifiedUsers.toLocaleString('en-IN')} verified so far`}
            icon={<ShieldCheckIcon className="h-5 w-5" aria-hidden />}
            tone="mint"
          />
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 mb-6 flex gap-2 overflow-x-auto pb-3 border-b border-cream-300 scrollbar-none sm:flex-wrap">
          {TABS.map((t) => {
            const IconComponent = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-wellness-dark text-white shadow-xs'
                    : 'text-wellness-muted hover:bg-white/80 hover:text-wellness-dark'
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" aria-hidden />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      active ? 'bg-white/20 text-white' : 'bg-cream-300 text-navy-800'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader title="This week" description="Signups and completed matches per day." />
                <div className="flex items-end gap-3 sm:gap-5">
                  {stats.weekly.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-44 w-full items-end justify-center gap-1">
                        <div
                          className="w-1/3 rounded-t-lg bg-sage-500"
                          style={{ height: `${(d.signups / maxBar) * 100}%` }}
                          title={`${d.signups} signups`}
                        />
                        <div
                          className="w-1/3 rounded-t-lg bg-peach-500"
                          style={{ height: `${(d.matches / maxBar) * 100}%` }}
                          title={`${d.matches} matches`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-navy-500">{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-5 border-t border-cream-300 pt-4 text-xs font-semibold">
                  <span className="flex items-center gap-2 text-navy-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-sage-500" aria-hidden />
                    Signups
                  </span>
                  <span className="flex items-center gap-2 text-navy-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-peach-500" aria-hidden />
                    Matches
                  </span>
                </div>
              </Card>

              <Card>
                <CardHeader title="Members by city" />
                <ul className="space-y-4">
                  {stats.cityMix.map((c) => (
                    <li key={c.city}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-semibold text-navy-800">{c.city}</span>
                        <span className="font-bold text-navy-900">{c.users.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-300">
                        <div
                          className="h-full rounded-full bg-sage-500"
                          style={{
                            width: `${(c.users / (stats.cityMix[0]?.users || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {/* Verification Queue (Pending) */}
              <Card>
                <CardHeader
                  title="Verification queue"
                  description="Pending student and professional ID submissions awaiting review."
                />
                {loadingQueue ? (
                  <LoadingState label="Loading verification queue…" />
                ) : queue.length === 0 ? (
                  <EmptyState title="Queue is clear" description="No documents waiting for review." />
                ) : (
                  <ul className="divide-y divide-cream-300">
                    {queue.map((q) => {
                      const userName = q.user?.name || 'Member';
                      const userAvatar = q.user?.avatar || '';
                      const institution = q.institution || 'College / University';
                      const collegeId = q.idNumber || q.maskedId || '';
                      const cityInfo = q.user?.city || '';
                      const timeInfo = q.submittedAt
                        ? new Date(q.submittedAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '';

                      return (
                        <li key={q.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="rounded-2xl border border-cream-300 bg-cream-50/60 p-4 transition-colors hover:border-sage-300">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <Avatar name={userName} src={userAvatar} size="sm" />
                                  <div>
                                    <p className="font-display font-bold text-navy-900">{userName}</p>
                                    {cityInfo && <p className="text-xs text-navy-500">{cityInfo}</p>}
                                  </div>
                                </div>
                                <p className="text-xs text-navy-700">
                                  <span className="font-semibold">{institution}</span> · {q.docType || 'College ID'}
                                </p>
                                <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-xs font-bold text-amber-950">
                                  <ShieldAlertIcon className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                                  <span>{collegeId}</span>
                                </div>
                                {timeInfo && <p className="text-[11px] text-navy-400">Submitted {timeInfo}</p>}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon={<CheckIcon className="h-3.5 w-3.5" aria-hidden />}
                                  onClick={() =>
                                    setDecision({
                                      id: q.id,
                                      name: userName,
                                      institution,
                                      idNumber: collegeId,
                                      approve: true,
                                    })
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-coral-500 hover:bg-coral-50"
                                  icon={<XIcon className="h-3.5 w-3.5" aria-hidden />}
                                  onClick={() =>
                                    setDecision({
                                      id: q.id,
                                      name: userName,
                                      institution,
                                      idNumber: collegeId,
                                      approve: false,
                                      reason: 'College ID is expired or illegible.',
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              {/* Flagged Content */}
              <Card>
                <CardHeader
                  title="Flagged content"
                  description={`${stats.totals.reports} open member reports`}
                />
                {!stats.flagged || stats.flagged.length === 0 ? (
                  <div className="p-8 text-center text-xs text-wellness-muted">
                    No flagged content. All member listings and profiles are in good standing.
                  </div>
                ) : (
                  <ul className="divide-y divide-cream-300">
                    {stats.flagged.map((f) => (
                      <li key={f.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge tone="coral">
                                <FlagIcon className="h-3.5 w-3.5" aria-hidden />
                                {f.type}
                              </Badge>
                              <span className="text-xs text-navy-500">{f.at}</span>
                            </div>
                            <p className="mt-2 font-semibold text-navy-900">{f.subject}</p>
                            <p className="mt-0.5 text-sm text-navy-500">{f.reason}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setReportAction({ id: f.id, subject: f.subject, action: 'resolve' })
                              }
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setReportAction({ id: f.id, subject: f.subject, action: 'dismiss' })
                              }
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* Recent Members */}
            <Card padded={false}>
              <div className="px-6 pt-6">
                <CardHeader title="Recent members" description="Newest signups across all cities." />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-cream-200 text-xs font-bold uppercase tracking-wide text-navy-500">
                    <tr>
                      <th scope="col" className="px-6 py-3">Member</th>
                      <th scope="col" className="px-6 py-3">Email</th>
                      <th scope="col" className="px-6 py-3">City</th>
                      <th scope="col" className="px-6 py-3">Budget</th>
                      <th scope="col" className="px-6 py-3">Verification</th>
                      <th scope="col" className="px-6 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-300">
                    {!stats.recentMembers || stats.recentMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-wellness-muted">
                          No members registered yet.
                        </td>
                      </tr>
                    ) : (
                      stats.recentMembers.map((p) => (
                        <tr key={p.id} className="hover:bg-cream-200/60">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={p.name} src={p.avatar} size="xs" />
                              <div>
                                <p className="font-semibold text-navy-900">{p.name}</p>
                                <p className="text-xs text-navy-500">{p.occupation}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-navy-600">{p.email || '—'}</td>
                          <td className="px-6 py-3.5 text-navy-600">{p.city}</td>
                          <td className="px-6 py-3.5 font-semibold text-navy-800">
                            ₹{p.budget.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge
                              tone={
                                p.verification === 'verified'
                                  ? 'mint'
                                  : p.verification === 'pending'
                                  ? 'amber'
                                  : 'neutral'
                              }
                            >
                              {p.verification === 'verified'
                                ? 'Verified'
                                : p.verification === 'pending'
                                ? 'In review'
                                : 'Unverified'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5 text-navy-600">{p.joinedAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: VERIFICATIONS */}
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-900">Verification submissions</h3>
                  <p className="text-xs text-navy-500">
                    Access encrypted student and employee documents for authorized manual review.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="vFilter" className="text-xs font-semibold text-navy-600">Status:</label>
                  <Select
                    id="vFilter"
                    className="h-10 text-xs w-44"
                    value={verificationsFilter}
                    onChange={(e) => setVerificationsFilter(e.target.value)}
                  >
                    <option value="pending">Pending review</option>
                    <option value="verified">Verified / Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All submissions</option>
                  </Select>
                </div>
              </div>

              <div className="mt-6">
                {loadingVerifications ? (
                  <LoadingState label="Loading verification records…" />
                ) : allVerifications.length === 0 ? (
                  <EmptyState
                    title="No submissions found"
                    description={`No verification requests found with status: ${verificationsFilter}.`}
                  />
                ) : (
                  <div className="space-y-4">
                    {allVerifications.map((q) => {
                      const userName = q.user?.name || 'Member';
                      const userAvatar = q.user?.avatar || '';
                      const institution = q.institution || 'College / University';
                      const collegeId = q.idNumber || q.maskedId || '';
                      const isPending = q.status === 'pending';
                      const isApproved = q.status === 'approved';
                      const isRejected = q.status === 'rejected';

                      return (
                        <div
                          key={q.id}
                          className="rounded-2xl border border-cream-300 bg-white p-5 shadow-xs transition-colors hover:border-sage-400"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={userName} src={userAvatar} size="md" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-display font-bold text-navy-900">{userName}</h4>
                                    <Badge
                                      tone={isApproved ? 'mint' : isRejected ? 'coral' : 'amber'}
                                    >
                                      {isApproved ? 'Verified' : isRejected ? 'Rejected' : 'Pending review'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-navy-500">{q.user?.city || 'Pune'}</p>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                                <div>
                                  <span className="font-semibold text-navy-500">Institution:</span>{' '}
                                  <span className="font-bold text-navy-800">{institution}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-navy-500">Document type:</span>{' '}
                                  <span className="font-bold text-navy-800">{q.docType || q.type}</span>
                                </div>
                              </div>

                              {/* Sensitive College ID - Decrypted for Authorized Admin */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">
                                  Decrypted ID Number
                                </span>
                                <div className="mt-1 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1 font-mono text-sm font-bold text-amber-950">
                                  <ShieldAlertIcon className="h-4 w-4 text-amber-600" aria-hidden />
                                  <span>{collegeId}</span>
                                  <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-900">
                                    Admin Decrypted
                                  </span>
                                </div>
                              </div>

                              {q.rejectionReason && (
                                <p className="text-xs text-rose-600 font-medium">
                                  Rejection reason: {q.rejectionReason}
                                </p>
                              )}

                              <p className="text-[11px] text-navy-400">
                                Submitted on {new Date(q.submittedAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>

                            {/* Actions for Pending */}
                            {isPending && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon={<CheckIcon className="h-3.5 w-3.5" aria-hidden />}
                                  onClick={() =>
                                    setDecision({
                                      id: q.id,
                                      name: userName,
                                      institution,
                                      idNumber: collegeId,
                                      approve: true,
                                    })
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-coral-500 hover:bg-coral-50"
                                  icon={<XIcon className="h-3.5 w-3.5" aria-hidden />}
                                  onClick={() =>
                                    setDecision({
                                      id: q.id,
                                      name: userName,
                                      institution,
                                      idNumber: collegeId,
                                      approve: false,
                                      reason: 'College ID is expired or illegible.',
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Search members" htmlFor="uSearch">
                  <Input
                    id="uSearch"
                    placeholder="Search name, email, occupation…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </Field>
                <Field label="Filter city" htmlFor="uCity">
                  <Select
                    id="uCity"
                    value={userCityFilter}
                    onChange={(e) => setUserCityFilter(e.target.value)}
                  >
                    <option value="">All cities</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Verification status" htmlFor="uVerif">
                  <Select
                    id="uVerif"
                    value={userVerifFilter}
                    onChange={(e) => setUserVerifFilter(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="verified">Verified</option>
                    <option value="pending">In review</option>
                    <option value="unverified">Unverified</option>
                  </Select>
                </Field>
              </div>
            </Card>

            <Card padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-cream-200 text-xs font-bold uppercase tracking-wide text-navy-500">
                    <tr>
                      <th scope="col" className="px-6 py-3">Member</th>
                      <th scope="col" className="px-6 py-3">Email</th>
                      <th scope="col" className="px-6 py-3">City & Locality</th>
                      <th scope="col" className="px-6 py-3">Gender</th>
                      <th scope="col" className="px-6 py-3">Verification</th>
                      <th scope="col" className="px-6 py-3">Account</th>
                      <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-300">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center">
                          <LoadingState label="Loading members…" />
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-wellness-muted">
                          No members matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-cream-200/50">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-navy-900">{u.name}</p>
                                  {u.role === 'admin' && (
                                    <Badge tone="navy" className="text-[10px]">Admin</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-navy-500">{u.occupation || 'Student'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-navy-600 font-mono">{u.email}</td>
                          <td className="px-6 py-3.5 text-xs text-navy-600">
                            {u.locality ? `${u.locality}, ${u.city}` : u.city}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-navy-700 capitalize">
                            {u.gender ? u.gender.replace(/_/g, ' ') : '—'}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge
                              tone={
                                u.verificationStatus === 'verified'
                                  ? 'mint'
                                  : u.verificationStatus === 'pending'
                                  ? 'amber'
                                  : 'neutral'
                              }
                            >
                              {u.verificationStatus === 'verified'
                                ? 'Verified'
                                : u.verificationStatus === 'pending'
                                ? 'In review'
                                : 'Unverified'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge tone={u.isPaused ? 'coral' : 'neutral'}>
                              {u.isPaused ? 'Paused' : 'Active'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {u.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant={u.isPaused ? 'primary' : 'secondary'}
                                loading={userActionBusy === u.id}
                                onClick={() => toggleUserStatus(u)}
                              >
                                {u.isPaused ? 'Activate' : 'Pause'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: ROOMS LISTINGS */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <Card>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Search listings" htmlFor="rSearch">
                  <Input
                    id="rSearch"
                    placeholder="Search title, locality…"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                  />
                </Field>
                <Field label="City" htmlFor="rCity">
                  <Select
                    id="rCity"
                    value={roomCityFilter}
                    onChange={(e) => setRoomCityFilter(e.target.value)}
                  >
                    <option value="">All cities</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Active status" htmlFor="rActive">
                  <Select
                    id="rActive"
                    value={roomActiveFilter}
                    onChange={(e) => setRoomActiveFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Live / Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </Field>
                <Field label="Verification" htmlFor="rVerif">
                  <Select
                    id="rVerif"
                    value={roomVerifFilter}
                    onChange={(e) => setRoomVerifFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Verified only</option>
                    <option value="false">Unverified only</option>
                  </Select>
                </Field>
              </div>
            </Card>

            <Card padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-cream-200 text-xs font-bold uppercase tracking-wide text-navy-500">
                    <tr>
                      <th scope="col" className="px-6 py-3">Listing</th>
                      <th scope="col" className="px-6 py-3">Host</th>
                      <th scope="col" className="px-6 py-3">Location</th>
                      <th scope="col" className="px-6 py-3">Rent / Deposit</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-300">
                    {loadingRooms ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <LoadingState label="Loading listings…" />
                        </td>
                      </tr>
                    ) : roomsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-wellness-muted">
                          No room listings matching filters.
                        </td>
                      </tr>
                    ) : (
                      roomsList.map((r) => (
                        <tr key={r.id} className="hover:bg-cream-200/50">
                          <td className="px-6 py-3.5">
                            <div>
                              <p className="font-semibold text-navy-900">{r.title}</p>
                              <p className="text-xs text-navy-500 capitalize">
                                {r.type.replace(/_/g, ' ')} · {r.furnishing}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <Avatar name={r.host.name} src={r.host.avatarUrl} size="xs" />
                              <div>
                                <p className="text-xs font-semibold text-navy-900">{r.host.name}</p>
                                <p className="text-[11px] text-navy-500">{r.host.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-navy-600">
                            {r.locality}, {r.city}
                          </td>
                          <td className="px-6 py-3.5 text-xs">
                            <p className="font-bold text-navy-900">{rupees(r.rent)}/mo</p>
                            <p className="text-[11px] text-navy-500">Dep: {rupees(r.deposit)}</p>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge tone={r.isActive ? 'neutral' : 'coral'}>
                                {r.isActive ? 'Live' : 'Deactivated'}
                              </Badge>
                              <Badge tone={r.isVerified ? 'mint' : 'neutral'}>
                                {r.isVerified ? 'Verified' : 'Unverified'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant={r.isVerified ? 'secondary' : 'primary'}
                                loading={roomActionBusy === r.id}
                                onClick={() => toggleRoomStatus(r, 'isVerified')}
                              >
                                {r.isVerified ? 'Unverify' : 'Verify'}
                              </Button>
                              <Button
                                size="sm"
                                variant={r.isActive ? 'ghost' : 'secondary'}
                                className={r.isActive ? 'text-coral-500 hover:bg-coral-50' : ''}
                                loading={roomActionBusy === r.id}
                                onClick={() => toggleRoomStatus(r, 'isActive')}
                              >
                                {r.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: SAFETY & REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Safety reports & moderation queue"
                description="Community-submitted flags regarding profiles, listings, or abusive behavior."
              />
              {!stats.flagged || stats.flagged.length === 0 ? (
                <EmptyState
                  title="No active reports"
                  description="All reported items have been reviewed and resolved."
                />
              ) : (
                <div className="space-y-4">
                  {stats.flagged.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-cream-300 bg-white p-5 shadow-xs transition-colors hover:border-coral-300"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge tone="coral">
                              <FlagIcon className="h-3.5 w-3.5" aria-hidden />
                              {f.type}
                            </Badge>
                            <Badge tone={f.status === 'pending' ? 'amber' : 'neutral'}>
                              {f.status}
                            </Badge>
                            <span className="text-xs text-navy-500">Reported on {f.at}</span>
                          </div>
                          <h4 className="font-display font-bold text-navy-900">{f.subject}</h4>
                          <p className="text-xs text-navy-600 bg-cream-100 p-3 rounded-xl border border-cream-200">
                            Reason: {f.reason}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              setReportAction({ id: f.id, subject: f.subject, action: 'resolve' })
                            }
                          >
                            Resolve Report
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setReportAction({ id: f.id, subject: f.subject, action: 'dismiss' })
                            }
                          >
                            Dismiss Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Verification Decision Modal */}
      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.approve ? 'Approve verification?' : 'Reject verification?'}
        description={
          decision?.approve
            ? `Confirm manual verification approval for ${decision?.name}.`
            : `Specify a reason for rejecting ${decision?.name}'s submission.`
        }
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.approve ? 'primary' : 'coral'}
              loading={busy}
              onClick={resolveDecision}
            >
              {decision?.approve ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-xl border border-cream-300 bg-cream-100 p-3.5 text-xs text-navy-800">
            <p>
              <span className="font-bold text-navy-600">Applicant:</span>{' '}
              <span className="font-semibold text-navy-900">{decision?.name}</span>
            </p>
            {decision?.institution && (
              <p>
                <span className="font-bold text-navy-600">Institution:</span>{' '}
                <span className="font-semibold text-navy-900">{decision.institution}</span>
              </p>
            )}
            <p>
              <span className="font-bold text-navy-600">Decrypted ID:</span>{' '}
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono font-bold text-amber-950">
                {decision?.idNumber}
              </span>
            </p>
          </div>

          {!decision?.approve && (
            <Field
              label="Rejection reason"
              htmlFor="rejReason"
              hint="Shown to the applicant in their status and in-app notification"
              required
            >
              <Input
                id="rejReason"
                value={decision?.reason || ''}
                onChange={(e) =>
                  setDecision((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                }
                placeholder="e.g. College ID is expired or could not be verified."
              />
            </Field>
          )}
        </div>
      </Modal>

      {/* Report Resolution Modal */}
      <Modal
        open={!!reportAction}
        onClose={() => setReportAction(null)}
        title={reportAction?.action === 'resolve' ? 'Resolve report?' : 'Dismiss report?'}
        description={`Confirm ${reportAction?.action} action for "${reportAction?.subject}".`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReportAction(null)}>
              Cancel
            </Button>
            <Button
              variant={reportAction?.action === 'resolve' ? 'primary' : 'coral'}
              loading={reportBusy}
              onClick={resolveReport}
            >
              Confirm {reportAction?.action === 'resolve' ? 'Resolve' : 'Dismiss'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-navy-700">
          This will update the report status in the database to{' '}
          <span className="font-bold">{reportAction?.action === 'resolve' ? 'resolved' : 'dismissed'}</span>.
        </p>
      </Modal>
    </div>
  );
}