import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.user.create({ data: {} as any }).then(user => console.log(user.lastLoginAt));
