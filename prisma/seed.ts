/**
 * prisma/seed.ts
 *
 * Seeds the database with:
 *  1. An admin user (admin@test.com / 123456) via upsert (idempotent)
 *  2. Back-fills any existing Task rows that have no userId to the admin user
 */

import 'dotenv/config';
import bcryptjs from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Upsert the admin user
  const passwordHash = await bcryptjs.hash('123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},                   // Don't overwrite existing data on re-runs
    create: {
      name: 'Admin',
      email: 'admin@test.com',
      password: passwordHash,
    },
  });

  console.log(`✅ Admin user ready: ${adminUser.email} (id: ${adminUser.id})`);

  // 2. Back-fill orphaned tasks (tasks without a valid userId)
  //    This handles any tasks created before the User table existed.
  const orphaned = await prisma.task.updateMany({
    where: { userId: '' },   // Prisma sets empty string for null on non-nullable fields during migration
    data: { userId: adminUser.id },
  });

  if (orphaned.count > 0) {
    console.log(`✅ Back-filled ${orphaned.count} orphaned task(s) → admin user`);
  } else {
    console.log('ℹ️  No orphaned tasks to back-fill.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
