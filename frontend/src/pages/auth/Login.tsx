import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogInIcon, ShieldCheckIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../../components/layout/Logo';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { IMG } from '../../data/mock';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'priya.nair@gmail.com', password: 'demo1234' });
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent, asAdmin = false) {
    event.preventDefault();
    setError('');
    if (!form.email.includes('@') || form.password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    // TODO: POST /api/auth/login → JWT cookie
    const user = await login(form.email, form.password, asAdmin);
    setLoading(false);
    navigate(user.role === 'admin' ? '/admin' : '/app/dashboard', { replace: true });
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-center bg-cream-200 px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <h1 className="mt-10 font-display text-3xl font-extrabold tracking-tight text-navy-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            Sign in to see new matches, messages and room enquiries.
          </p>

          <form onSubmit={(e) => submit(e)} className="mt-8 space-y-4" noValidate>
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@gmail.com" />
              
            </Field>
            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" />
              
            </Field>

            {error &&
            <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
                {error}
              </p>
            }

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-navy-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-cream-300 text-violet-600 focus:ring-violet-400" />
                
                Keep me signed in
              </label>
              <Link to="/register" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="gradient" size="lg" block loading={loading} icon={<LogInIcon className="h-4 w-4" aria-hidden />}>
              Sign in
            </Button>
            <Button
              type="button"
              variant="secondary"
              block
              onClick={(e) => submit(e as unknown as React.FormEvent, true)}
              icon={<ShieldCheckIcon className="h-4 w-4" aria-hidden />}>
              
              Sign in as admin (demo)
            </Button>
          </form>

          <p className="mt-6 text-sm text-navy-500">
            New to Roomie2Homie?{' '}
            <Link to="/register" className="font-bold text-violet-600 hover:text-violet-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img src={IMG.hero} alt="Flatmates together in a bright living room" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy-900/55" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <Badge tone="coral">Mock demo · any password works</Badge>
          <p className="mt-5 max-w-md font-display text-3xl font-extrabold leading-tight">
            “We matched at 86% on sleep and cleanliness. Six months in, zero fights.”
          </p>
          <p className="mt-3 text-sm text-cream-200/80">Rohan D. · HSR Layout, Bengaluru</p>
        </div>
      </div>
    </div>);

}