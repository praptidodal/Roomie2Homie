import React, { useRef, useState } from 'react';
import { CheckCircle2Icon, ShieldCheckIcon, UploadCloudIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { VerificationBadge } from '../../components/ui/Badge';
import { api } from '../../services/api';

const docTypes = [
'College / University ID',
'Company employee ID',
'Aadhaar card',
'Passport',
'Driving licence'];


const benefits = [
'A verified badge on your profile and every match card',
'Appear 3× more often in discovery results',
'Message room hosts without waiting for a match',
'Access to verified-only listings'];


export function Verification() {
  const { user, update } = useAuth();
  const [docType, setDocType] = useState(docTypes[0]);
  const [idNumber, setIdNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const status = user?.verification ?? 'unverified';

  function pick(f: File | null) {
    setError('');
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)) {
      setError('Upload a JPG, PNG or PDF file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.');
      return;
    }
    setFile(f);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return setError('Please attach your document.');
    if (idNumber.trim().length < 4) return setError('Enter the ID number printed on the document.');
    setSubmitting(true);
    // TODO: POST /api/verification (Multer multipart upload → Cloudinary)
    await api.submitVerification(docType, file.name);
    setSubmitting(false);
    update({ verification: 'pending', profileStrength: Math.min(100, (user?.profileStrength ?? 70) + 8) });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety"
        title="Verify your identity"
        description="One document, reviewed within a working day. We never show it to other members."
        action={<VerificationBadge status={status} />} />
      

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          {status === 'verified' ?
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
            </div> :
          status === 'pending' ?
          <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
                <UploadCloudIcon className="h-8 w-8" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-xl font-extrabold text-navy-900">
                Your documents are under review
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-navy-500">
                Submitted {docType.toLowerCase()}. Most reviews finish within one working day, and
                you will get a notification the moment it is done.
              </p>
              <Button
              variant="ghost"
              className="mt-4"
              onClick={() => update({ verification: 'verified' })}>
              
                Simulate approval (demo)
              </Button>
            </div> :

          <>
              <CardHeader
              title="Upload a document"
              description="Government ID, college ID or company ID — whichever is easiest." />
            
              <form onSubmit={submit} className="space-y-4" noValidate>
                <Field label="Document type" htmlFor="doctype" required>
                  <Select id="doctype" value={docType} onChange={(e) => setDocType(e.target.value)}>
                    {docTypes.map((d) =>
                  <option key={d} value={d}>{d}</option>
                  )}
                  </Select>
                </Field>
                <Field label="ID number" htmlFor="idnum" hint="As printed on the document" required>
                  <Input
                  id="idnum"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 20BCE1043" />
                
                </Field>

                <div>
                  <p className="mb-1.5 text-sm font-bold text-navy-800">Document file</p>
                  <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-cream-300 bg-cream-200 px-6 py-10 text-center transition-colors duration-150 ease-out hover:border-violet-300 hover:bg-violet-50">
                  
                    <UploadCloudIcon className="h-7 w-7 text-violet-500" aria-hidden />
                    <span className="text-sm font-bold text-navy-900">
                      {file ? file.name : 'Click to upload or drag a file here'}
                    </span>
                    <span className="text-xs text-navy-500">JPG, PNG or PDF · up to 5 MB</span>
                  </button>
                  <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="sr-only"
                  onChange={(e) => pick(e.target.files?.[0] ?? null)} />
                
                </div>

                {error &&
              <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
                    {error}
                  </p>
              }

                <Button type="submit" variant="gradient" size="lg" block loading={submitting}>
                  Submit for review
                </Button>
              </form>
            </>
          }
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Why verify" />
            <ul className="space-y-3">
              {benefits.map((b) =>
              <li key={b} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-mint-500" aria-hidden />
                  {b}
                </li>
              )}
            </ul>
          </Card>

          <Card className="bg-navy-900 text-white">
            <CardHeader title="How we handle your document" />
            <p className="text-sm leading-relaxed text-cream-200/75">
              Files are stored encrypted, reviewed by our trust team, and never shared with other
              members. Only your verified badge is public — never the document or ID number.
            </p>
          </Card>
        </div>
      </div>
    </div>);

}