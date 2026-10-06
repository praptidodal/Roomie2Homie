import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  targetType: 'Listing' | 'Profile' | 'Message';
  targetId: Types.ObjectId;
  subject: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

export const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['Listing', 'Profile', 'Message'],
      required: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'reports'
  }
);

// Admin flagged content queue index
ReportSchema.index({ status: 1, createdAt: 1 });

export const Report = model<IReport>('Report', ReportSchema);
