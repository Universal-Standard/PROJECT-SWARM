#!/usr/bin/env tsx
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;

async function migrateGitHubAuth(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_refresh_token text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token_expiry timestamp;
      `);

      const result = await client.query(`
        UPDATE users
        SET github_access_token = NULL,
            github_refresh_token = NULL,
            github_token_expiry = NULL
        WHERE github_access_token IS NOT NULL
           OR github_refresh_token IS NOT NULL
           OR github_token_expiry IS NOT NULL
        RETURNING id;
      `);

      await client.query("COMMIT");

      console.log("✅ GitHub auth migration complete");
      console.log(`🔐 Cleared legacy GitHub credentials for ${result.rowCount || 0} users`);
      console.log("ℹ️  Users must reconnect GitHub to establish per-user OAuth credentials.");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ GitHub auth migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void migrateGitHubAuth();
