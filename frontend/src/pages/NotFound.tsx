import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/layout/Logo';

export function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-cream-200 px-6 text-center">
      <Logo />
      <p className="font-display text-6xl font-extrabold text-navy-900">404</p>
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">
          This room does not exist
        </h1>
        <p className="mt-2 max-w-sm text-sm text-navy-500">
          The page you were looking for has moved or was never listed.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/">
          <Button variant="secondary">Back to home</Button>
        </Link>
        <Link to="/app/dashboard">
          <Button variant="gradient">Go to dashboard</Button>
        </Link>
      </div>
    </div>);

}