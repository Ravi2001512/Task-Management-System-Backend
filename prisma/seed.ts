import 'dotenv/config';
import bcryptjs from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcryptjs.hash('123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@test.com',
      password: passwordHash,
    },
  });

  console.log(`✅ Admin user ready: ${adminUser.email} (id: ${adminUser.id})`);


  const orphaned = await prisma.task.updateMany({
    where: { userId: '' },
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
