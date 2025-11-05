import { PrismaClient } from '@prisma/client';

// Vercel ve serverless ortamlar için Prisma Client singleton pattern
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Production ve development'ta da global'e atanmalı (Vercel için önemli)
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Her ortamda global'e atanmalı (Vercel serverless için kritik)
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
} else {
  // Production'da da global'e atanmalı (Vercel edge runtime için)
  global.__prisma = prisma;
}

// Prisma client'ın doğru yüklendiğini kontrol et
if (!prisma) {
  throw new Error('Prisma Client başlatılamadı');
}

