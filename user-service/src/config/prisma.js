const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { config } = require("./");
const logger = require("./logger");

const connectionString = config.DATABASE_URL;

const globalForPrisma = globalThis;

let prisma = null;

if (!connectionString) {
  logger.warn("DATABASE_URL is not set. Prisma client is disabled.");
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString });

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ["error", "warn"],
    });
  }

  prisma = globalForPrisma.prisma;
}

module.exports = prisma;
