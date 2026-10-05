import { Schema, model, Document, Types } from 'mongoose';

export interface ILifestyle {
  sleep: 'early_bird' | 'flexible' | 'night_owl';
  cleanliness: 'very_tidy' | 'tidy' | 'relaxed';
  social: 'homebody' | 'balanced' | 'very_social';
  food: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'jain';
  smoking: 'no' | 'occasionally' | 'yes';
  pets: boolean;
  guests: 'rarely' | 'sometimes' | 'often';
  workFromHome: boolean;
  music: 'headphones' | 'low_speaker' | 'loud';
  fitness: 'gym_daily' | 'sometimes' | 'not_really';
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  city: 'Bengaluru' | 'Mumbai' | 'Pune' | 'Hyderabad' | 'Delhi NCR' | 'Chennai' | 'Ahmedabad' | 'Kolkata';
  locality?: string;
  budget: number;
  moveInDate: Date;
  bio?: string;
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
  age: number;
  occupation?: string;
  company?: string;
  avatarUrl?: string;
  languages?: string[];
  interests?: string[];
  lifestyle: ILifestyle;
  hasRoom: boolean;
  quizCompleted: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  isVerified?: boolean;
  profileStrength: number;
  lastActiveAt: Date;
  isPaused: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LifestyleSchema = new Schema<ILifestyle>(
  {
    sleep: {
      type: String,
      enum: ['early_bird', 'flexible', 'night_owl'],
      default: 'flexible',
      required: true
    },
    cleanliness: {
      type: String,
      enum: ['very_tidy', 'tidy', 'relaxed'],
      default: 'tidy',
      required: true
    },
    social: {
      type: String,
      enum: ['homebody', 'balanced', 'very_social'],
      default: 'balanced',
      required: true
    },
    food: {
      type: String,
      enum: ['vegetarian', 'eggetarian', 'non_vegetarian', 'jain'],
      default: 'vegetarian',
      required: true
    },
    smoking: {
      type: String,
      enum: ['no', 'occasionally', 'yes'],
      default: 'no',
      required: true
    },
    pets: {
      type: Boolean,
      default: false,
      required: true
    },
    guests: {
      type: String,
      enum: ['rarely', 'sometimes', 'often'],
      default: 'sometimes',
      required: true
    },
    workFromHome: {
      type: Boolean,
      default: true,
      required: true
    },
    music: {
      type: String,
      enum: ['headphones', 'low_speaker', 'loud'],
      default: 'headphones',
      required: true
    },
    fitness: {
      type: String,
      enum: ['gym_daily', 'sometimes', 'not_really'],
      default: 'sometimes',
      required: true
    }
  },
  { _id: false }
);

export const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address format']
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true
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
      default: 'Bengaluru',
      required: true
    },
    locality: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60
    },
    budget: {
      type: Number,
      required: true,
      default: 20000,
      min: 3000,
      max: 200000
    },
    moveInDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500
    },
    gender: {
      type: String,
      enum: ['female', 'male', 'non_binary', 'prefer_not_to_say'],
      required: false,
    },
    age: {
      type: Number,
      required: true,
      default: 22,
      min: 18,
      max: 65
    },
    occupation: {
      type: String,
      default: '',
      maxlength: 80
    },
    company: {
      type: String,
      default: '',
      maxlength: 80
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    languages: {
      type: [String],
      default: ['English']
    },
    interests: {
      type: [String],
      default: []
    },
    lifestyle: {
      type: LifestyleSchema,
      default: () => ({}),
      required: true
    },
    hasRoom: {
      type: Boolean,
      default: false
    },
    quizCompleted: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    profileStrength: {
      type: Number,
      default: 35,
      min: 0,
      max: 100
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    isPaused: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

UserSchema.virtual('isVerified').get(function (this: IUser) {
  return this.verificationStatus === 'verified';
});

// Explicit compound indexes per Section 4 of schema proposal
UserSchema.index({ city: 1, budget: 1, isPaused: 1 });
UserSchema.index({ role: 1, verificationStatus: 1 });

export const User = model<IUser>('User', UserSchema);
