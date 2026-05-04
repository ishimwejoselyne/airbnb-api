import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export async function connectDB() {
  await prisma.$connect();
  console.log("Connected to PostgreSQL via Prisma");
}

export default prisma;

