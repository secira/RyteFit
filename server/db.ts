import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required but was not provided."
  );
}

// Disable prefetch as it is not supported for "Transaction" pool mode.
// ssl: rejectUnauthorized false allows Neon's self-signed certificate chain
// to be accepted in environments like EC2 where the cert chain isn't trusted by default.
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(client, { schema });
