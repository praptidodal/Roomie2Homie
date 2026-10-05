import { Schema, model, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  threadId: Types.ObjectId;
  senderId: Types.ObjectId;
  messageType: 'text' | 'room_enquiry' | 'system';
  roomId?: Types.ObjectId | null;
  body: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatMessageSchema = new Schema<IChatMessage>(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatThread',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    messageType: {
      type: String,
      enum: ['text', 'room_enquiry', 'system'],
      default: 'text',
      required: true
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      default: null
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'chat_messages'
  }
);

// Compound pagination index per Section 4
ChatMessageSchema.index({ threadId: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', ChatMessageSchema);
