import { Schema, model, Document, Types } from 'mongoose';

export interface IRoomEnquiry extends Document {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  requesterId: Types.ObjectId;
  hostId: Types.ObjectId;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  responseMessage?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const RoomEnquirySchema = new Schema<IRoomEnquiry>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'responded', 'closed'],
      default: 'pending',
      required: true,
      index: true,
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'room_enquiries',
  }
);

// Compound indexes for fast lookups and duplicate prevention
RoomEnquirySchema.index({ requesterId: 1, roomId: 1, status: 1 });
RoomEnquirySchema.index({ hostId: 1, createdAt: -1 });
RoomEnquirySchema.index({ requesterId: 1, createdAt: -1 });

export const RoomEnquiry = model<IRoomEnquiry>('RoomEnquiry', RoomEnquirySchema);
