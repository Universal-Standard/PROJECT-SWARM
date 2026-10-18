import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const configuredPoolSize = Number.parseInt(process.env.DB_POOL_MAX ?? "10", 10);
const poolSize =
  Number.isInteger(configuredPoolSize) && configuredPoolSize > 0 ? configuredPoolSize : 10;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolSize,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
});
export const db = drizzle({ client: pool, schema });
