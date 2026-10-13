/**
 * backend/scripts/make-admin.ts
 *
 * Promotes an existing registered user to 'admin' role.
 *
 * Usage:
 *   ADMIN_EMAIL=user@example.com npx tsx scripts/make-admin.ts
 *   or:
 *   npx tsx scripts/make-admin.ts user@example.com
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { sanitizeMongoError } from '../src/config/database';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongodbUri = (process.env.MONGODB_URI || '').trim();
if (!mongodbUri) {
  console.error('❌ MONGODB_URI is not configured. Aborting.');
  process.exit(1);
}

const adminEmail = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!adminEmail) {
  console.error(
    '❌ ADMIN_EMAIL is not specified.\n' +
    '   Usage: ADMIN_EMAIL=user@example.com npx tsx scripts/make-admin.ts\n' +
    '   or:    npx tsx scripts/make-admin.ts user@example.com'
  );
  process.exit(1);
}

async function run(): Promise<void> {
  try {
    await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to database.');

    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.error(`❌ User with email "${adminEmail}" was not found. Please register first.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`ℹ️ User "${user.name}" (${user.email}) is already an admin.`);
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`🎉 Successfully promoted "${user.name}" (${user.email}) to role: admin!`);
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Failed to update user role:', sanitizeMongoError(msg));
    process.exit(1);
  }
}

run();
