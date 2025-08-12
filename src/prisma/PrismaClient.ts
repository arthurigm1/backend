import { PrismaClient } from "../generated/prisma";

const prismaClient = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prismaClient;
