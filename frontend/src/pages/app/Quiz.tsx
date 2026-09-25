import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparklesIcon } from 'lucide-react';
import type { Lifestyle } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CompatibilityRing } from '../../components/ui/CompatibilityRing';
import { api } from '../../services/api';
import { currentUserLifestyle, quizQuestions } from '../../data/mock';

export function Quiz() {
  const { user, update } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Lifestyle>>(
    user?.quizCompleted ? currentUserLifestyle : {}
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const total = quizQuestions.length;
  const q = quizQuestions[step];
  const current = answers[q.key];
  const progress = Math.round((step + (current !== undefined ? 1 : 0)) / total * 100);

  function choose(value: string | boolean) {
    setAnswers((prev) => ({ ...prev, [q.key]: value }) as Partial<Lifestyle>);
    if (step < total - 1) setTimeout(() => setStep((s) => s + 1), 180);
  }

  async function finish() {
    setSaving(true);
    // TODO: PATCH /api/users/me/lifestyle
    await api.saveLifestyle(answers);
    setSaving(false);
    update({ quizCompleted: true, profileStrength: 88 });
    setDone(true);
  }

  if (done)
  return (
    <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <div className="flex flex-col items-center py-8">
            <CompatibilityRing score={94} tone="mint" size="lg" caption="Top match" />
            <h1 className="mt-6 font-display text-2xl font-extrabold text-navy-900">
              Your lifestyle profile is ready
            </h1>
            <p className="mt-2 max-w-md text-sm text-navy-500">
              We found 6 people in your city above 60% compatibility, including one at 94%.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
              variant="gradient"
              size="lg"
              onClick={() => navigate('/app/discover')}
              icon={<SparklesIcon className="h-4 w-4" aria-hidden />}>
              
                See my matches
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/app/dashboard')}>
                Go to dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>);


  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-500">
            Lifestyle quiz
          </p>
          <p className="text-sm font-bold text-navy-900">
            {step + 1} of {total}
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-300">
          <div
            className="h-full rounded-full bg-violet-coral"
            style={{ width: `${progress}%`, transition: 'width 220ms cubic-bezier(0.23,1,0.32,1)' }} />
          
        </div>
      </div>

      <Card>
        <motion.div
          key={q.key}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
          
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900">
            {q.question}
          </h1>
          <p className="mt-1.5 text-sm text-navy-500">{q.helper}</p>

          <ul className="mt-6 space-y-3">
            {q.options.map((opt) => {
              const selected = current === opt.value;
              return (
                <li key={String(opt.value)}>
                  <button
                    type="button"
                    onClick={() => choose(opt.value)}
                    aria-pressed={selected}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left text-sm font-semibold transition-colors duration-150 ease-out ${
                    selected ?
                    'border-violet-500 bg-violet-50 text-violet-700' :
                    'border-cream-300 bg-white text-navy-700 hover:border-violet-200 hover:bg-cream-200'}`
                    }>
                    
                    {opt.label}
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-violet-500 bg-violet-500 text-white' : 'border-cream-300'}`
                      }
                      aria-hidden>
                      
                      {selected && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </li>);

            })}
          </ul>
        </motion.div>

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-cream-300 pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            icon={<ArrowLeftIcon className="h-4 w-4" aria-hidden />}>
            
            Back
          </Button>
          {step < total - 1 ?
          <Button
            variant="secondary"
            onClick={() => setStep((s) => s + 1)}
            disabled={current === undefined}
            icon={<ArrowRightIcon className="h-4 w-4" aria-hidden />}>
            
              Next
            </Button> :

          <Button
            variant="gradient"
            loading={saving}
            disabled={Object.keys(answers).length < total}
            onClick={finish}>
            
              Finish & see matches
            </Button>
          }
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-navy-500">
        You can retake this quiz anytime from your profile.
      </p>
    </div>);

}