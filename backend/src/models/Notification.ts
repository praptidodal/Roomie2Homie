import { Schema, model, Document, Types } from 'mongoose';

export interface IAppNotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  kind: 'match_request' | 'match_accepted' | 'message' | 'room' | 'verification' | 'system';
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const AppNotificationSchema = new Schema<IAppNotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    kind: {
      type: String,
      enum: ['match_request', 'match_accepted', 'message', 'room', 'verification', 'system'],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 120
    },
    body: {
      type: String,
      required: true,
      maxlength: 300
    },
    link: {
      type: String,
      required: true,
      maxlength: 200
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'notifications'
  }
);

// Compound unread badge count calculation & notification feed index per Section 4
AppNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const AppNotification = model<IAppNotification>('AppNotification', AppNotificationSchema);
