import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Kita menggunakan adapter PG karena konfigurasi Prisma Early Access
// membutuhkan eksplisit adapter ketika engineType="client" digunakan.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pastikan poolnya menggunakan URL yang benar
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
