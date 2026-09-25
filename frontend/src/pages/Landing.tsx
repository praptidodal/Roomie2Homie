import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  HeartHandshakeIcon,
  HomeIcon,
  MessageCircleIcon,
  SparklesIcon,
  StarIcon } from
'lucide-react';
import { Logo } from '../components/layout/Logo';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompatibilityRing } from '../components/ui/CompatibilityRing';
import { Avatar } from '../components/ui/Avatar';
import { IMG, cities, profiles } from '../data/mock';
import { rupees } from '../utils/format';

const steps = [
{
  icon: SparklesIcon,
  title: 'Take the lifestyle quiz',
  body: 'Eight questions on sleep, cleanliness, food, guests and noise — the things that actually decide whether a flat works.'
},
{
  icon: HeartHandshakeIcon,
  title: 'See who fits, and why',
  body: 'Every profile carries a compatibility ring with a factor-by-factor breakdown. No mystery percentages.'
},
{
  icon: MessageCircleIcon,
  title: 'Match, chat, move in',
  body: 'Send a request, chat once it is accepted, then shortlist rooms together and split the rent transparently.'
}];


const testimonials = [
{
  name: 'Ananya Iyer',
  city: 'Koramangala, Bengaluru',
  avatar: IMG.ava1,
  quote:
  'I had three flat visits with strangers before this. The quiz put me with someone who also works till midnight — we have not argued once about noise.'
},
{
  name: 'Rohan Deshpande',
  city: 'HSR Layout, Bengaluru',
  avatar: IMG.ava2,
  quote:
  'The "Why You Matched" page is the reason I trusted it. Seeing that we both wanted a vegetarian kitchen saved a very awkward conversation.'
},
{
  name: 'Sanjana Reddy',
  city: 'Gachibowli, Hyderabad',
  avatar: IMG.ava5,
  quote:
  'Verified badges meant I could rule out broker accounts. Found a ₹16,500 studio and a flatmate for the flat next door.'
}];


