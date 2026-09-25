export type Role = 'user' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type MatchStatus = 'suggested' | 'incoming' | 'sent' | 'accepted' | 'declined';

export type SleepSchedule = 'early_bird' | 'flexible' | 'night_owl';
export type Cleanliness = 'very_tidy' | 'tidy' | 'relaxed';
export type Social = 'homebody' | 'balanced' | 'very_social';
export type FoodPref = 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'jain';
export type Smoking = 'no' | 'occasionally' | 'yes';

export interface Lifestyle {
  sleep: SleepSchedule;
  cleanliness: Cleanliness;
  social: Social;
  food: FoodPref;
  smoking: Smoking;
  pets: boolean;
  guests: 'rarely' | 'sometimes' | 'often';
  workFromHome: boolean;
  music: 'headphones' | 'low_speaker' | 'loud';
  fitness: 'gym_daily' | 'sometimes' | 'not_really';
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'non_binary';
  avatar: string;
  occupation: string;
  company: string;
  city: string;
  locality: string;
  budget: number;
  moveIn: string;
  bio: string;
  languages: string[];
  interests: string[];
  verification: VerificationStatus;
  lifestyle: Lifestyle;
  hasRoom: boolean;
  joinedAt: string;
  lastActive: string;
}

export interface CompatibilityFactor {
  label: string;
  score: number;
  you: string;
  them: string;
  note: string;
}

export interface MatchCandidate {
  profile: Profile;
  score: number;
  status: MatchStatus;
  sharedInterests: string[];
  factors: CompatibilityFactor[];
  requestedAt?: string;
  message?: string;
}

export interface Room {
  id: string;
  title: string;
  city: string;
  locality: string;
  rent: number;
  deposit: number;
  type: 'private_room' | 'shared_room' | 'studio' | 'full_flat';
  furnishing: 'furnished' | 'semi_furnished' | 'unfurnished';
  availableFrom: string;
  images: string[];
  amenities: string[];
  flatmates: number;
  preferredGender: 'any' | 'female' | 'male';
  hostId: string;
  verified: boolean;
  description: string;
  houseRules: string[];
  bills: {rent: number;maintenance: number;internet: number;electricity: number;};
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  at: string;
  read: boolean;
}

export interface ChatThread {
  id: string;
  participantId: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  online: boolean;
  typing?: boolean;
  context: string;
}

export type NotificationKind =
'match_request' |
'match_accepted' |
'message' |
'room' |
'verification' |
'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  link: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  city: string;
  verification: VerificationStatus;
  quizCompleted: boolean;
  profileStrength: number;
}