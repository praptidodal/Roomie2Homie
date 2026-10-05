import { Schema, model, Document, Types } from 'mongoose';

export interface IMatchFactor {
  label: string;
  score: number;
  you?: string;
  them?: string;
  note?: string;
}

export interface ILifecycleEvent {
  action: 'declined' | 'retried' | 'accepted' | 'cancelled';
  at: Date;
  by: Types.ObjectId;
  reason?: string;
}

export interface IMatchRequest extends Document {
  _id: Types.ObjectId;
  userLowId: Types.ObjectId;
  userHighId: Types.ObjectId;
  requesterId: Types.ObjectId;
  recipientId: Types.ObjectId;
  status: 'sent' | 'accepted' | 'declined';
  score: number;
  sharedInterests?: string[];
  factors?: IMatchFactor[];
  message?: string;
  requestedAt: Date;
  respondedAt?: Date | null;
  retryAvailableAt?: Date | null;
  history?: ILifecycleEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export const MatchFactorSchema = new Schema<IMatchFactor>(
  {
    label: { type: String, required: true },
    score: { type: Number, required: true },
    you: { type: String },
    them: { type: String },
    note: { type: String }
  },
  { _id: false }
);

export const LifecycleEventSchema = new Schema<ILifecycleEvent>(
  {
    action: {
      type: String,
      enum: ['declined', 'retried', 'accepted', 'cancelled'],
      required: true
    },
    at: { type: Date, required: true, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String }
  },
  { _id: false }
);

export const MatchRequestSchema = new Schema<IMatchRequest>(
  {
    userLowId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
    },
    userHighId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['sent', 'accepted', 'declined'],
      default: 'sent',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    sharedInterests: {
      type: [String],
      default: [],
      validate: {
        validator: (val: string[]) => Array.isArray(val) && val.length <= 15,
        message: 'Max 15 shared interests allowed'
      }
    },
    factors: {
      type: [MatchFactorSchema],
      default: []
    },
    message: {
      type: String,
      default: '',
      maxlength: 300
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    respondedAt: {
      type: Date,
      default: null
    },
    retryAvailableAt: {
      type: Date,
      default: null,
      index: true
    },
    history: {
      type: [LifecycleEventSchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'match_requests'
  }
);

/**
 * Canonical pair scalar validation and assignment hook (Mongoose 9 async pre-hook).
 *
 * Verifies that userLowId and userHighId strictly match the canonical lexicographical
 * ordering of requesterId and recipientId:
 *   userLowId  = min(requesterId, recipientId)
 *   userHighId = max(requesterId, recipientId)
 *
 * Inconsistent supplied values are corrected to enforce canonical pair integrity,
 * ensuring no document can be validated or saved with inverted or mismatched pair IDs.
 *
 * IMPORTANT NOTE:
 * Mongoose pre('validate') hooks execute during document .validate() and .save() calls.
 * Direct collection / query-based updates (e.g. Model.findOneAndUpdate, Model.updateOne)
 * bypass document middleware. The service layer must explicitly maintain canonical
 * pair filters and updates when performing atomic conditional queries.
 */
MatchRequestSchema.pre('validate', async function () {
  if (this.requesterId && this.recipientId) {
    const reqStr = this.requesterId.toString();
    const recStr = this.recipientId.toString();

    if (reqStr === recStr) {
      throw new Error('Self-match request is not permitted: requesterId and recipientId must differ');
    }

    const expectedLow = reqStr < recStr ? this.requesterId : this.recipientId;
    const expectedHigh = reqStr < recStr ? this.recipientId : this.requesterId;

    // Enforce canonical pair fields: correct any missing, inverted, or inconsistent supplied values
    if (!this.userLowId || this.userLowId.toString() !== expectedLow.toString()) {
      this.userLowId = expectedLow;
    }
    if (!this.userHighId || this.userHighId.toString() !== expectedHigh.toString()) {
      this.userHighId = expectedHigh;
    }
  }
});

// CRITICAL REQUIREMENT: Unconditional unique compound index on { userLowId, userHighId }
MatchRequestSchema.index({ userLowId: 1, userHighId: 1 }, { unique: true });

// Query indexes for Sent / Received tabs per Section 4
MatchRequestSchema.index({ recipientId: 1, status: 1 });
MatchRequestSchema.index({ requesterId: 1, status: 1 });

export const MatchRequest = model<IMatchRequest>('MatchRequest', MatchRequestSchema);
