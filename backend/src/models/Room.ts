import { Schema, model, Document, Types } from 'mongoose';

export interface IBills {
  rent?: number;
  maintenance?: number;
  internet?: number;
  electricity?: number;
}

export interface IRoom extends Document {
  _id: Types.ObjectId;
  hostId: Types.ObjectId;
  title: string;
  city: 'Bengaluru' | 'Mumbai' | 'Pune' | 'Hyderabad' | 'Delhi NCR' | 'Chennai' | 'Ahmedabad' | 'Kolkata';
  locality: string;
  rent: number;
  deposit: number;
  type: 'private_room' | 'shared_room' | 'studio' | 'full_flat';
  furnishing: 'furnished' | 'semi_furnished' | 'unfurnished';
  availableFrom: Date;
  images: string[];
  amenities: string[];
  flatmates: number;
  preferredGender: 'any' | 'female' | 'male';
  isVerified: boolean;
  description: string;
  houseRules: string[];
  bills: IBills;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const BillsSchema = new Schema<IBills>(
  {
    rent: { type: Number },
    maintenance: { type: Number },
    internet: { type: Number },
    electricity: { type: Number }
  },
  { _id: false }
);

export const RoomSchema = new Schema<IRoom>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100
    },
    city: {
      type: String,
      enum: [
        'Bengaluru',
        'Mumbai',
        'Pune',
        'Hyderabad',
        'Delhi NCR',
        'Chennai',
        'Ahmedabad',
        'Kolkata'
      ],
      required: true
    },
    locality: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      index: true
    },
    rent: {
      type: Number,
      required: true,
      min: 2000,
      max: 200000,
      index: true
    },
    deposit: {
      type: Number,
      required: true,
      min: 0,
      max: 1000000
    },
    type: {
      type: String,
      enum: ['private_room', 'shared_room', 'studio', 'full_flat'],
      default: 'private_room',
      required: true
    },
    furnishing: {
      type: String,
      enum: ['furnished', 'semi_furnished', 'unfurnished'],
      default: 'furnished',
      required: true
    },
    availableFrom: {
      type: Date,
      required: true,
      default: Date.now
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (val: string[]) => Array.isArray(val) && val.length <= 10,
        message: 'A listing can have at most 10 images'
      }
    },
    amenities: {
      type: [String],
      default: []
    },
    flatmates: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
      max: 10
    },
    preferredGender: {
      type: String,
      enum: ['any', 'female', 'male'],
      default: 'any',
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 1200
    },
    houseRules: {
      type: [String],
      default: [],
      validate: {
        validator: (val: string[]) => Array.isArray(val) && val.length <= 10,
        message: 'A listing can specify up to 10 house rules'
      }
    },
    bills: {
      type: BillsSchema,
      required: true,
      default: () => ({})
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'rooms'
  }
);

// Compound index per Section 4 of schema proposal
RoomSchema.index({ city: 1, isActive: 1, rent: 1 });

export const Room = model<IRoom>('Room', RoomSchema);
