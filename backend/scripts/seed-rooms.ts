/**
 * backend/scripts/seed-rooms.ts
 *
 * Seeds a small set of test rooms linked to a designated seed account.
 *
 * SAFEGUARDS:
 *  1. Requires SEED_USER_EMAIL env var. Will not invent a user ID.
 *  2. Reads MONGODB_URI from environment. Aborts if the URI hostname does not
 *     contain "dev", "test", or "localhost", unless ALLOW_PRODUCTION_SEED=true
 *     is set explicitly. This prevents accidental production seeding.
 *  3. Each room has a unique _seedTag embedded in its title as a marker.
 *     Before inserting, the script searches for the tag and skips the room if
 *     it already exists — making the operation idempotent (safe to run again).
 *  4. Never prints MONGODB_URI or credentials.
 *  5. Exits non-zero on any error.
 *
 * Usage (from the backend/ directory):
 *   SEED_USER_EMAIL=your@email.com npx tsx scripts/seed-rooms.ts
 *
 * Or with SEED_USER_EMAIL already in backend/.env:
 *   npx tsx scripts/seed-rooms.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Safety: database URI check ───────────────────────────────────────────────
const mongodbUri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomie2homie').trim();

const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true';
const isLikelySafeTarget =
  mongodbUri.includes('localhost') ||
  mongodbUri.includes('127.0.0.1') ||
  mongodbUri.toLowerCase().includes('dev') ||
  mongodbUri.toLowerCase().includes('test');

if (!isLikelySafeTarget && !allowProductionSeed) {
  console.error(
    '❌  The MONGODB_URI does not appear to point to a development or test database.\n' +
    '   URI hostname does not contain "dev", "test", or "localhost".\n' +
    '   Refusing to seed to avoid accidental production data modification.\n\n' +
    '   If you are certain this is a safe database, run with:\n' +
    '     ALLOW_PRODUCTION_SEED=true SEED_USER_EMAIL=... npx tsx scripts/seed-rooms.ts'
  );
  process.exit(1);
}

// ── Seed account: resolve by email ──────────────────────────────────────────
const seedUserEmail = (process.env.SEED_USER_EMAIL || '').trim().toLowerCase();
if (!seedUserEmail) {
  console.error(
    '❌  SEED_USER_EMAIL is not set.\n' +
    '   Set SEED_USER_EMAIL to the email of the designated seed account.\n' +
    '   Example:\n' +
    '     SEED_USER_EMAIL=yourtest@example.com npx tsx scripts/seed-rooms.ts\n\n' +
    '   The account must already exist in the database. This script will NOT create it.\n' +
    '   Register the seed account through the app first, then run this script.'
  );
  process.exit(1);
}

// ── Models ───────────────────────────────────────────────────────────────────
import { User } from '../src/models/User';
import { Room } from '../src/models/Room';
import { sanitizeMongoError } from '../src/config/database';

// ── Types ────────────────────────────────────────────────────────────────────
type RoomType = 'private_room' | 'shared_room' | 'studio' | 'full_flat';
type FurnishingType = 'furnished' | 'semi_furnished' | 'unfurnished';
type GenderPreference = 'any' | 'female' | 'male';
type CityType =
  | 'Bengaluru' | 'Mumbai' | 'Pune' | 'Hyderabad'
  | 'Delhi NCR' | 'Chennai' | 'Ahmedabad' | 'Kolkata';

interface SeedRoom {
  _seedTag: string;
  title: string;
  city: CityType;
  locality: string;
  rent: number;
  deposit: number;
  type: RoomType;
  furnishing: FurnishingType;
  availableFrom: Date;
  images: string[];
  amenities: string[];
  flatmates: number;
  preferredGender: GenderPreference;
  isVerified: boolean;
  description: string;
  houseRules: string[];
  bills: { rent: number; maintenance: number; internet: number; electricity: number };
  isActive: boolean;
}

// ── Room definitions ─────────────────────────────────────────────────────────
// Images reference paths from the existing frontend mock image set.
const SEED_ROOMS: SeedRoom[] = [
  {
    _seedTag: 'seed-room-koramangala-2bhk-2026',
    title: 'Sunlit private room in a calm 2BHK near Koramangala 5th Block',
    city: 'Bengaluru',
    locality: 'Koramangala',
    rent: 21500,
    deposit: 43000,
    type: 'private_room',
    furnishing: 'furnished',
    availableFrom: new Date('2026-10-01'),
    images: [
      '/af861e21-5414-4888-b572-8fd510f654e3.jpg',
      '/7b216db5-152f-47e1-b45b-3912748ad348.jpg',
    ],
    amenities: ['Wi-Fi 300 Mbps', 'Attached bathroom', 'Washing machine', 'Power backup'],
    flatmates: 1,
    preferredGender: 'any',
    isVerified: true,
    description:
      'Corner room with morning sunlight in a quiet lane off 5th Block. ' +
      'One flatmate, working professional, keeps the flat calm on weekdays. ' +
      'Shared kitchen, separate bathroom for each room.',
    houseRules: ['No smoking indoors', 'Guests with a heads-up', 'Quiet hours after 11pm'],
    bills: { rent: 21500, maintenance: 1500, internet: 400, electricity: 900 },
    isActive: true,
  },
  {
    _seedTag: 'seed-room-indiranagar-studio-2026',
    title: 'Studio apartment near Indiranagar 100ft Road',
    city: 'Bengaluru',
    locality: 'Indiranagar',
    rent: 28000,
    deposit: 56000,
    type: 'studio',
    furnishing: 'semi_furnished',
    availableFrom: new Date('2026-11-01'),
    images: [
      '/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg',
      '/af861e21-5414-4888-b572-8fd510f654e3.jpg',
    ],
    amenities: ['Wi-Fi 200 Mbps', 'Balcony', 'Lift', 'Pet friendly'],
    flatmates: 0,
    preferredGender: 'any',
    isVerified: true,
    description:
      'Compact studio with a balcony, 5 minutes walk to Indiranagar metro. ' +
      'Ideal for someone who wants complete independence without sharing common areas.',
    houseRules: ['No parties', 'Pets welcome', 'Split bills on the 5th'],
    bills: { rent: 28000, maintenance: 2000, internet: 500, electricity: 1200 },
    isActive: true,
  },
  {
    _seedTag: 'seed-room-hsr-shared-2026',
    title: 'Shared room in a lively 3BHK — HSR Layout Sector 2',
    city: 'Bengaluru',
    locality: 'HSR Layout',
    rent: 12000,
    deposit: 24000,
    type: 'shared_room',
    furnishing: 'furnished',
    availableFrom: new Date('2026-10-15'),
    images: [
      '/7b216db5-152f-47e1-b45b-3912748ad348.jpg',
      '/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg',
    ],
    amenities: ['Wi-Fi 150 Mbps', 'Cook 5 days/week', 'Two-wheeler parking', 'Terrace access'],
    flatmates: 3,
    preferredGender: 'any',
    isVerified: false,
    description:
      'Four of us in a 3BHK — mix of engineers and designers. ' +
      'Chill house, cook together on Sundays, movie nights on Fridays.',
    houseRules: ['Smoking on balcony only', 'Split groceries weekly'],
    bills: { rent: 12000, maintenance: 800, internet: 300, electricity: 600 },
    isActive: true,
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function run(): Promise<void> {
  // Connect
  try {
    await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅  Connected to database.');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌  Failed to connect to database:', sanitizeMongoError(msg));
    process.exit(1);
  }

  // Resolve seed user by email — never invent an ID
  const seedUser = await User.findOne({ email: seedUserEmail }).select('_id name email');
  if (!seedUser) {
    console.error(
      `❌  No user found with email "${seedUserEmail}".\n` +
      '   Register the designated seed account through the app first, then re-run this script.'
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`✅  Seed account found: "${seedUser.name}" (${seedUser.email})`);

  const hostId = seedUser._id;

  // Insert with idempotency check
  let inserted = 0;
  let skipped = 0;

  for (const roomDef of SEED_ROOMS) {
    const { _seedTag, ...roomData } = roomDef;

    const existing = await Room.findOne({ hostId, title: roomData.title });

    if (existing) {
      console.log(`⏭   Skipped (already exists): ${roomData.title}`);
      skipped++;
      continue;
    }

    await Room.create({ ...roomData, hostId, title: roomData.title });
    console.log(`✅  Inserted: ${roomData.title}`);
    inserted++;
  }

  console.log(`\n📊  Seed complete: ${inserted} inserted, ${skipped} skipped.`);
  await mongoose.disconnect();
  console.log('🔌  Disconnected.');
}

run().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('❌  Seed script failed:', sanitizeMongoError(msg));
  process.exit(1);
});
