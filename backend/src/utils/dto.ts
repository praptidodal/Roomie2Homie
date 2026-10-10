import { IUser } from '../models/User';
import { IRoom } from '../models/Room';

// ---------------------------------------------------------------------------
// profileStrength — deterministic recalculation matching the frontend checklist
// ---------------------------------------------------------------------------
//   Base (registered)         35
//   Bio present              +20
//   Occupation present       +15
//   Locality present         +10
//   Languages ≥ 1            + 5
//   Interests ≥ 2            +10
//   Quiz completed           +20
//   Avatar URL present       +10
//   Identity verified        +10
//   Maximum                  100
// ---------------------------------------------------------------------------
export function calcProfileStrength(user: IUser): number {
  let score = 35;
  if (user.bio && user.bio.trim().length > 0) score += 20;
  if (user.occupation && user.occupation.trim().length > 0) score += 15;
  if (user.locality && user.locality.trim().length > 0) score += 10;
  if (user.languages && user.languages.length >= 1) score += 5;
  if (user.interests && user.interests.length >= 2) score += 10;
  if (user.quizCompleted) score += 20;
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) score += 10;
  if (user.verificationStatus === 'verified') score += 10;
  return Math.min(100, Math.max(0, score));
}

// ---------------------------------------------------------------------------
// Public profile DTO — used by GET /api/users/:id
// Excludes: email, passwordHash, isPaused, role, budget, moveInDate, bio (private)
// Exposes: identity, occupation, verification, city, lastActive (relative)
// ---------------------------------------------------------------------------
export interface PublicProfileDTO {
  id: string;
  name: string;
  avatarUrl: string;
  occupation: string;
  company: string;
  city: string;
  locality: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verified: boolean;
  /** Human-readable relative time, e.g. "12 min ago", "Online now" */
  lastActive: string;
}

export function toPublicProfileDTO(user: IUser): PublicProfileDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    avatarUrl: user.avatarUrl || '',
    occupation: user.occupation || '',
    company: user.company || '',
    city: user.city,
    locality: user.locality || '',
    verificationStatus: user.verificationStatus,
    verified: user.verificationStatus === 'verified',
    lastActive: relativeTime(user.lastActiveAt),
  };
}

// ---------------------------------------------------------------------------
// Candidate Profile DTO — used by Matching System (Discover, Matches, Detail)
// Maps backend fields to frontend Profile type expectations
// ---------------------------------------------------------------------------
export interface CandidateProfileDTO {
  id: string;
  name: string;
  age: number;
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
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
  verification: 'unverified' | 'pending' | 'verified' | 'rejected';
  verified: boolean;
  lifestyle: any;
  hasRoom: boolean;
  joinedAt: string;
  lastActive: string;
}

export function toCandidateProfileDTO(user: IUser): CandidateProfileDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    age: user.age || 22,
    gender: user.gender,
    avatar: user.avatarUrl || '',
    occupation: user.occupation || '',
    company: user.company || '',
    city: user.city,
    locality: user.locality || '',
    budget: user.budget || 20000,
    moveIn: user.moveInDate ? user.moveInDate.toISOString() : new Date().toISOString(),
    bio: user.bio || '',
    languages: user.languages || [],
    interests: user.interests || [],
    verification: user.verificationStatus,
    verified: user.verificationStatus === 'verified',
    lifestyle: user.lifestyle || {},
    hasRoom: Boolean(user.hasRoom),
    joinedAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    lastActive: relativeTime(user.lastActiveAt),
  };
}


// ---------------------------------------------------------------------------
// Room DTO — used by GET /api/rooms and GET /api/rooms/:id
// Maps backend field names (isVerified) → frontend field names (verified)
// ---------------------------------------------------------------------------
export interface RoomDTO {
  id: string;
  hostId: string;
  title: string;
  city: string;
  locality: string;
  rent: number;
  deposit: number;
  type: 'private_room' | 'shared_room' | 'studio' | 'full_flat';
  furnishing: 'furnished' | 'semi_furnished' | 'unfurnished';
  /** ISO 8601 date string */
  availableFrom: string;
  images: string[];
  amenities: string[];
  flatmates: number;
  preferredGender: 'any' | 'female' | 'male';
  /** Frontend expects `verified`, not `isVerified` */
  verified: boolean;
  description: string;
  houseRules: string[];
  bills: {
    rent: number;
    maintenance: number;
    internet: number;
    electricity: number;
  };
  isActive: boolean;
  createdAt: string;
}

export function toRoomDTO(room: IRoom): RoomDTO {
  return {
    id: room._id.toString(),
    hostId: room.hostId.toString(),
    title: room.title,
    city: room.city,
    locality: room.locality,
    rent: room.rent,
    deposit: room.deposit,
    type: room.type,
    furnishing: room.furnishing,
    availableFrom: room.availableFrom
      ? room.availableFrom.toISOString()
      : new Date().toISOString(),
    images: room.images,
    amenities: room.amenities,
    flatmates: room.flatmates,
    preferredGender: room.preferredGender,
    verified: room.isVerified,          // isVerified → verified (frontend expects this name)
    description: room.description,
    houseRules: room.houseRules,
    bills: {
      rent: room.bills?.rent ?? 0,
      maintenance: room.bills?.maintenance ?? 0,
      internet: room.bills?.internet ?? 0,
      electricity: room.bills?.electricity ?? 0,
    },
    isActive: room.isActive,
    createdAt: room.createdAt ? room.createdAt.toISOString() : new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function relativeTime(date: Date | undefined): string {
  if (!date) return 'Unknown';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Online now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
}
