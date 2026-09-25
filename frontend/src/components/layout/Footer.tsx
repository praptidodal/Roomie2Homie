import React from 'react';
import { Link } from 'react-router-dom';
import { InstagramIcon, LinkedinIcon, MailIcon, TwitterIcon } from 'lucide-react';

const columns = [
{
  title: 'Product',
  links: [
  { label: 'Find a roommate', to: '/app/discover' },
  { label: 'Browse rooms', to: '/app/rooms' },
  { label: 'Lifestyle quiz', to: '/app/quiz' },
  { label: 'Verification', to: '/app/verification' }]

},
{
  title: 'Company',
  links: [
  { label: 'Create account', to: '/register' },
  { label: 'Sign in', to: '/login' },
  { label: 'Admin console', to: '/admin' }]

}];


export function Footer() {
  return (
    <footer className="bg-navy-900 text-cream-200">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-xl font-extrabold text-white">
            Roomie<span className="text-coral-400">2</span>Homie
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-200/70">
            India&apos;s lifestyle-first roommate network. Take the quiz, see why you
            matched, and move in with people you actually get along with.
          </p>
          <div className="mt-5 flex gap-2">
            {[InstagramIcon, TwitterIcon, LinkedinIcon, MailIcon].map((Icon, i) =>
            <span
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream-200">
              
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            )}
          </div>
        </div>
        {columns.map((col) =>
        <div key={col.title}>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) =>
            <li key={l.label}>
                  <Link
                to={l.to}
                className="text-sm text-cream-200/70 transition-colors duration-150 ease-out hover:text-white">
                
                    {l.label}
                  </Link>
                </li>
            )}
            </ul>
          </div>
        )}
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            Cities live
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream-200/70">
            Bengaluru · Mumbai · Pune · Hyderabad · Delhi NCR · Chennai · Ahmedabad ·
            Kolkata
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-cream-200/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Roomie2Homie. Built for students and young professionals.</p>
          <p>Mock data only · no real listings</p>
        </div>
      </div>
    </footer>);

}