export function Landing() {
  return (
    <div className="min-h-screen w-full bg-cream-200">
      <header className="sticky top-0 z-50 border-b border-cream-300 bg-cream-200/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            <a href="#how" className="text-sm font-semibold text-navy-600 hover:text-violet-700">
              How it works
            </a>
            <a href="#match" className="text-sm font-semibold text-navy-600 hover:text-violet-700">
              Compatibility
            </a>
            <a href="#rooms" className="text-sm font-semibold text-navy-600 hover:text-violet-700">
              Rooms
            </a>
            <a href="#stories" className="text-sm font-semibold text-navy-600 hover:text-violet-700">
              Stories
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="gradient" size="sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
            
            <Badge tone="violet">
              <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
              Lifestyle-first roommate matching
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
              Find a roommate who
              <span className="bg-violet-coral bg-clip-text text-transparent"> actually fits</span>
              , not just a room.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-600 sm:text-lg">
              Roomie2Homie matches students and young professionals across India on
              sleep, cleanliness, food, noise and budget — then shows you exactly why
              you matched before you message anyone.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" variant="gradient" className="w-full sm:w-auto" icon={<ArrowRightIcon className="h-4 w-4" aria-hidden />}>
                  Find my roommate
                </Button>
              </Link>
              <Link to="/app/rooms">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" icon={<HomeIcon className="h-4 w-4" aria-hidden />}>
                  Browse rooms
                </Button>
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
              { v: '12,840', l: 'Verified members' },
              { v: '5,738', l: 'Matches made' },
              { v: '1,962', l: 'Live rooms' }].
              map((s) =>
              <div key={s.l}>
                  <dt className="font-display text-2xl font-extrabold text-navy-900">{s.v}</dt>
                  <dd className="mt-0.5 text-xs text-navy-500">{s.l}</dd>
                </div>
              )}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
            className="relative">
            
            <div className="overflow-hidden rounded-[2rem] border border-cream-300 bg-white p-2 shadow-lift">
              <img
                src={IMG.hero}
                alt="Four flatmates laughing together in a sunlit apartment living room"
                className="h-72 w-full rounded-[1.6rem] object-cover sm:h-96" />
              
            </div>

            <div className="absolute -bottom-6 left-2 flex items-center gap-3 rounded-3xl border border-cream-300 bg-white p-4 shadow-lift sm:left-6">
              <CompatibilityRing score={94} tone="mint" size="sm" />
              <div>
                <p className="text-sm font-bold text-navy-900">You & Ananya</p>
                <p className="text-xs text-navy-500">Same sleep cycle · both very tidy</p>
              </div>
            </div>

            <div className="absolute -right-2 top-6 hidden rounded-3xl border border-cream-300 bg-white p-4 shadow-lift sm:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                Rent you split
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-navy-900">
                {rupees(21500)}<span className="text-xs text-navy-500">/mo</span>
              </p>
              <Badge tone="mint" className="mt-2">
                <BadgeCheckIcon className="h-3.5 w-3.5" aria-hidden />
                Verified flat
              </Badge>
            </div>
          </motion.div>
        </div>

        <div className="border-y border-cream-300 bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-sm text-navy-500 sm:px-6 lg:px-8">
            <span className="font-semibold text-navy-800">Live in</span>
            {cities.map((c) =>
            <span key={c}>{c}</span>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          Three steps from stranger to flatmate
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative rounded-3xl border border-cream-300 bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lift">
                
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-coral-400">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{step.body}</p>
              </li>);

          })}
        </ol>
      </section>

      {/* Compatibility showcase */}
      <section id="match" className="bg-navy-900 py-16 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <Badge tone="coral">Why You Matched</Badge>
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              A percentage is useless without the reason behind it
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream-200/75">
              Every match opens into a breakdown: sleep schedule, cleanliness,
              kitchen, social energy, habits and budget — with a short note on
              what to agree on before you sign a lease.
            </p>
            <Link to="/register" className="mt-7 inline-block">
              <Button size="lg" variant="gradient">
                See your matches
              </Button>
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 text-navy-900 shadow-lift">
            <div className="flex items-center gap-4">
              <Avatar name={profiles[0].name} src={profiles[0].avatar} size="md" ring />
              <div className="flex-1">
                <p className="font-display text-lg font-bold">You & {profiles[0].name}</p>
                <p className="text-sm text-navy-500">
                  {profiles[0].occupation} · {profiles[0].locality}
                </p>
              </div>
              <CompatibilityRing score={94} tone="mint" size="md" />
            </div>
            <ul className="mt-6 space-y-3">
              {[
              { label: 'Sleep schedule', score: 96, note: 'Both awake past 1am' },
              { label: 'Cleanliness', score: 94, note: 'Both clean common areas daily' },
              { label: 'Kitchen', score: 92, note: 'Vegetarian kitchen for both' },
              { label: 'Social energy', score: 78, note: 'She hosts a little more often' }].
              map((f) =>
              <li key={f.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-navy-800">{f.label}</span>
                    <span className="font-display font-bold text-violet-600">{f.score}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-300">
                    <div
                    className="h-full rounded-full bg-violet-coral"
                    style={{ width: `${f.score}%` }} />
                  
                  </div>
                  <p className="mt-1 text-xs text-navy-500">{f.note}</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section id="rooms" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
              Rooms posted by people, not brokers
            </h2>
            <p className="mt-2 max-w-xl text-sm text-navy-600">
              Every listing shows the flatmates already living there, the house rules
              and a full bill breakdown before you enquire.
            </p>
          </div>
          <Link to="/app/rooms">
            <Button variant="secondary">Browse all rooms</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[IMG.room1, IMG.room2, IMG.room3].map((img, i) =>
          <div
            key={img}
            className="overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lift">
            
              <img src={img} alt="Furnished room available on Roomie2Homie" className="h-48 w-full object-cover" />
              <div className="p-5">
                <p className="font-display text-base font-bold text-navy-900">
                  {['Private room · Koramangala', 'Private room · Indiranagar', 'Studio · Gachibowli'][i]}
                </p>
                <p className="mt-1 text-sm text-navy-500">
                  {[rupees(21500), rupees(28000), rupees(16500)][i]}/month · furnished
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stories */}
      <section id="stories" className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
            Flats that worked out
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) =>
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-3xl border border-cream-300 bg-cream-200 p-6">
              
                <div className="flex gap-0.5 text-coral-400" aria-label="5 out of 5">
                  {Array.from({ length: 5 }).map((_, i) =>
                <StarIcon key={i} className="h-4 w-4 fill-coral-400" aria-hidden />
                )}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-navy-700">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-6">
                  <Avatar name={t.name} src={t.avatar} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-navy-900">{t.name}</p>
                    <p className="text-xs text-navy-500">{t.city}</p>
                  </div>
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-violet-coral p-8 text-white sm:p-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Take the quiz. Meet your match this week.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
              Free to join, verified profiles, and no broker fees anywhere on the platform.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/register">
              <Button size="lg" variant="dark" className="w-full sm:w-auto">
                Create free account
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="secondary"
                className="w-full border-white/50 bg-white/15 text-white hover:bg-white/25 sm:w-auto">
                
                I already have one
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

}