#!/usr/bin/env tsx
/**
 * Initialize the PROJECT-SWARM SQLite database.
 * Usage: npx tsx scripts/init-db.ts [--reset]
 *
 * --reset  Drop swarm.db and recreate from schema.sql
 */

import Database from "better-sqlite3";
import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";

const DB_PATH = join(process.cwd(), "swarm.db");
const SCHEMA_PATH = join(process.cwd(), "schema.sql");

const reset = process.argv.includes("--reset");

if (reset && existsSync(DB_PATH)) {
  rmSync(DB_PATH);
  // Remove WAL side-car files if present
  for (const ext of ["-wal", "-shm"]) {
    const p = DB_PATH + ext;
    if (existsSync(p)) rmSync(p);
  }
  console.log("🗑️  Removed existing database");
}

console.log("🗄️  Initializing SQLite database…");
console.log(`   Path:   ${DB_PATH}`);
console.log(`   Schema: ${SCHEMA_PATH}`);

const schema = readFileSync(SCHEMA_PATH, "utf-8");
const db = new Database(DB_PATH);

// WAL mode → better concurrent read/write
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Strip comment-only lines, then execute the whole schema at once
const cleaned = schema
  .split("\n")
  .filter((l) => {
    const t = l.trim();
    return t.length > 0 && !t.startsWith("--");
  })
  .join("\n");

db.exec(cleaned);

// Report
const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  )
  .all() as { name: string }[];

console.log(`\n✅ Created ${tables.length} tables:`);
for (const { name } of tables) {
  const { count } = db
    .prepare(`SELECT COUNT(*) AS count FROM "${name}"`)
    .get() as { count: number };
  console.log(`   ${name.padEnd(24)} ${count} rows`);
}

const { size } = db
  .prepare(
    "SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size()"
  )
  .get() as { size: number };

console.log(`\n💾 Size: ${(size / 1024).toFixed(1)} KB`);
db.close();
console.log("🎉 Done.\n");
