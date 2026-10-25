/**
 * backend/scripts/seed-pune.ts
 *
 * Comprehensive, deterministic, idempotent synthetic development dataset
 * centered around MIT World Peace University (MIT-WPU), Kothrud, and the Pune ecosystem.
 *
 * Safe to rerun: clears and recreates only synthetic seed records tagged with isSeed: true
 * or matching the seed email domain, preserving manually registered accounts.
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { User, IUser, ILifestyle } from '../src/models/User';
import { Room } from '../src/models/Room';
import { MatchRequest } from '../src/models/MatchRequest';
import { ChatThread } from '../src/models/ChatThread';
import { ChatMessage } from '../src/models/ChatMessage';
import { RoomEnquiry } from '../src/models/RoomEnquiry';
import { VerificationRequest } from '../src/models/VerificationRequest';
import { AppNotification } from '../src/models/Notification';
import { Report } from '../src/models/Report';
import { encryptIdNumber, maskIdNumber } from '../src/services/verification.service';
import { calcCompatibility } from '../src/utils/compatibility';
import { calcProfileStrength } from '../src/utils/dto';

const MONGODB_URI = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomie2homie').trim();

// Fixed seed tag for safe idempotent re-runs
const SEED_TAG = 'PUNE_DEV_SEED';
const SEED_EMAIL_DOMAIN = '@roomie2homie.seed';

async function runSeed() {
  console.log('🌱 Starting Roomie2Homie Pune/MIT-WPU synthetic seeding...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB database:', mongoose.connection.name);

  // Passwords configured via environment variables with safe development defaults
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Dev@Roomie2026';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@Roomie2026';
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'Student@Roomie2026';

  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const studentPasswordHash = await bcrypt.hash(studentPassword, 10);

  // 1. Clean up existing seeded records cleanly
  console.log('🧹 Cleaning previous synthetic seed records...');
  const seedUsers = await User.find({
    $or: [
      { email: { $regex: SEED_EMAIL_DOMAIN } },
      { email: 'admin@roomie2homie.com' },
      { email: 'mit.student@roomie2homie.com' },
      { bio: { $regex: '\\[SEED\\]' } },
    ],
  });
  const seedUserIds = seedUsers.map((u) => u._id);

  if (seedUserIds.length > 0) {
    await Promise.all([
      Room.deleteMany({ hostId: { $in: seedUserIds } }),
      MatchRequest.deleteMany({
        $or: [{ requesterId: { $in: seedUserIds } }, { recipientId: { $in: seedUserIds } }],
      }),
      ChatThread.deleteMany({
        $or: [{ participantLow: { $in: seedUserIds } }, { participantHigh: { $in: seedUserIds } }],
      }),
      ChatMessage.deleteMany({ senderId: { $in: seedUserIds } }),
      RoomEnquiry.deleteMany({
        $or: [{ requesterId: { $in: seedUserIds } }, { hostId: { $in: seedUserIds } }],
      }),
      VerificationRequest.deleteMany({ userId: { $in: seedUserIds } }),
      AppNotification.deleteMany({ userId: { $in: seedUserIds } }),
      Report.deleteMany({ reporterId: { $in: seedUserIds } }),
      User.deleteMany({ _id: { $in: seedUserIds } }),
    ]);
    console.log(`   Removed ${seedUserIds.length} existing seed user records and related documents.`);
  }

  // Also clean up any rooms with the seed tag
  await Room.deleteMany({ $or: [{ description: { $regex: "PUNE_DEV_SEED|\\[SEED\\]" } }, { title: { $regex: "\\[seed-room-" } }] });

  // 2. Define 40 Realistic Synthetic Users around MIT-WPU & Pune Localities
  console.log('👤 Seeding 40 realistic synthetic Pune / MIT-WPU users...');

  interface SeedUserData {
    email: string;
    passwordHash: string;
    role: 'user' | 'admin';
    name: string;
    gender: 'female' | 'male' | 'non_binary';
    age: number;
    city: 'Pune' | 'Bengaluru' | 'Mumbai';
    locality: string;
    budget: number;
    occupation: string;
    company: string;
    bio: string;
    hasRoom: boolean;
    verificationStatus: 'verified' | 'pending' | 'unverified';
    languages: string[];
    interests: string[];
    lifestyle: ILifestyle;
    avatarUrl?: string;
  }

  const rawUsers: SeedUserData[] = [
    // 0: Admin Account
    {
      email: 'admin@roomie2homie.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      name: 'Aditi Joshi',
      gender: 'female',
      age: 27,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 25000,
      occupation: 'Platform Administrator',
      company: 'Roomie2Homie',
      bio: 'Community safety and verified accounts supervisor for Pune student flats.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Community', 'Safety', 'Reading'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/465fe41c-c076-4c0c-98a8-c72e3573b12a.jpg',
    },

    // 1: Primary Demo Student Account (MIT-WPU B.Tech CSE)
    {
      email: 'mit.student@roomie2homie.com',
      passwordHash: studentPasswordHash,
      role: 'user',
      name: 'Aryan Deshmukh',
      gender: 'male',
      age: 21,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 12000,
      occupation: 'B.Tech Computer Science Student',
      company: 'MIT World Peace University',
      bio: '3rd year B.Tech CSE at MIT-WPU Kothrud. Looking for a flatmate near Paud Road / Ideal Colony. Up late coding or prepping for placements. Quiet, keep common areas tidy, big filter coffee fan.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Coding', 'Badminton', 'Filter coffee', 'Tech meetups'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },

    // 2: Tanvi Kulkarni (MIT-WPU MCA)
    {
      email: 'tanvi.kulkarni' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Tanvi Kulkarni',
      gender: 'female',
      age: 22,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 11000,
      occupation: 'MCA Student',
      company: 'MIT World Peace University',
      bio: 'First-year MCA at MIT-WPU. Love quiet study evenings, baking on weekends, and keeping common kitchen spotless. Looking for female flatmate in Kothrud/Karvenagar.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Baking', 'UI Design', 'Classical music', 'Reading'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'sometimes',
      },
      avatarUrl: '/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg',
    },

    // 3: Rohit Patil (Host with 2BHK in Kothrud)
    {
      email: 'rohit.patil' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Rohit Patil',
      gender: 'male',
      age: 23,
      city: 'Pune',
      locality: 'Paud Road',
      budget: 14000,
      occupation: 'MBA Marketing Student',
      company: 'MIT-WPU School of Management',
      bio: 'Have a spacious furnished 2BHK on Paud Road, 700m from MIT-WPU gate. One private room available. Gym in morning, college during day. Looking for neat flatmate.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Gym', 'Football', 'Cooking', 'Podcasts'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'very_social',
        food: 'non_vegetarian',
        smoking: 'occasionally',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'low_speaker',
        fitness: 'gym_daily',
      },
      avatarUrl: '/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg',
    },

    // 4: Neha Shinde (Cummins College Engg, Karvenagar)
    {
      email: 'neha.shinde' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Neha Shinde',
      gender: 'female',
      age: 21,
      city: 'Pune',
      locality: 'Karvenagar',
      budget: 9500,
      occupation: 'B.Tech IT Student',
      company: 'MKSSS Cummins College of Engineering',
      bio: 'Final year at Cummins College Karvenagar. Looking for a roommate to share a 2BHK flat near Pratibha Nagar. Quiet study atmosphere, strictly no smoking.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English'],
      interests: ['Robotics', 'Sketching', 'Trekking', 'Table tennis'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg',
    },

    // 5: Pranav Gokhale (COEP Mech Student, Shivajinagar)
    {
      email: 'pranav.gokhale' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Pranav Gokhale',
      gender: 'male',
      age: 22,
      city: 'Pune',
      locality: 'Shivajinagar',
      budget: 10500,
      occupation: 'B.Tech Mechanical Student',
      company: 'COEP Technological University',
      bio: 'Formula student team lead at COEP. Usually in the lab till 9pm. Need an understanding flatmate who respects quiet nights and shares flat chores.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Motorsport', 'Cycling', 'Chess', 'Rock music'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'eggetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/5057c662-42c7-48bf-9396-3108a77442f7.jpg',
    },

    // 6: Ishaan Mehta (KPIT Junior Dev, Bavdhan)
    {
      email: 'ishaan.mehta' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Ishaan Mehta',
      gender: 'male',
      age: 24,
      city: 'Pune',
      locality: 'Bavdhan',
      budget: 16000,
      occupation: 'Embedded Software Engineer',
      company: 'KPIT Technologies',
      bio: 'Work at KPIT Hinjewadi, live in Bavdhan near Chandni Chowk. 2BHK flat with a scenic hill view. Looking for a flatmate working in Hinjewadi or studying in Kothrud.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Gujarati', 'Hindi', 'English', 'Marathi'],
      interests: ['Automotive tech', 'Running', 'Cooking', 'Gaming'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: true,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg',
    },

    // 7: Ananya Desai (MIT-WPU Design, Kothrud)
    {
      email: 'ananya.desai' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Ananya Desai',
      gender: 'female',
      age: 22,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 13500,
      occupation: 'B.Des Product Design Student',
      company: 'MIT-WPU School of Design',
      bio: 'Design student with a room full of indoor plants. Looking for a female roommate in Ideal Colony or Mayur Colony. Vegetarians preferred.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Pottery', 'Plants', 'Indie cinema', 'Coffee brewing'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: true,
        guests: 'sometimes',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'sometimes',
      },
      avatarUrl: '/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg',
    },

    // 8: Siddharth Rao (Symbiosis Alum / Intern, S.B. Road)
    {
      email: 'siddharth.rao' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Siddharth Rao',
      gender: 'male',
      age: 23,
      city: 'Pune',
      locality: 'S.B. Road',
      budget: 17500,
      occupation: 'Fintech Analyst Intern',
      company: 'Bajaj Finserv',
      bio: 'Working on Senapati Bapat Road. Flat is centrally located near Pavilion Mall. Need a clean, responsible roommate. Quiet after 11pm on weekdays.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Kannada', 'English', 'Hindi', 'Marathi'],
      interests: ['Markets', 'Tennis', 'Brewing pour-overs', 'Podcasts'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'eggetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: false,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },

    // 9: Pooja Kadam (MIT-WPU Pharmacy, Kothrud - Pending Verification)
    {
      email: 'pooja.kadam' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Pooja Kadam',
      gender: 'female',
      age: 21,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 9000,
      occupation: 'B.Pharm Student',
      company: 'MIT-WPU School of Pharmacy',
      bio: '3rd year pharmacy student. Study-heavy routine, peaceful nature, non-smoker. Seeking shared room in Kothrud near Vanaz Metro.',
      hasRoom: false,
      verificationStatus: 'pending',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Badminton', 'Classical dance', 'Nature walks'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'not_really',
      },
      avatarUrl: '/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg',
    },

    // 10: Varun Kulkarni (Cummins India GET, Warje)
    {
      email: 'varun.kulkarni' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Varun Kulkarni',
      gender: 'male',
      age: 24,
      city: 'Pune',
      locality: 'Warje',
      budget: 10000,
      occupation: 'Graduate Trainee Engineer',
      company: 'Cummins India',
      bio: 'Mechanical engineer at Cummins Kothrud plant. Commute via Warje flyover. Clean, drama-free, early riser. Fine with non-veg kitchen.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Motorcycling', 'Cricket', 'Gym', 'Street food'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/5057c662-42c7-48bf-9396-3108a77442f7.jpg',
    },

    // 11: Aditya Gore (Frontend Dev, Baner)
    {
      email: 'aditya.gore' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Aditya Gore',
      gender: 'male',
      age: 25,
      city: 'Pune',
      locality: 'Baner',
      budget: 19000,
      occupation: 'Frontend Engineer',
      company: 'Persistent Systems',
      bio: 'Modern 3BHK flat near Baner High Street. One master room open. High-speed fiber, AC, modular kitchen. Looking for an IT flatmate or college student.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Open source', 'Gaming', 'Coffee', 'Trekking'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'eggetarian',
        smoking: 'no',
        pets: true,
        guests: 'sometimes',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'sometimes',
      },
      avatarUrl: '/465fe41c-c076-4c0c-98a8-c72e3573b12a.jpg',
    },

    // 12: Riya Saxena (Product Specialist, Aundh)
    {
      email: 'riya.saxena' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Riya Saxena',
      gender: 'female',
      age: 24,
      city: 'Pune',
      locality: 'Aundh',
      budget: 16500,
      occupation: 'Product Specialist',
      company: 'Zomato',
      bio: 'Spacious flat in Aundh near Westend Mall. Looking for a tidy female flatmate. Clean kitchen, shared chores, respectful of privacy.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Hindi', 'English'],
      interests: ['Yoga', 'Reading', 'Exploring cafes', 'Baking'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'gym_daily',
      },
      avatarUrl: '/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg',
    },

    // 13: Dev Malhotra (Symbiosis Law, Deccan)
    {
      email: 'dev.malhotra' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Dev Malhotra',
      gender: 'male',
      age: 22,
      city: 'Pune',
      locality: 'Deccan',
      budget: 15000,
      occupation: 'Law Student',
      company: 'Symbiosis Law School',
      bio: 'Penultimate year law student. Debater, moot court prep on weekends. Looking for a flat near FC Road or Deccan Gymkhana.',
      hasRoom: false,
      verificationStatus: 'pending',
      languages: ['Hindi', 'English', 'Punjabi'],
      interests: ['Debating', 'History', 'Podcasts', 'Squash'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'very_social',
        food: 'non_vegetarian',
        smoking: 'occasionally',
        pets: false,
        guests: 'often',
        workFromHome: true,
        music: 'loud',
        fitness: 'sometimes',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },

    // 14: Shruti Joshi (MIT-WPU BBA, Kothrud)
    {
      email: 'shruti.joshi' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Shruti Joshi',
      gender: 'female',
      age: 20,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 8500,
      occupation: 'BBA Student',
      company: 'MIT World Peace University',
      bio: '2nd year BBA student. Looking for twin-sharing room within walking distance of MIT-WPU Kothrud. Vegetarian only.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Marketing', 'Dance', 'Badminton'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg',
    },

    // 15: Kaustubh Phadke (Fergusson College Arts, Deccan)
    {
      email: 'kaustubh.phadke' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Kaustubh Phadke',
      gender: 'male',
      age: 21,
      city: 'Pune',
      locality: 'Deccan',
      budget: 8000,
      occupation: 'BA Economics Student',
      company: 'Fergusson College',
      bio: 'Fergusson student who spends weekends in libraries and old Pune cafes. Low maintenance, quiet, looking for a shared room in Deccan/Shivajinagar.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'German'],
      interests: ['Economics', 'Reading', 'Theatre', 'Heritage walks'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'not_really',
      },
      avatarUrl: '/5057c662-42c7-48bf-9396-3108a77442f7.jpg',
    },

    // 16: Gaurav Patil (Hinjewadi IT Intern, Hinjewadi)
    {
      email: 'gaurav.patil' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Gaurav Patil',
      gender: 'male',
      age: 23,
      city: 'Pune',
      locality: 'Hinjewadi',
      budget: 12500,
      occupation: 'Software Intern',
      company: 'Infosys Hinjewadi',
      bio: '6-month intern at Infosys Phase 2. Need flatmates to split 3BHK rent in Hinjewadi or Wakad. Non-smoker, easy to get along with.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Gaming', 'Cricket', 'Road trips'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'relaxed',
        social: 'balanced',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'low_speaker',
        fitness: 'gym_daily',
      },
      avatarUrl: '/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg',
    },

    // 17: Sayali More (MIT-WPU M.Tech, Kothrud)
    {
      email: 'sayali.more' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Sayali More',
      gender: 'female',
      age: 24,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 13000,
      occupation: 'M.Tech Data Science Student',
      company: 'MIT World Peace University',
      bio: 'Postgraduate student focusing on AI research. Peaceful, organized, early sleeper. Looking for a room near Vanaz or Anand Nagar Metro.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['AI Research', 'Yoga', 'Classical singing', 'Gardening'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'jain',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg',
    },

    // 18: Chinmay Apte (Host with Flat near MIT-WPU Back Gate)
    {
      email: 'chinmay.apte' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Chinmay Apte',
      gender: 'male',
      age: 23,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 11000,
      occupation: 'B.Tech IT Student & Flat Host',
      company: 'MIT World Peace University',
      bio: 'Hosting a 3BHK flat near MIT-WPU back gate. 2 roommates already studying here. Looking for a 3rd who is tidy and respects exam quiet hours.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Web dev', 'Football', 'Movies', 'Guitar'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'very_social',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },

    // 19: Meera Sen (Viman Nagar Symbiosis Design, Viman Nagar)
    {
      email: 'meera.sen' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Meera Sen',
      gender: 'female',
      age: 22,
      city: 'Pune',
      locality: 'Viman Nagar',
      budget: 15500,
      occupation: 'Fashion Communication Student',
      company: 'Symbiosis Viman Nagar',
      bio: 'Fashion communication student. Vibrant flat in Viman Nagar near Phoenix Marketcity. Looking for a creative flatmate who loves music and tidy spaces.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Bengali', 'English', 'Hindi'],
      interests: ['Photography', 'Fashion', 'Art history', 'Indie pop'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'very_social',
        food: 'non_vegetarian',
        smoking: 'occasionally',
        pets: true,
        guests: 'often',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'not_really',
      },
      avatarUrl: '/465fe41c-c076-4c0c-98a8-c72e3573b12a.jpg',
    },

    // 20-39: Additional diverse Pune students & young professionals
    {
      email: 'omkar.bhide' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Omkar Bhide',
      gender: 'male',
      age: 22,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 8500,
      occupation: 'BCA Student',
      company: 'MIT-WPU Faculty of Science',
      bio: 'BCA student living near Ideal Colony. Simple living, non-smoker, vegetarian.',
      hasRoom: false,
      verificationStatus: 'pending',
      languages: ['Marathi', 'Hindi'],
      interests: ['Cricket', 'Anime', 'Chess'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/5057c662-42c7-48bf-9396-3108a77442f7.jpg',
    },
    {
      email: 'aishwarya.p' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Aishwarya Pawar',
      gender: 'female',
      age: 23,
      city: 'Pune',
      locality: 'Karvenagar',
      budget: 12000,
      occupation: 'QA Analyst',
      company: 'Tata Technologies',
      bio: 'Working at Tata Tech Hinjewadi, living in Karvenagar. Looking for a neat female flatmate.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English'],
      interests: ['Baking', 'Fitness', 'Reading'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: false,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg',
    },
    {
      email: 'tejas.inamdar' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Tejas Inamdar',
      gender: 'male',
      age: 21,
      city: 'Pune',
      locality: 'Paud Road',
      budget: 9500,
      occupation: 'B.Tech Civil Student',
      company: 'MIT World Peace University',
      bio: 'Civil engineering student at MIT-WPU. Up early for site visits. Looking for flatmates near Paud Road.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Architecture', 'Trekking', 'Sketching'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'eggetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },
    {
      email: 'manasi.joshi' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Manasi Joshi',
      gender: 'female',
      age: 23,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 14000,
      occupation: 'Content Strategist',
      company: 'Josh Software',
      bio: 'Content writer working hybrid. Need quiet environment for meetings. Big tea drinker.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English'],
      interests: ['Writing', 'Poetry', 'Chai', 'Cats'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: true,
        guests: 'sometimes',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'sometimes',
      },
      avatarUrl: '/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg',
    },
    {
      email: 'harsh.sharma' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Harsh Sharma',
      gender: 'male',
      age: 22,
      city: 'Pune',
      locality: 'Bavdhan',
      budget: 13000,
      occupation: 'B.Tech CSE Student',
      company: 'MIT World Peace University',
      bio: 'CSE final year at MIT-WPU. Commute from Bavdhan via college bus. Non-veg kitchen ok.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Hindi', 'English'],
      interests: ['Coding', 'E-Sports', 'Gym'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'relaxed',
        social: 'balanced',
        food: 'non_vegetarian',
        smoking: 'occasionally',
        pets: false,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg',
    },
    {
      email: 'nikita.salunkhe' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Nikita Salunkhe',
      gender: 'female',
      age: 21,
      city: 'Pune',
      locality: 'Karvenagar',
      budget: 9000,
      occupation: 'B.Tech Instrumentation Student',
      company: 'Cummins College of Engineering',
      bio: 'Cummins student looking for twin sharing flat in Karvenagar near D-Mart. Peaceful flatmate needed.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English'],
      interests: ['Robotics', 'Painting', 'Yoga'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg',
    },
    {
      email: 'sanket.chavan' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Sanket Chavan',
      gender: 'male',
      age: 24,
      city: 'Pune',
      locality: 'S.B. Road',
      budget: 15000,
      occupation: 'Operations Associate',
      company: 'Swiggy Pune Hub',
      bio: 'Working on Senapati Bapat Road. Neat, punctual with bills, looking for flatmate near BMCC/Symbiosis.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Badminton', 'Food walks', 'Travel'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/5057c662-42c7-48bf-9396-3108a77442f7.jpg',
    },
    {
      email: 'radhika.nair' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Radhika Nair',
      gender: 'female',
      age: 23,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 14500,
      occupation: 'Graphic Designer',
      company: 'Freelance / Remote',
      bio: 'Remote designer working with creative studios. Quiet apartment in Mayur Colony with private balcony.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Malayalam', 'English', 'Hindi'],
      interests: ['Typography', 'Coffee', 'Indie films', 'Plants'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'eggetarian',
        smoking: 'no',
        pets: true,
        guests: 'rarely',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'sometimes',
      },
      avatarUrl: '/465fe41c-c076-4c0c-98a8-c72e3573b12a.jpg',
    },
    {
      email: 'atharva.dixit' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Atharva Dixit',
      gender: 'male',
      age: 22,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 11500,
      occupation: 'B.Tech AI & Data Science',
      company: 'MIT World Peace University',
      bio: '3rd year MIT-WPU AI student. Weekend hackathons, tech discussions, chill roommate wanted.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Hackathons', 'F1', 'Synthwave', 'Gym'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'very_social',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },
    {
      email: 'tanmay.shirke' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Tanmay Shirke',
      gender: 'male',
      age: 25,
      city: 'Pune',
      locality: 'Baner',
      budget: 18000,
      occupation: 'Backend Developer',
      company: 'PubMatic',
      bio: 'Software engineer working in Baner. 3BHK in Mohan Nagar with high-speed internet.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English'],
      interests: ['Go programming', 'Trekking', 'Board games'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg',
    },
    {
      email: 'sakshi.kulkarni' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Sakshi Kulkarni',
      gender: 'female',
      age: 21,
      city: 'Pune',
      locality: 'Paud Road',
      budget: 10000,
      occupation: 'B.Com Student',
      company: 'BMCC College Pune',
      bio: 'Studying at BMCC, looking for flat near Paud Road or Deccan. Strict cleanliness, calm space.',
      hasRoom: false,
      verificationStatus: 'unverified',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Accounts', 'Classical dance', 'Singing'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: false,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg',
    },
    {
      email: 'jay.shah' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Jay Shah',
      gender: 'male',
      age: 22,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 12000,
      occupation: 'BBA Finance Student',
      company: 'MIT World Peace University',
      bio: 'Jain student at MIT-WPU. Strictly Jain kitchen required. Looking for like-minded roommate in Kothrud.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Gujarati', 'Hindi', 'English'],
      interests: ['Finance', 'Cricket', 'Chess'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'jain',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/5057c662-42c7-48bf-9396-3108a77442f7.jpg',
    },
    {
      email: 'pranita.gadgil' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Pranita Gadgil',
      gender: 'female',
      age: 24,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 15000,
      occupation: 'Architect & Interior Designer',
      company: 'Studio Pune',
      bio: 'Architectural designer. Beautiful flat with ample natural light in Rambaug Colony, Kothrud.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'French'],
      interests: ['Interior design', 'Terrace gardening', 'Cycling'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: true,
        guests: 'sometimes',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'sometimes',
      },
      avatarUrl: '/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg',
    },
    {
      email: 'rahul.deshpande' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Rahul Deshpande',
      gender: 'male',
      age: 23,
      city: 'Pune',
      locality: 'Shivajinagar',
      budget: 11000,
      occupation: 'Law Intern',
      company: 'Pune District Court',
      bio: 'Law student interning at Shivajinagar court. Looking for a roommate who values quiet study time.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Constitutional Law', 'Reading', 'Cricket'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: false,
        music: 'headphones',
        fitness: 'not_really',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },
    {
      email: 'ananya.joshi' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Ananya Joshi',
      gender: 'female',
      age: 22,
      city: 'Pune',
      locality: 'Bavdhan',
      budget: 13000,
      occupation: 'Biotech Student',
      company: 'Bharati Vidyapeeth',
      bio: 'Masters student in Biotechnology. Friendly, organized, vegetarian flat preferred in Bavdhan/Kothrud.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English'],
      interests: ['Biology', 'Baking', 'Trekking'],
      lifestyle: {
        sleep: 'flexible',
        cleanliness: 'very_tidy',
        social: 'balanced',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg',
    },
    {
      email: 'siddhesh.k' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Siddhesh Kulkarni',
      gender: 'male',
      age: 24,
      city: 'Pune',
      locality: 'Aundh',
      budget: 17000,
      occupation: 'Data Analyst',
      company: 'Cognizant',
      bio: 'Data analyst at Cognizant. High-floor flat in Aundh with dedicated study/work room.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Data Viz', 'Formula 1', 'Cooking'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: true,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg',
    },
    {
      email: 'tejaswini.p' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Tejaswini Patil',
      gender: 'female',
      age: 21,
      city: 'Pune',
      locality: 'Kothrud',
      budget: 9000,
      occupation: 'MCA Student',
      company: 'MIT World Peace University',
      bio: 'MIT-WPU MCA 1st year. Quiet, focused on studies, looking for flatmate in Dahanukar Colony.',
      hasRoom: false,
      verificationStatus: 'pending',
      languages: ['Marathi', 'Hindi', 'English'],
      interests: ['Java', 'Music', 'Drawing'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg',
    },
    {
      email: 'rohan.b' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Rohan Bhosale',
      gender: 'male',
      age: 23,
      city: 'Pune',
      locality: 'Warje',
      budget: 9500,
      occupation: 'Mechanical Design Intern',
      company: 'Kirloskar Brothers',
      bio: 'Design intern at Kirloskar. Simple living, non-veg allowed, looking for roommate in Warje/Kothrud.',
      hasRoom: false,
      verificationStatus: 'verified',
      languages: ['Marathi', 'Hindi'],
      interests: ['CAD', 'Motorcycles', 'Fitness'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'tidy',
        social: 'balanced',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'sometimes',
        workFromHome: false,
        music: 'headphones',
        fitness: 'gym_daily',
      },
      avatarUrl: '/5057c662-42c7-48bf-9396-3108a77442f7.jpg',
    },
    {
      email: 'swati.deshmukh' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Swati Deshmukh',
      gender: 'female',
      age: 22,
      city: 'Pune',
      locality: 'Karvenagar',
      budget: 11000,
      occupation: 'B.Tech IT Student',
      company: 'Cummins College',
      bio: 'Cummins final year student. Clean flat near Pratibha Nagar. Need one female roommate.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English'],
      interests: ['Algorithms', 'Badminton', 'Trekking'],
      lifestyle: {
        sleep: 'early_bird',
        cleanliness: 'very_tidy',
        social: 'homebody',
        food: 'vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'rarely',
        workFromHome: true,
        music: 'headphones',
        fitness: 'sometimes',
      },
      avatarUrl: '/465fe41c-c076-4c0c-98a8-c72e3573b12a.jpg',
    },
    {
      email: 'viraj.k' + SEED_EMAIL_DOMAIN,
      passwordHash: defaultPasswordHash,
      role: 'user',
      name: 'Viraj Kulkarni',
      gender: 'male',
      age: 22,
      city: 'Pune',
      locality: 'Paud Road',
      budget: 12000,
      occupation: 'B.Tech CSE Student',
      company: 'MIT World Peace University',
      bio: 'MIT-WPU student. Flat right opposite Ideal Colony Metro. Looking for flatmate to share master bedroom.',
      hasRoom: true,
      verificationStatus: 'verified',
      languages: ['Marathi', 'English', 'Hindi'],
      interests: ['Cloud computing', 'Football', 'Cooking'],
      lifestyle: {
        sleep: 'night_owl',
        cleanliness: 'tidy',
        social: 'very_social',
        food: 'non_vegetarian',
        smoking: 'no',
        pets: false,
        guests: 'often',
        workFromHome: true,
        music: 'low_speaker',
        fitness: 'sometimes',
      },
      avatarUrl: '/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg',
    },
  ];

  // 2.1 Deterministic, 100% gender-aligned avatar assignment
  const FEMALE_AVATARS = [
    "/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg", // ava1: Indian woman with long dark hair, green top
    "/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg", // ava3: Indian woman with curly hair & glasses, coral sweater
    "/5057c662-42c7-48bf-9396-3108a77442f7.jpg", // ava5: Indian woman with short dark hair, mint green t-shirt
  ];

  const MALE_AVATARS = [
    "/465fe41c-c076-4c0c-98a8-c72e3573b12a.jpg", // ava2: Indian man with purple t-shirt & light stubble
    "/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg", // ava4: Indian man with white linen shirt & neat beard
    "/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg", // ava6: Indian man with navy hoodie, glasses & wavy hair
  ];

  function getStableAvatar(gender: string, stableKey: string): string {
    // 32-bit FNV-1a hash of stableKey (email) for deterministic, stable indexing
    let hash = 2166136261;
    for (let i = 0; i < stableKey.length; i++) {
      hash ^= stableKey.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const positiveHash = Math.abs(hash);

    if (gender === 'female') {
      return FEMALE_AVATARS[positiveHash % FEMALE_AVATARS.length];
    }
    if (gender === 'male') {
      return MALE_AVATARS[positiveHash % MALE_AVATARS.length];
    }
    if (gender === 'non_binary') {
      // Neutral fallback: do not assign a gendered avatar
      return '';
    }
    throw new Error(
      `Unsupported gender value "${gender}" for user "${stableKey}". Must be 'female', 'male', or 'non_binary'.`
    );
  }

  for (const u of rawUsers) {
    u.avatarUrl = getStableAvatar(u.gender, u.email);
  }

  // Pre-seed verification: audit that every user has a strictly gender-consistent avatar
  for (const u of rawUsers) {
    if (u.gender === 'female') {
      if (!FEMALE_AVATARS.includes(u.avatarUrl!)) {
        throw new Error(`Avatar gender mismatch for female user: ${u.name}`);
      }
    } else if (u.gender === 'male') {
      if (!MALE_AVATARS.includes(u.avatarUrl!)) {
        throw new Error(`Avatar gender mismatch for male user: ${u.name}`);
      }
    } else if (u.gender === 'non_binary') {
      if (u.avatarUrl && (FEMALE_AVATARS.includes(u.avatarUrl) || MALE_AVATARS.includes(u.avatarUrl))) {
        throw new Error(`Non-binary user "${u.name}" must not receive a gendered avatar.`);
      }
    } else {
      throw new Error(`Unsupported gender "${u.gender}" for user "${u.name}".`);
    }
  }

  const createdUsers: IUser[] = [];

  for (const raw of rawUsers) {
    const userDoc = new User({
      ...raw,
      quizCompleted: true,
      moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 4) * 3600 * 1000),
      isPaused: false,
    });
    userDoc.profileStrength = calcProfileStrength(userDoc);
    await userDoc.save();
    createdUsers.push(userDoc);
  }

  console.log(`✅ Successfully seeded ${createdUsers.length} synthetic users in MongoDB.`);

  // Mapping helper to find created user by email prefix
  const findUser = (emailPrefix: string): IUser => {
    const match = createdUsers.find((u) => u.email.startsWith(emailPrefix));
    if (!match) throw new Error(`User with prefix ${emailPrefix} not found in seeded list`);
    return match;
  };

  const aryan = findUser('mit.student');
  const adminUser = findUser('admin@roomie2homie.com');
  const tanvi = findUser('tanvi.kulkarni');
  const rohit = findUser('rohit.patil');
  const neha = findUser('neha.shinde');
  const pranav = findUser('pranav.gokhale');
  const ishaan = findUser('ishaan.mehta');
  const ananya = findUser('ananya.desai');
  const siddharth = findUser('siddharth.rao');
  const pooja = findUser('pooja.kadam');
  const varun = findUser('varun.kulkarni');
  const aditya = findUser('aditya.gore');
  const riya = findUser('riya.saxena');
  const dev = findUser('dev.malhotra');
  const chinmay = findUser('chinmay.apte');
  const viraj = findUser('viraj.k');
  const pranita = findUser('pranita.gadgil');
  const aishwarya = findUser('aishwarya.p');
  const manasi = findUser('manasi.joshi');
  const sanket = findUser('sanket.chavan');
  const tanmay = findUser('tanmay.shirke');
  const swati = findUser('swati.deshmukh');
  const harsh = findUser('harsh.sharma');
  const tejas = findUser('tejas.inamdar');
  const omkar = findUser('omkar.bhide');
  const tejaswini = findUser('tejaswini.p');

  // 3. Seed 24 Realistic Pune Student / Young-Professional Rooms
  console.log('🏠 Seeding 24 realistic Pune room listings...');

  interface SeedRoomData {
    hostId: Types.ObjectId;
    title: string;
    city: 'Pune';
    locality: string;
    rent: number;
    deposit: number;
    type: 'private_room' | 'shared_room' | 'studio';
    furnishing: 'furnished' | 'semi_furnished' | 'unfurnished';
    availableFrom: Date;
    images: string[];
    amenities: string[];
    flatmates: number;
    preferredGender: 'any' | 'female' | 'male';
    isVerified: boolean;
    description: string;
    houseRules: string[];
    bills: { rent: number; maintenance: number; internet: number; electricity: number };
    isActive: boolean;
  }

  const rawRooms: SeedRoomData[] = [
    {
      hostId: rohit._id,
      title: 'Private AC Room in 2BHK · 700m from MIT-WPU Gate, Paud Road',
      city: 'Pune',
      locality: 'Paud Road',
      rent: 11500,
      deposit: 23000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'AC', 'Washing Machine', 'RO Water', 'Bike Parking', 'Geyser'],
      flatmates: 1,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Spacious private bedroom with attached washroom in a peaceful 2BHK flat. Just 7 minutes walk to MIT-WPU Kothrud campus and 200m from Paud Road Metro station. Ideal for college students or interns. ',
      houseRules: ['Quiet hours after 11pm', 'No indoor smoking', 'Shared maid & grocery bill'],
      bills: { rent: 11500, maintenance: 800, internet: 350, electricity: 600 },
      isActive: true,
    },
    {
      hostId: neha._id,
      title: 'Shared 2-Occupancy Room for Female Student · Karvenagar near Cummins',
      city: 'Pune',
      locality: 'Karvenagar',
      rent: 6800,
      deposit: 13600,
      type: 'shared_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['Wi-Fi', 'Geyser', 'RO Water', 'Study Table', 'Cupboard', '24x7 Security'],
      flatmates: 2,
      preferredGender: 'female',
      isVerified: true,
      description:
        'One bed in a twin-sharing master bedroom in a safe gated society near Cummins College Pratibha Nagar. Very peaceful study environment, vegetarian kitchen preferred. ',
      houseRules: ['Strictly no smoking', 'Female students/working professionals only', 'Keep kitchen tidy after cooking'],
      bills: { rent: 6800, maintenance: 500, internet: 250, electricity: 400 },
      isActive: true,
    },
    {
      hostId: ananya._id,
      title: 'Sunlit Private Room in Ideal Colony, Kothrud (Near Vanaz Metro)',
      city: 'Pune',
      locality: 'Kothrud',
      rent: 13000,
      deposit: 26000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Wi-Fi', 'Washing Machine', 'Balcony', 'Modular Kitchen', 'Refrigerator'],
      flatmates: 1,
      preferredGender: 'female',
      isVerified: true,
      description:
        'Peaceful top-floor room with private balcony in Ideal Colony, Kothrud. Ample natural light, surrounded by trees. 1 km from MIT-WPU and close to Vanaz Metro station. ',
      houseRules: ['Respect common quiet hours', 'Keep common areas clean', 'Pets welcome'],
      bills: { rent: 13000, maintenance: 1000, internet: 400, electricity: 700 },
      isActive: true,
    },
    {
      hostId: ishaan._id,
      title: 'Studio Flat / 1RK with Hill View · Bavdhan near Chandni Chowk',
      city: 'Pune',
      locality: 'Bavdhan',
      rent: 14500,
      deposit: 30000,
      type: 'studio',
      furnishing: 'semi_furnished',
      availableFrom: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'Geyser', 'Dedicated Parking', 'Power Backup', 'Terrace Access'],
      flatmates: 0,
      preferredGender: 'any',
      isVerified: true,
      description:
        'Independent 1RK studio apartment on the 4th floor with scenic view of Bavdhan hills. 10 minutes drive to MIT-WPU Kothrud via Paud Road, quick access to Hinjewadi bypass. ',
      houseRules: ['No loud music after midnight', 'Maintain building cleanliness'],
      bills: { rent: 14500, maintenance: 600, internet: 400, electricity: 500 },
      isActive: true,
    },
    {
      hostId: aditya._id,
      title: 'Master Bedroom in Luxury 3BHK · Baner High Street for IT / Students',
      city: 'Pune',
      locality: 'Baner',
      rent: 17500,
      deposit: 35000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['High-speed Wi-Fi', 'AC', 'Swimming Pool', 'Gym', 'Covered Car Parking', 'Cook Available'],
      flatmates: 2,
      preferredGender: 'any',
      isVerified: true,
      description:
        'High-end gated society flat on Baner High Street. 300 Mbps fiber internet, attached balcony, private bathroom. Great food options and direct connectivity to Hinjewadi & S.B. Road. ',
      houseRules: ['Non-smokers preferred', 'Shared cook expense split equally'],
      bills: { rent: 17500, maintenance: 1200, internet: 500, electricity: 900 },
      isActive: true,
    },
    {
      hostId: siddharth._id,
      title: 'Executive Single Room · Senapati Bapat Road near Symbiosis',
      city: 'Pune',
      locality: 'S.B. Road',
      rent: 16000,
      deposit: 32000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Wi-Fi', 'Air Cooler', 'Geyser', 'Washing Machine', 'Security Guard', 'Bike Parking'],
      flatmates: 1,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Centrally located on S.B. Road behind Pavilion Mall. Walking distance to BMCC and Symbiosis College. Fully furnished with study desk, ergonomic chair, and wardrobes. ',
      houseRules: ['Quiet after 11pm on weekdays', 'Clean up after cooking in shared kitchen'],
      bills: { rent: 16000, maintenance: 900, internet: 400, electricity: 750 },
      isActive: true,
    },
    {
      hostId: chinmay._id,
      title: 'Shared 2-Bed Room in 3BHK · 300m from MIT-WPU Back Gate, Kothrud',
      city: 'Pune',
      locality: 'Kothrud',
      rent: 7500,
      deposit: 15000,
      type: 'shared_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'RO Water', 'Washing Machine', 'Gas Stove', 'Water Heater'],
      flatmates: 2,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Literally 3 minutes walk to MIT-WPU campus back entrance. Looking for one student roommate to take the second bed in a large double room. Zero travel time to college. ',
      houseRules: ['No smoking inside flat', 'Keep study hours quiet during exams'],
      bills: { rent: 7500, maintenance: 400, internet: 250, electricity: 350 },
      isActive: true,
    },
    {
      hostId: viraj._id,
      title: 'Furnished Master Bedroom in 2BHK · Ideal Colony Metro, Paud Road',
      city: 'Pune',
      locality: 'Paud Road',
      rent: 12500,
      deposit: 25000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['Wi-Fi', 'AC', 'Geyser', 'Washing Machine', 'Refrigerator', 'Attached Bathroom'],
      flatmates: 1,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Large master bedroom with attached bathroom and balcony facing Paud Road. Metro station is 100 meters away. Quick commute to MIT-WPU and Deccan Gymkhana. ',
      houseRules: ['Shared cleaning chores weekly', 'Friends visiting on weekends ok'],
      bills: { rent: 12500, maintenance: 800, internet: 350, electricity: 650 },
      isActive: true,
    },
    {
      hostId: riya._id,
      title: 'Private Bedroom in 2BHK Flat · Medipoint Road, Aundh',
      city: 'Pune',
      locality: 'Aundh',
      rent: 15000,
      deposit: 30000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Wi-Fi', 'Washing Machine', 'RO Water', 'Microwave', 'Bike Parking'],
      flatmates: 1,
      preferredGender: 'female',
      isVerified: true,
      description:
        'Peaceful society near Medipoint Hospital, Aundh. Looking for a neat female flatmate working in Pune or studying. Modern kitchen, vegetarian preferred. ',
      houseRules: ['Quiet hours after 10:30pm', 'No pets', 'Vegetarian food only'],
      bills: { rent: 15000, maintenance: 700, internet: 400, electricity: 600 },
      isActive: true,
    },
    {
      hostId: pranita._id,
      title: 'Designer 1BHK Flat / Private Room · Rambaug Colony, Kothrud',
      city: 'Pune',
      locality: 'Kothrud',
      rent: 14000,
      deposit: 28000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'Balcony Garden', 'Washing Machine', 'Geyser', 'Modular Kitchen'],
      flatmates: 1,
      preferredGender: 'female',
      isVerified: true,
      description:
        'Custom-designed peaceful flat in Rambaug Colony, Kothrud. Ample storage, quiet leafy neighbourhood, 10 min to MIT-WPU. Looking for respectful female roommate. ',
      houseRules: ['Respect plant care & quiet hours', 'No indoor smoking'],
      bills: { rent: 14000, maintenance: 800, internet: 350, electricity: 550 },
      isActive: true,
    },
    {
      hostId: aishwarya._id,
      title: 'Single Occupancy Room · Pratibha Nagar, Karvenagar',
      city: 'Pune',
      locality: 'Karvenagar',
      rent: 9800,
      deposit: 19600,
      type: 'private_room',
      furnishing: 'semi_furnished',
      availableFrom: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['Wi-Fi', 'RO Water', 'Geyser', 'Study Desk', 'Two-wheeler Parking'],
      flatmates: 1,
      preferredGender: 'female',
      isVerified: true,
      description:
        'Cozy private room in Karvenagar near Cummins College. Clean society with 24 hours security. Female student or working professional preferred. ',
      houseRules: ['Female only', 'Clean common kitchen daily'],
      bills: { rent: 9800, maintenance: 500, internet: 300, electricity: 450 },
      isActive: true,
    },
    {
      hostId: manasi._id,
      title: 'Spacious Room in 3BHK with Cat · Mayur Colony, Kothrud',
      city: 'Pune',
      locality: 'Kothrud',
      rent: 12800,
      deposit: 25000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Wi-Fi', 'Pet Friendly', 'Washing Machine', 'Balcony', 'RO Water'],
      flatmates: 1,
      preferredGender: 'any',
      isVerified: true,
      description:
        'Peaceful flat in Mayur Colony with a friendly indie cat. Private room with large window and bookshelf. 1.2 km from MIT-WPU campus. ',
      houseRules: ['Must be cat friendly', 'Keep balcony door secured'],
      bills: { rent: 12800, maintenance: 750, internet: 400, electricity: 600 },
      isActive: true,
    },
    {
      hostId: sanket._id,
      title: 'Shared 2BHK Room near BMCC & Ferguson College · Shivajinagar',
      city: 'Pune',
      locality: 'Shivajinagar',
      rent: 8500,
      deposit: 17000,
      type: 'shared_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'RO Water', 'Water Heater', 'Cook Facility', 'Bike Parking'],
      flatmates: 2,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Prime location in Shivajinagar close to FC Road, BMCC, and Modern College. One bed open in double room. Tiffin service readily available. ',
      houseRules: ['No smoking inside', 'Shared utility bills divided equally'],
      bills: { rent: 8500, maintenance: 500, internet: 250, electricity: 400 },
      isActive: true,
    },
    {
      hostId: tanmay._id,
      title: 'Private AC Room in 3BHK · Baner High Street (10 Min to Hinjewadi)',
      city: 'Pune',
      locality: 'Baner',
      rent: 16500,
      deposit: 33000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['High-speed Wi-Fi', 'AC', 'Power Backup', 'Gym', 'Washing Machine', 'Covered Parking'],
      flatmates: 2,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Spacious bedroom with dedicated work desk and high-speed Wi-Fi. 3BHK flat occupied by two software engineers. Quick bypass access to Hinjewadi Phase 1/2. ',
      houseRules: ['Keep kitchen clean', 'Quiet work environment during weekdays'],
      bills: { rent: 16500, maintenance: 1000, internet: 450, electricity: 800 },
      isActive: true,
    },
    {
      hostId: swati._id,
      title: 'Single Room for Student / Intern · Karvenagar Bus Stand Area',
      city: 'Pune',
      locality: 'Karvenagar',
      rent: 9200,
      deposit: 18400,
      type: 'private_room',
      furnishing: 'semi_furnished',
      availableFrom: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Wi-Fi', 'Geyser', 'RO Purifier', 'Wardrobe', 'Security'],
      flatmates: 1,
      preferredGender: 'female',
      isVerified: true,
      description:
        'Well-maintained flat close to Karvenagar bus terminus and Cummins College. One private room available with single bed and study table. ',
      houseRules: ['Female flatmates only', 'No night parties'],
      bills: { rent: 9200, maintenance: 450, internet: 300, electricity: 400 },
      isActive: true,
    },
    {
      hostId: rohit._id,
      title: 'Budget Shared Bed in 2BHK · Dahanukar Colony, Kothrud',
      city: 'Pune',
      locality: 'Kothrud',
      rent: 6500,
      deposit: 13000,
      type: 'shared_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'RO Water', 'Geyser', 'Study Desk', 'Washing Machine'],
      flatmates: 2,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Affordable shared accommodation for MIT-WPU students in Dahanukar Colony, Kothrud. 5 minutes by auto to college. All amenities included. ',
      houseRules: ['Keep personal and common areas tidy', 'No alcohol/smoking inside'],
      bills: { rent: 6500, maintenance: 400, internet: 200, electricity: 300 },
      isActive: true,
    },
    {
      hostId: ishaan._id,
      title: 'Private Bedroom in 2BHK · Ram Nagar, Bavdhan (Bypass Touch)',
      city: 'Pune',
      locality: 'Bavdhan',
      rent: 11000,
      deposit: 22000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['Wi-Fi', 'Geyser', 'Parking', 'Washing Machine', 'Balcony'],
      flatmates: 1,
      preferredGender: 'any',
      isVerified: true,
      description:
        'Quiet residential society in Bavdhan with excellent breeze and mountain view. Ideal for someone working in Hinjewadi or studying in Kothrud. ',
      houseRules: ['Respect noise limits after 11pm'],
      bills: { rent: 11000, maintenance: 600, internet: 350, electricity: 500 },
      isActive: true,
    },
    {
      hostId: viraj._id,
      title: 'Studio Apartment 1RK · Warje Malwadi near Mai Mangeshkar Hospital',
      city: 'Pune',
      locality: 'Warje',
      rent: 9500,
      deposit: 20000,
      type: 'studio',
      furnishing: 'semi_furnished',
      availableFrom: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Geyser', 'Water Tank Backup', 'Balcony', 'Bike Parking'],
      flatmates: 0,
      preferredGender: 'any',
      isVerified: true,
      description:
        'Cozy standalone 1RK studio apartment. 8 minutes drive to Kothrud over the Warje flyover. Peaceful lane, shops and tiffin nearby. ',
      houseRules: ['Families and working professionals/students welcome'],
      bills: { rent: 9500, maintenance: 400, internet: 300, electricity: 400 },
      isActive: true,
    },
    {
      hostId: chinmay._id,
      title: 'Single Occupancy Room with Attached Washroom · Ideal Colony, Kothrud',
      city: 'Pune',
      locality: 'Kothrud',
      rent: 13500,
      deposit: 27000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'Washing Machine', 'Geyser', 'Attached Bath', 'Balcony'],
      flatmates: 1,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Prime location in Ideal Colony near Joggers Park, Kothrud. Private washroom, spacious cupboard, study desk. 5 minutes from MIT-WPU. ',
      houseRules: ['Strictly no smoking', 'Quiet after 11pm'],
      bills: { rent: 13500, maintenance: 800, internet: 350, electricity: 600 },
      isActive: true,
    },
    {
      hostId: aditya._id,
      title: 'Shared 2BHK Room in Hinjewadi Phase 1 for IT Associates',
      city: 'Pune',
      locality: 'Hinjewadi',
      rent: 7500,
      deposit: 15000,
      type: 'shared_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['Wi-Fi', 'Bus Stop Access', 'Geyser', 'Washing Machine', 'Cook Facility'],
      flatmates: 2,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Walking distance to Wipro, Infosys, and Cognizant in Hinjewadi Phase 1. One bed in double room. Maid and cook shared. ',
      houseRules: ['Split household expenses on 1st of month'],
      bills: { rent: 7500, maintenance: 500, internet: 250, electricity: 400 },
      isActive: true,
    },
    {
      hostId: riya._id,
      title: 'Private AC Room for Female in Viman Nagar near Symbiosis',
      city: 'Pune',
      locality: 'Viman Nagar',
      rent: 16000,
      deposit: 32000,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Wi-Fi', 'AC', 'Washing Machine', 'Gated Security', 'Lift', 'Balcony'],
      flatmates: 1,
      preferredGender: 'female',
      isVerified: true,
      description:
        'Elegant flat in Viman Nagar with attached balcony. 5 min walk to Symbiosis Campus. Female student or corporate professional welcome. ',
      houseRules: ['Female only', 'Clean kitchen daily', 'No parties without prior notice'],
      bills: { rent: 16000, maintenance: 900, internet: 400, electricity: 750 },
      isActive: true,
    },
    {
      hostId: pranita._id,
      title: 'Shared 2BHK Room · Mayur Colony, Kothrud (Near City Pride)',
      city: 'Pune',
      locality: 'Kothrud',
      rent: 7800,
      deposit: 15600,
      type: 'shared_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      images: ['/af861e21-5414-4888-b572-8fd510f654e3.jpg'],
      amenities: ['Wi-Fi', 'Geyser', 'Washing Machine', 'RO Water', 'Study Tables'],
      flatmates: 2,
      preferredGender: 'female',
      isVerified: true,
      description:
        'Twin bed room in Mayur Colony. Very secure family society, close to Kothrud bus depot and City Pride. Easy commute to MIT-WPU and Cummins. ',
      houseRules: ['Respect flatmates study hours', 'Vegetarians preferred'],
      bills: { rent: 7800, maintenance: 500, internet: 250, electricity: 350 },
      isActive: true,
    },
    {
      hostId: siddharth._id,
      title: 'Furnished Studio 1RK · Model Colony, S.B. Road',
      city: 'Pune',
      locality: 'S.B. Road',
      rent: 15500,
      deposit: 31000,
      type: 'studio',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      images: ['/7b216db5-152f-47e1-b45b-3912748ad348.jpg'],
      amenities: ['Wi-Fi', 'Geyser', 'Pantry', 'Washing Machine', 'Dedicated Parking'],
      flatmates: 0,
      preferredGender: 'any',
      isVerified: true,
      description:
        'Peaceful 1RK in upscale Model Colony, Senapati Bapat Road. Complete privacy, safe lane, stone throw away from colleges and libraries. ',
      houseRules: ['No disturbance to neighbours', 'Single occupant only'],
      bills: { rent: 15500, maintenance: 700, internet: 350, electricity: 600 },
      isActive: true,
    },
    {
      hostId: chinmay._id,
      title: 'Private Room in 3BHK · Anand Nagar Metro / Paud Road',
      city: 'Pune',
      locality: 'Paud Road',
      rent: 11800,
      deposit: 23600,
      type: 'private_room',
      furnishing: 'furnished',
      availableFrom: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      images: ['/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg'],
      amenities: ['Wi-Fi', 'Geyser', 'Washing Machine', 'Water Purifier', 'Bike Parking'],
      flatmates: 2,
      preferredGender: 'male',
      isVerified: true,
      description:
        'Convenient flat located 2 minutes from Anand Nagar Metro on Paud Road. Quick 5-minute ride to MIT-WPU Kothrud. One room available immediately. ',
      houseRules: ['Quiet after 11:30pm', 'Weekly chores rotation'],
      bills: { rent: 11800, maintenance: 700, internet: 300, electricity: 550 },
      isActive: true,
    },
  ];

  const createdRooms = await Room.insertMany(rawRooms);
  console.log(`✅ Successfully seeded ${createdRooms.length} synthetic Pune room listings in MongoDB.`);

  // 4. Seed Real Match Requests between Users
  console.log('🤝 Seeding realistic match requests...');

  interface SeedMatchRequestData {
    requester: IUser;
    recipient: IUser;
    status: 'sent' | 'accepted' | 'declined';
    message: string;
  }

  const rawMatches: SeedMatchRequestData[] = [
    // Accepted pair 1: Aryan (MIT CSE) + Rohit (MIT MBA Host)
    {
      requester: aryan,
      recipient: rohit,
      status: 'accepted',
      message: 'Hey Rohit, saw your flat on Paud Road! Studying 3rd year CSE at MIT-WPU. Would love to coordinate a visit.',
    },
    // Accepted pair 2: Tanvi (MIT MCA) + Ananya (MIT Design)
    {
      requester: tanvi,
      recipient: ananya,
      status: 'accepted',
      message: 'Hi Ananya! I study MCA at MIT-WPU and keep a quiet vegetarian routine. Your room in Ideal Colony looks perfect!',
    },
    // Accepted pair 3: Pranav (COEP) + Ishaan (KPIT Dev)
    {
      requester: pranav,
      recipient: ishaan,
      status: 'accepted',
      message: 'Hey Ishaan, mechanical student at COEP. Bavdhan location works great for me since I cycle often.',
    },
    // Accepted pair 4: Varun (Cummins GET) + Aditya (Baner Dev)
    {
      requester: varun,
      recipient: aditya,
      status: 'accepted',
      message: 'Hi Aditya, GET at Cummins India. Commute to Baner/Warje is smooth. Clean habits and morning gym schedule.',
    },
    // Incoming pending requests for Aryan (so dashboard has real incoming requests!)
    {
      requester: chinmay,
      recipient: aryan,
      status: 'sent',
      message: 'Hey Aryan! I study IT at MIT-WPU too. We both sleep late and study with headphones. Want to check out flats together?',
    },
    {
      requester: viraj,
      recipient: aryan,
      status: 'sent',
      message: 'Hi Aryan, looking for a roommate in Ideal Colony for next semester. Let me know if you are interested!',
    },
    // Sent pending request by Aryan to Siddharth
    {
      requester: aryan,
      recipient: siddharth,
      status: 'sent',
      message: 'Hi Siddharth, looking at S.B. Road flats for easy library access. Would love to connect.',
    },
    // Other pending requests
    {
      requester: pooja,
      recipient: neha,
      status: 'sent',
      message: 'Hi Neha! Pharmacy student at MIT-WPU. Karvenagar twin sharing room looks very peaceful. Can we talk?',
    },
    {
      requester: dev,
      recipient: sanket,
      status: 'sent',
      message: 'Hey Sanket, law student at Deccan. Shivajinagar flat location is ideal for my court internship.',
    },
    // Declined request
    {
      requester: harsh,
      recipient: aryan,
      status: 'declined',
      message: 'Hey Aryan, looking to party often on weekends and host friends regularly.',
    },
  ];

  const createdMatchRequests = [];

  for (const m of rawMatches) {
    const aStr = m.requester._id.toString();
    const bStr = m.recipient._id.toString();
    const low = aStr < bStr ? m.requester._id : m.recipient._id;
    const high = aStr < bStr ? m.recipient._id : m.requester._id;

    // Run real compatibility algorithm
    const comp = calcCompatibility(m.requester, m.recipient);

    const doc = new MatchRequest({
      userLowId: low,
      userHighId: high,
      requesterId: m.requester._id,
      recipientId: m.recipient._id,
      status: m.status,
      score: comp.score,
      sharedInterests: comp.sharedInterests,
      factors: comp.factors,
      message: m.message,
      requestedAt: new Date(Date.now() - 36 * 3600 * 1000),
      respondedAt: m.status !== 'sent' ? new Date(Date.now() - 12 * 3600 * 1000) : null,
    });
    await doc.save();
    createdMatchRequests.push(doc);
  }

  console.log(`✅ Seeded ${createdMatchRequests.length} match requests with calculated compatibility.`);

  // 5. Seed Real ChatThreads & ChatMessages for Accepted Matches
  console.log('💬 Seeding real chat threads and conversational messages for accepted matches...');

  const acceptedPairs = [
    {
      userA: aryan,
      userB: rohit,
      context: 'MIT-WPU Paud Road flat visit',
      messages: [
        { sender: aryan, text: 'Hey Rohit, saw your flat listing on Paud Road! How far is it from the MIT-WPU mechanical building?' },
        { sender: rohit, text: 'Hey Aryan! It is about an 8-minute walk from the back gate. You can easily walk or take a cycle.' },
        { sender: aryan, text: 'Awesome. Is the Wi-Fi stable for video calls and coding sessions?' },
        { sender: rohit, text: 'Yes, we have 200 Mbps Airtel Xstream fiber with power backup. Are you free this Saturday around 4pm for a visit?' },
        { sender: aryan, text: 'Saturday 4pm works great for me. See you then!' },
      ],
    },
    {
      userA: tanvi,
      userB: ananya,
      context: 'Ideal Colony 2BHK room share',
      messages: [
        { sender: tanvi, text: 'Hi Ananya! I loved your Ideal Colony flat photos. The balcony looks so peaceful!' },
        { sender: ananya, text: 'Thank you Tanvi! Yes, it gets lovely morning sunlight. Do you cook at home?' },
        { sender: tanvi, text: 'Mostly vegetarian breakfasts and simple dinners. We can share cooking or keep separate shelves.' },
        { sender: ananya, text: 'That sounds very practical. Let me know when you would like to drop by to see the room!' },
      ],
    },
    {
      userA: pranav,
      userB: ishaan,
      context: 'Bavdhan 1RK sharing coordination',
      messages: [
        { sender: pranav, text: 'Hi Ishaan, how is the commute from Bavdhan to Shivajinagar during morning rush hour?' },
        { sender: ishaan, text: 'Takes about 15-20 mins on a two-wheeler via Paud Road flyover. Very straightforward.' },
        { sender: pranav, text: 'Sounds solid. Is bike parking covered in the building?' },
        { sender: ishaan, text: 'Yes, dedicated covered parking in the basement.' },
      ],
    },
    {
      userA: varun,
      userB: aditya,
      context: 'Baner flatmate coordination',
      messages: [
        { sender: varun, text: 'Hey Aditya, GET at Cummins India here. Do you guys split the cook expense?' },
        { sender: aditya, text: 'Hey Varun! Yes, cook comes twice a day and we split her monthly charge 3 ways. Works out to about ₹1800 each.' },
        { sender: varun, text: 'Perfect. Let us connect over a call tomorrow evening to finalize the deposit.' },
      ],
    },
  ];

  let totalMessagesCount = 0;

  for (const pair of acceptedPairs) {
    const aStr = pair.userA._id.toString();
    const bStr = pair.userB._id.toString();
    const low = aStr < bStr ? pair.userA._id : pair.userB._id;
    const high = aStr < bStr ? pair.userB._id : pair.userA._id;

    const lastMsg = pair.messages[pair.messages.length - 1];

    const thread = new ChatThread({
      participantLow: low,
      participantHigh: high,
      participants: [low, high],
      context: pair.context,
      lastMessage: lastMsg.text,
      lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000),
      lastSenderId: lastMsg.sender._id,
      unreadCounts: new Map([
        [pair.userA._id.toString(), 0],
        [pair.userB._id.toString(), 0],
      ]),
    });
    await thread.save();

    for (let i = 0; i < pair.messages.length; i++) {
      const msgItem = pair.messages[i];
      const msgDoc = new ChatMessage({
        threadId: thread._id,
        senderId: msgItem.sender._id,
        messageType: 'text',
        body: msgItem.text,
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(Date.now() - (pair.messages.length - i) * 600 * 1000),
      });
      await msgDoc.save();
      totalMessagesCount++;
    }
  }

  console.log(`✅ Seeded ${acceptedPairs.length} chat threads with ${totalMessagesCount} real messages.`);

  // 6. Seed Room Enquiries
  console.log('📬 Seeding realistic room enquiries...');

  const rawEnquiries = [
    {
      roomId: createdRooms[0]._id, // Rohit's Paud Road flat
      requesterId: aryan._id,
      hostId: rohit._id,
      message: 'Hi Rohit, is the deposit negotiable to 1.5 months rent if I commit to a 1-year agreement? Studying at MIT-WPU.',
      status: 'responded' as const,
      responseMessage: 'Hi Aryan! Yes, we can do 1.5 months deposit for an annual lease. Let us meet on Saturday.',
      respondedAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
    {
      roomId: createdRooms[1]._id, // Neha's Karvenagar flat
      requesterId: pooja._id,
      hostId: neha._id,
      message: 'Hello Neha, is there 24-hour water supply in the society? Also is there a geyser in the shared bathroom?',
      status: 'responded' as const,
      responseMessage: 'Hello Pooja, yes both solar and electric geyser are installed, and municipal water supply is 24x7.',
      respondedAt: new Date(Date.now() - 8 * 3600 * 1000),
    },
    {
      roomId: createdRooms[6]._id, // Chinmay's MIT back gate flat
      requesterId: tejas._id,
      hostId: chinmay._id,
      message: 'Hey Chinmay, can I visit tomorrow evening around 6pm after my civil engineering practicals?',
      status: 'pending' as const,
    },
    {
      roomId: createdRooms[4]._id, // Aditya's Baner High Street flat
      requesterId: ishaan._id,
      hostId: aditya._id,
      message: 'Hi Aditya, does the society have visitor parking for four-wheelers? Thanks!',
      status: 'pending' as const,
    },
    {
      roomId: createdRooms[2]._id, // Ananya's Ideal Colony flat
      requesterId: tanvi._id,
      hostId: ananya._id,
      message: 'Hi Ananya, is the society quiet during the day? I have online exams coming up in November.',
      status: 'responded' as const,
      responseMessage: 'Very quiet! All retired professors and families in this wing.',
      respondedAt: new Date(Date.now() - 10 * 3600 * 1000),
    },
  ];

  const createdEnquiries = await RoomEnquiry.insertMany(rawEnquiries);
  console.log(`✅ Seeded ${createdEnquiries.length} realistic room enquiries.`);

  // 7. Seed Real Verification Requests (Some approved, some pending in admin review queue)
  console.log('🛡️  Seeding real verification requests with encrypted student IDs...');

  const rawVerifications = [
    // Approved
    {
      user: aryan,
      institution: 'MIT World Peace University',
      idNumber: 'MIT-WPU-2023-BTECH-042',
      status: 'verified' as const,
      reviewedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    },
    {
      user: tanvi,
      institution: 'MIT World Peace University',
      idNumber: 'MIT-WPU-2024-MCA-018',
      status: 'verified' as const,
      reviewedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    },
    {
      user: rohit,
      institution: 'MIT-WPU School of Management',
      idNumber: 'MIT-WPU-2023-MBA-109',
      status: 'verified' as const,
      reviewedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
    },
    {
      user: neha,
      institution: 'MKSSS Cummins College of Engineering',
      idNumber: 'CCOEW-2022-IT-084',
      status: 'verified' as const,
      reviewedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000),
    },
    // Pending in Admin Queue (ready for approval/rejection test!)
    {
      user: pooja,
      institution: 'MIT-WPU School of Pharmacy',
      idNumber: 'MIT-WPU-2023-BPHARM-055',
      status: 'pending' as const,
      reviewedAt: null,
    },
    {
      user: dev,
      institution: 'Symbiosis Law School, Pune',
      idNumber: 'SLS-PUNE-2022-BALLB-133',
      status: 'pending' as const,
      reviewedAt: null,
    },
    {
      user: omkar,
      institution: 'MIT-WPU Faculty of Science',
      idNumber: 'MIT-WPU-2024-BCA-072',
      status: 'pending' as const,
      reviewedAt: null,
    },
    {
      user: tejaswini,
      institution: 'MIT-WPU Department of Computer Applications',
      idNumber: 'MIT-WPU-2024-MCA-061',
      status: 'pending' as const,
      reviewedAt: null,
    },
  ];

  for (const v of rawVerifications) {
    const encryptedId = encryptIdNumber(v.idNumber);
    const maskedId = maskIdNumber(v.idNumber);

    const doc = new VerificationRequest({
      userId: v.user._id,
      docType: 'College / University ID',
      institution: v.institution,
      idNumber: maskedId,
      encryptedId: encryptedId,
      documentUrl: `/documents/sample-college-id-${v.user._id}.pdf`,
      status: v.status,
      reviewedAt: v.reviewedAt,
      reviewedBy: v.status === 'verified' ? adminUser._id : null,
    });
    await doc.save();
  }

  console.log(`✅ Seeded ${rawVerifications.length} verification requests (4 approved, 4 pending in admin queue).`);

  // 8. Seed Real Event Notifications
  console.log('🔔 Seeding real event notifications...');

  const rawNotifications = [
    {
      userId: aryan._id,
      kind: 'match_accepted' as const,
      title: 'Match accepted!',
      body: `${rohit.name} accepted your roommate match request. You can now chat!`,
      link: '/app/chat',
      isRead: false,
    },
    {
      userId: aryan._id,
      kind: 'match_request' as const,
      title: 'New match request',
      body: `${chinmay.name} sent you a roommate match request.`,
      link: '/app/matches',
      isRead: false,
    },
    {
      userId: aryan._id,
      kind: 'match_request' as const,
      title: 'New match request',
      body: `${viraj.name} sent you a roommate match request.`,
      link: '/app/matches',
      isRead: false,
    },
    {
      userId: aryan._id,
      kind: 'verification' as const,
      title: 'Identity verified',
      body: 'Your MIT World Peace University student ID was verified. You have received the verified badge!',
      link: '/app/verification',
      isRead: true,
    },
    {
      userId: rohit._id,
      kind: 'room' as const,
      title: 'New room enquiry',
      body: `${aryan.name} enquired about your room on Paud Road.`,
      link: '/app/enquiries',
      isRead: true,
    },
    {
      userId: neha._id,
      kind: 'room' as const,
      title: 'New room enquiry',
      body: `${pooja.name} enquired about your Karvenagar room.`,
      link: '/app/enquiries',
      isRead: false,
    },
  ];

  await AppNotification.insertMany(rawNotifications);
  console.log(`✅ Seeded ${rawNotifications.length} real notifications.`);

  console.log('\n============================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
  console.log(`👤 Users:               ${createdUsers.length}`);
  console.log(`🏠 Rooms:               ${createdRooms.length}`);
  console.log(`🤝 Match Requests:      ${createdMatchRequests.length}`);
  console.log(`💬 Chat Threads:        ${acceptedPairs.length}`);
  console.log(`💬 Chat Messages:       ${totalMessagesCount}`);
  console.log(`📬 Room Enquiries:      ${createdEnquiries.length}`);
  console.log(`🛡️  Verification Queue:  ${rawVerifications.length}`);
  console.log(`🔔 Notifications:       ${rawNotifications.length}`);
  console.log('\n🔑 Test Accounts (passwords configured via SEED_*_PASSWORD env vars):');
  console.log('  Admin User:   admin@roomie2homie.com');
  console.log('  Demo Student: mit.student@roomie2homie.com (MIT-WPU B.Tech, Kothrud)');
  console.log('  Room Host:    rohit.patil@roomie2homie.seed (Paud Road 2BHK Host)');
  console.log('============================================================\n');

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
