import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// Setup connection pool for PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Setup the driver adapter
const adapter = new PrismaPg(pool);

// Instantiate the Prisma Client with the driver adapter
export const prisma = new PrismaClient({ adapter });


