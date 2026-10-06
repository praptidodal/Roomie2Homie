import { Schema, model, Document, Types } from 'mongoose';

export interface IChatThread extends Document {
  _id: Types.ObjectId;
  participantLow: Types.ObjectId;
  participantHigh: Types.ObjectId;
  participants: Types.ObjectId[];
  context?: string;
  lastMessage?: string;
  lastMessageAt: Date;
  lastSenderId?: Types.ObjectId | null;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatThreadSchema = new Schema<IChatThread>(
  {
    participantLow: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
    },
    participantHigh: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
    },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (val: Types.ObjectId[]) => Array.isArray(val) && val.length === 2,
        message: 'A chat thread must contain exactly two participants'
      }
    },
    context: {
      type: String,
      default: '',
      maxlength: 120
    },
    lastMessage: {
      type: String,
      default: '',
      maxlength: 250
    },
    lastMessageAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    lastSenderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => new Map<string, number>()
    }
  },
  {
    timestamps: true,
    collection: 'chat_threads'
  }
);

/**
 * Participant integrity and canonical ordering validation hook (Mongoose 9 async pre-hook).
 *
 * Verifies that:
 * 1. Exactly two distinct participant IDs are provided (no duplicates, no self-chat).
 * 2. participantLow and participantHigh are the canonical lexicographically ordered pair.
 * 3. participants array contains exactly those two IDs in the expected canonical order [participantLow, participantHigh].
 * 4. Inconsistent supplied fields are rejected or corrected regardless of how the document was created
 *    (via participants array, scalar fields, or both).
 *
 * IMPORTANT NOTE:
 * Mongoose pre('validate') hooks execute during document .validate() and .save() calls.
 * Direct collection / query-based updates or atomic upserts (e.g. Model.findOneAndUpdate with upsert)
 * bypass document middleware. The service layer must explicitly maintain canonical participant
 * values when constructing query filters and update operations.
 */
ChatThreadSchema.pre('validate', async function () {
  let low: Types.ObjectId | undefined = this.participantLow;
  let high: Types.ObjectId | undefined = this.participantHigh;

  // Case A: participants array is provided
  if (Array.isArray(this.participants) && this.participants.length > 0) {
    if (this.participants.length !== 2) {
      throw new Error('A chat thread must contain exactly two participants');
    }
    const p0 = this.participants[0];
    const p1 = this.participants[1];
    if (!p0 || !p1) {
      throw new Error('Both participant IDs in participants array must be defined');
    }
    const p0Str = p0.toString();
    const p1Str = p1.toString();
    if (p0Str === p1Str) {
      throw new Error('A chat thread cannot have identical participants: both users must differ');
    }

    const canonicalLow = p0Str < p1Str ? p0 : p1;
    const canonicalHigh = p0Str < p1Str ? p1 : p0;

    // Correct or enforce canonical pair scalars from participants
    low = canonicalLow;
    high = canonicalHigh;
  }
  // Case B: Only scalar fields provided (participants array omitted or empty)
  else if (low || high) {
    if (!low || !high) {
      throw new Error('Both participantLow and participantHigh must be provided if participants array is omitted');
    }
    const lowStr = low.toString();
    const highStr = high.toString();
    if (lowStr === highStr) {
      throw new Error('A chat thread cannot have identical participants: both users must differ');
    }
    if (lowStr > highStr) {
      // Inverted scalar order: correct to canonical
      const temp = low;
      low = high;
      high = temp;
    }
  }

  // Ensure both representations are synchronized, distinct, and canonical
  if (low && high) {
    const lowStr = low.toString();
    const highStr = high.toString();
    if (lowStr === highStr) {
      throw new Error('A chat thread cannot have identical participants: both users must differ');
    }
    if (lowStr > highStr) {
      const temp = low;
      low = high;
      high = temp;
    }
    this.participantLow = low;
    this.participantHigh = high;
    this.participants = [low, high];
  }
});

// CRITICAL REQUIREMENT: Unconditional unique compound index on { participantLow, participantHigh }
ChatThreadSchema.index({ participantLow: 1, participantHigh: 1 }, { unique: true });

// Multikey index for querying all threads of a user per Section 4
ChatThreadSchema.index({ participants: 1 });

// Standard index for sorting conversation threads by newest message per Section 4
ChatThreadSchema.index({ lastMessageAt: -1 });

export const ChatThread = model<IChatThread>('ChatThread', ChatThreadSchema);
