import { CustomPrismaClient } from '@/types/prisma';
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = (globalForPrisma.prisma ?? prismaClientSingleton()) as CustomPrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
