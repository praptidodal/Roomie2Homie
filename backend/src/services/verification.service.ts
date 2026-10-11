import crypto from 'crypto';
import { config } from '../config/environment';
import { IVerificationRequest } from '../models/VerificationRequest';
import { IUser } from '../models/User';

function getEncryptionKey(): Buffer {
  const secret = config.verificationEncryptionKey || config.jwtSecret;
  if (!secret) {
    throw new Error('Encryption secret is not configured in environment variables.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts raw college ID string using AES-256-GCM.
 * Plaintext identifiers are never persisted to MongoDB.
 */
export function encryptIdNumber(raw: string): string {
  const trimmed = (raw || '').trim();
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts encrypted college ID string using AES-256-GCM.
 * Only called by authorized admin controllers for manual verification review.
 */
export function decryptIdNumber(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) {
    return '';
  }
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    return '';
  }
  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export type AllowedDocType =
  | 'College / University ID'
  | 'Company employee ID'
  | 'Passport'
  | 'Driving licence';

/**
 * Transforms an ID number into a safe, masked representation.
 * Raw sensitive identifiers are never returned to normal users or public profiles.
 */
export function maskIdNumber(raw: string): string {
  const trimmed = (raw || '').trim();
  if (trimmed.length <= 4) {
    return '***' + (trimmed.slice(-1) || 'X');
  }
  const start = trimmed.slice(0, 2);
  const end = trimmed.slice(-2);
  const maskLength = Math.max(4, trimmed.length - 4);
  return `${start}${'*'.repeat(maskLength)}${end}`;
}

/**
 * Normalizes input string to one of the approved Mongoose enum values.
 */
export function normalizeDocType(type?: string): AllowedDocType {
  const lower = (type || '').toLowerCase().trim();
  if (lower.includes('college') || lower.includes('university') || lower.includes('student')) {
    return 'College / University ID';
  }
  if (lower.includes('company') || lower.includes('employee') || lower.includes('work')) {
    return 'Company employee ID';
  }
  if (lower.includes('passport')) {
    return 'Passport';
  }
  if (lower.includes('licence') || lower.includes('license') || lower.includes('driving')) {
    return 'Driving licence';
  }
  return 'College / University ID';
}

export interface VerificationDTO {
  id: string;
  userId: string;
  name?: string;
  avatar?: string;
  city?: string;
  type: AllowedDocType;
  docType: AllowedDocType;
  institution: string;
  maskedId: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt: string | null;
  user?: {
    id: string;
    name: string;
    city: string;
    avatar: string;
  };
}

/**
 * Converts a VerificationRequest Mongoose document to a safe DTO.
 */
export function toVerificationDTO(
  doc: IVerificationRequest,
  user?: IUser | null
): VerificationDTO {
  const docUrl = doc.documentUrl || '';
  const institution = docUrl.startsWith('institution:')
    ? docUrl.slice(12)
    : docUrl;

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: user?.name,
    avatar: user?.avatarUrl || '',
    city: user?.city,
    type: doc.docType,
    docType: doc.docType,
    institution: institution || 'College / University',
    maskedId: doc.idNumber, // already masked upon persistence
    status: doc.status === 'verified' ? 'approved' : doc.status,
    verificationStatus: doc.status,
    rejectionReason: doc.rejectionReason || undefined,
    submittedAt: doc.createdAt.toISOString(),
    reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
    user: user
      ? {
          id: user._id.toString(),
          name: user.name,
          city: user.city,
          avatar: user.avatarUrl || '',
        }
      : undefined,
  };
}

export interface AdminVerificationDTO extends VerificationDTO {
  /** Full, decrypted college ID available only to authorized administrators */
  idNumber: string;
}

/**
 * Converts a VerificationRequest document to an AdminVerificationDTO,
 * decrypting the sensitive college ID strictly for authorized administrators.
 */
export function toAdminVerificationDTO(
  doc: IVerificationRequest,
  user?: IUser | null
): AdminVerificationDTO {
  const base = toVerificationDTO(doc, user);
  let fullId = '';
  if (doc.encryptedId) {
    try {
      fullId = decryptIdNumber(doc.encryptedId);
    } catch {
      fullId = '';
    }
  }

  return {
    ...base,
    idNumber: fullId || base.maskedId,
  };
}

