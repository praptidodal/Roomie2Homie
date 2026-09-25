import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/States';

/** Mock guard: gates the UI only. Real auth is enforced by the Express API. */
export function ProtectedRoute({ adminOnly = false }: {adminOnly?: boolean;}) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready)
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-200">
        <Spinner className="h-7 w-7" />
      </div>);


  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/app/dashboard" replace />;

  return <Outlet />;
}