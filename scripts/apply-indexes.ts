#!/usr/bin/env tsx
/**
 * Apply Performance Indexes Migration
 *
 * This script applies the performance indexes defined in migrations/add-performance-indexes.sql
 *
 * Usage:
 *   tsx scripts/apply-indexes.ts
 *
 * Or with npm:
 *   npm run db:indexes
 */

import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

async function applyIndexes() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("🔍 Reading migration file...");
    const migrationPath = join(process.cwd(), "migrations", "add-performance-indexes.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("📊 Connecting to database...");
    const client = await pool.connect();

    console.log("🚀 Applying performance indexes...");
    console.log("   This may take a few minutes depending on table sizes.");

    const startTime = Date.now();

    // Execute the migration
    const result = await client.query(sql);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("✅ Migration completed successfully!");
    console.log(`⏱️  Duration: ${duration}s`);

    // Display the result from the migration's SELECT query
    if (result.rows && result.rows.length > 0) {
      const { status, total_indexes } = result.rows[0];
      console.log(`📈 ${status}`);
      console.log(`📊 Total indexes in database: ${total_indexes}`);
    }

    client.release();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyIndexes();
