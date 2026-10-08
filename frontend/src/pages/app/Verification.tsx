import { useEffect, useState } from 'react';
import { CheckCircle2Icon, ClockIcon, ShieldAlertIcon, ShieldCheckIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { api } from '../../services/api';

const docTypes = [
  'College / University ID',
];

const benefits = [
  'A verified badge on your profile and every match card',
  'Appear 3× more often in discovery results',
  'Message room hosts without waiting for a match',
  'Access to verified-only listings',
];

export function Verification() {
  const { user, update } = useAuth();
  const [docType] = useState(docTypes[0]);
  const [institution, setInstitution] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allowResubmit, setAllowResubmit] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [serverInfo, setServerInfo] = useState<{
    institution?: string;
    maskedId?: string;
    docType?: string;
  } | null>(null);

  // Sync latest verification status from backend on mount
  useEffect(() => {
    let alive = true;
    api
      .getVerificationStatus()
      .then((res) => {
        if (!alive || !res) return;
        if (res.maskedId || res.institution) {
          setServerInfo({
            institution: res.institution,
            maskedId: res.maskedId,
            docType: res.docType || res.type,
          });
        }
        if (res.status === 'approved' || res.verificationStatus === 'verified') {
          update({ verification: 'verified' });
        } else if (res.status === 'pending') {
          update({ verification: 'pending' });
        } else if (res.status === 'rejected') {
          update({ verification: 'rejected' });
          if (res.rejectionReason) setRejectionReason(res.rejectionReason);
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const status = user?.verification ?? 'unverified';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!institution.trim() || institution.trim().length < 2) {
      return setError('Enter your college or university name.');
    }
    if (idNumber.trim().length < 4) {
      return setError('Enter the ID number printed on your college ID.');
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await api.submitVerificationRequest({
        type: docType,
        institution: institution.trim(),
        idNumber: idNumber.trim(),
      });
      setServerInfo({
        institution: res.institution,
        maskedId: res.maskedId,
        docType: res.type,
      });
      setSubmitting(false);
      update({
        verification: 'pending',
        profileStrength: Math.min(100, (user?.profileStrength ?? 70) + 8),
      });
      setAllowResubmit(false);
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to submit verification request.');
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety"
        title="Verify your identity"
        description="One document, reviewed within a working day. We never show it to other members."
        action={<VerificationBadge status={status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          {status === 'verified' ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-mint-50 text-mint-500">
                <ShieldCheckIcon className="h-8 w-8" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-xl font-extrabold text-navy-900">
                You are verified
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-navy-500">
                Your badge is live on your profile and every match card.
              </p>
            </div>
          ) : status === 'pending' && !allowResubmit ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
                <ClockIcon className="h-8 w-8" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-xl font-extrabold text-navy-900">
                Verification pending
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-navy-500">
                Your college ID is currently under manual review by our administration team.
              </p>

              <div className="mt-6 w-full max-w-xs space-y-2.5 rounded-2xl border border-cream-300 bg-cream-100/70 p-4 text-left">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-400">
                    Verification type
                  </span>
                  <p className="text-xs font-semibold text-navy-800">
                    College / University ID
                  </p>
                </div>
                {serverInfo?.institution && (
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-400">
                      Institution
                    </span>
                    <p className="text-xs font-semibold text-navy-800">
                      {serverInfo.institution}
                    </p>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-400">
                    College ID (Masked)
                  </span>
                  <p className="font-mono text-sm font-bold text-navy-900">
                    {serverInfo?.maskedId || '••••••••'}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-cream-300 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">
                    Status
                  </span>
                  <Badge tone="amber">Pending</Badge>
                </div>
              </div>
            </div>
          ) : status === 'rejected' && !allowResubmit ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-coral-50 text-coral-600">
                <ShieldAlertIcon className="h-8 w-8" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-xl font-extrabold text-navy-900">
                Verification rejected
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-navy-500">
                {rejectionReason || 'Your previous verification request was rejected. You can submit a new request.'}
              </p>
              <Button
                variant="primary"
                className="mt-6"
                onClick={() => setAllowResubmit(true)}>
                Submit a new request
              </Button>
            </div>
          ) : (
            <>
              <CardHeader
                title="Verify your identity"
                description="Fast college / university ID verification. No sensitive documents stored."
              />

              <form onSubmit={submit} className="space-y-4" noValidate>
                <Field
                  label="College / University name"
                  htmlFor="institution"
                  hint="Official institution name"
                  required>
                  <Input
                    id="institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. MIT World Peace University"
                    required
                  />
                </Field>

                <Field label="College Student ID number" htmlFor="idnum" hint="Your roll / registration number" required>
                  <Input
                    id="idnum"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 20BCE1043"
                    required
                  />
                </Field>

                {error && (
                  <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
                    {error}
                  </p>
                )}

                <Button type="submit" variant="primary" size="lg" block loading={submitting}>
                  Submit for review
                </Button>
              </form>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Why verify" />
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-mint-500" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-navy-900 text-white">
            <CardHeader title="How we handle your document" />
            <p className="text-sm leading-relaxed text-cream-200/75">
              Identifiers are automatically masked prior to storage. Only your verified badge is public — never the document or ID number.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}