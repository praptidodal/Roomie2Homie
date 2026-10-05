import { Schema, model, Document, Types } from 'mongoose';

/**
 * Interface representing an administrative verification request.
 *
 * DATA SECURITY & MASKING SPECIFICATION:
 * - `idNumber` is intended ONLY for storing the masked/redacted identifier, NEVER the raw identifier.
 * - The service layer must transform (mask/redact) the user-submitted identifier before persistence.
 * - Model-level schema constraints (such as String type, trim, or maxlength) do NOT enforce masking
 *   or sanitize raw identifiers; masking must be strictly performed by the service layer prior to saving.
 * - Sensitive, raw, unmasked identification numbers must never be stored in plain text.
 * - Aadhaar verification, phone numbers, and SMS OTP verification are deferred to future scope
 *   and must NOT be added to this model or schema.
 */
export interface IVerificationRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  docType: 'College / University ID' | 'Company employee ID' | 'Passport' | 'Driving licence';
  /** Masked/redacted identifier string; raw identifiers must never be stored in plain text */
  idNumber: string;
  /** Securely encrypted raw identifier for authorized admin manual review */
  encryptedId?: string;
  documentUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const VerificationRequestSchema = new Schema<IVerificationRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    docType: {
      type: String,
      enum: ['College / University ID', 'Company employee ID', 'Passport', 'Driving licence'],
      required: true
    },
    // Intended only for the masked/redacted identifier, not the raw identifier.
    // The service layer must transform the submitted identifier before persistence;
    // schema constraints like trim or maxlength do not enforce masking.
    idNumber: {
      type: String,
      required: true,
      trim: true
    },
    // Securely encrypted raw identifier for authorized admin manual review only.
    // Plaintext raw identifiers are never stored.
    encryptedId: {
      type: String,
      trim: true,
      default: ''
    },
    documentUrl: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      required: true
    },
    rejectionReason: {
      type: String,
      default: '',
      maxlength: 300
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'verification_requests'
  }
);

// Admin verification FIFO review queue compound index per Section 4
VerificationRequestSchema.index({ status: 1, createdAt: 1 });

export const VerificationRequest = model<IVerificationRequest>(
  'VerificationRequest',
  VerificationRequestSchema
);
