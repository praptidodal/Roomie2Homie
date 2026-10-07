import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparklesIcon, CheckCircle2Icon } from 'lucide-react';
import type { Lifestyle } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { FloatingBlob } from '../../components/ui/FloatingBlob';
import { api } from '../../services/api';
import { quizQuestions } from '../../data/mock';

export function Quiz() {
  const { user, update } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Lifestyle>>(
    user?.lifestyle || {}
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Restore existing answers if user already completed the quiz
  useEffect(() => {
    if (user?.lifestyle && Object.keys(user.lifestyle).length > 0) {
      setAnswers(user.lifestyle);
    }
  }, [user?.lifestyle]);

  const total = quizQuestions.length;
  const q = quizQuestions[step];
  const current = answers[q.key as keyof Lifestyle];
  const progress = Math.round((step + (current !== undefined ? 1 : 0)) / total * 100);

  function choose(value: string | boolean) {
    setAnswers((prev) => ({ ...prev, [q.key]: value }) as Partial<Lifestyle>);
    if (step < total - 1) {
      setTimeout(() => setStep((s) => s + 1), 180);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      const res = await api.saveLifestyle(answers);
      update({
        quizCompleted: true,
        lifestyle: res.user?.lifestyle || (answers as Lifestyle),
        profileStrength: res.user?.profileStrength ?? user?.profileStrength ?? 85,
      });
      setDone(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to save lifestyle answers.');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-8">
        <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-70" />
        <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-60" />

        <Card className="relative overflow-hidden rounded-4xl border border-stone-200/80 bg-white/95 p-8 sm:p-12 text-center shadow-floating backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-100 text-sage-600 shadow-sm border border-sage-200/80">
              <CheckCircle2Icon className="h-10 w-10 text-sage-600" />
            </div>

            <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-3.5 py-1 border border-sage-200/60">
              <CheckCircle2Icon className="h-3.5 w-3.5 text-sage-600" />
              <span className="text-xs font-semibold text-sage-700">Lifestyle profile complete</span>
            </div>

            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-wellness-dark">
              Lifestyle preferences saved
            </h1>
            <p className="mt-2 max-w-md text-sm text-wellness-muted">
              Your daily routines and living habits are now updated. We use these preferences to calculate real compatibility scores when you browse flatmate profiles.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {answers.sleep && (
                <Badge tone="sage">
                  Sleep: {String(answers.sleep).replace('_', ' ')}
                </Badge>
              )}
              {answers.food && (
                <Badge tone="peach">
                  Food: {String(answers.food).replace('_', ' ')}
                </Badge>
              )}
              {answers.cleanliness && (
                <Badge tone="lavender">
                  Tidiness: {String(answers.cleanliness).replace('_', ' ')}
                </Badge>
              )}
              {answers.social && (
                <Badge tone="neutral">
                  Social: {String(answers.social).replace('_', ' ')}
                </Badge>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/app/discover')}
                icon={<SparklesIcon className="h-4 w-4" aria-hidden />}
              >
                See my matches
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/dashboard')}
              >
                Go to dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8">
      <FloatingBlob tone="sage" size="lg" className="-top-12 -left-20 opacity-70" />
      <FloatingBlob tone="peach" size="md" className="top-1/3 -right-20 opacity-60" />

      {/* Progress header */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-sage-600">
            Lifestyle check
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-wellness-muted">{progress}% completed</span>
            <span className="text-sm font-bold text-wellness-dark font-display">
              Step {step + 1} of {total}
            </span>
          </div>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-stone-200/70">
          <div
            className="h-full rounded-full bg-sage-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="relative overflow-hidden rounded-4xl border border-stone-200/80 bg-white/95 p-7 sm:p-9 shadow-floating backdrop-blur-sm">
        <motion.div
          key={q.key}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-wellness-dark">
            {q.question}
          </h1>
          <p className="mt-2 text-sm text-wellness-muted">{q.helper}</p>

          <ul className="mt-7 space-y-3">
            {q.options.map((opt) => {
              const selected = current === opt.value;
              return (
                <li key={String(opt.value)}>
                  <button
                    type="button"
                    onClick={() => choose(opt.value)}
                    aria-pressed={selected}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border-2 px-5 py-4 text-left text-sm font-medium transition-all duration-150 ease-out cursor-pointer ${
                      selected
                        ? 'border-sage-500 bg-sage-50/70 text-wellness-dark shadow-sm'
                        : 'border-stone-200/80 bg-white text-stone-700 hover:border-sage-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected
                          ? 'border-sage-500 bg-sage-500 text-white'
                          : 'border-stone-300 bg-transparent'
                      }`}
                      aria-hidden
                    >
                      {selected && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>

        {/* Footer controls */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-stone-100 pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            icon={<ArrowLeftIcon className="h-4 w-4" aria-hidden />}
          >
            Back
          </Button>

          {step < total - 1 ? (
            <Button
              variant="secondary"
              onClick={() => setStep((s) => s + 1)}
              disabled={current === undefined}
              icon={<ArrowRightIcon className="h-4 w-4" aria-hidden />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={saving}
              disabled={Object.keys(answers).length < total}
              onClick={finish}
              icon={<SparklesIcon className="h-4 w-4" aria-hidden />}
            >
              Finish & see matches
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-5 text-center text-xs text-wellness-muted">
        You can retake this quiz anytime from your profile.
      </p>
    </div>
  );
}