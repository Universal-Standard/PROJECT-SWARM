#!/usr/bin/env tsx
/**
 * Verify Database Indexes
 *
 * This script verifies that all performance indexes have been created
 *
 * Usage:
 *   tsx scripts/verify-indexes.ts
 *
 * Or with npm:
 *   npm run db:verify-indexes
 */

import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;

// Expected indexes from the migration file
const EXPECTED_INDEXES = [
  // Workflows
  "idx_workflows_user_id",
  "idx_workflows_created_at",
  "idx_workflows_updated_at",
  // Executions
  "idx_executions_workflow_id",
  "idx_executions_user_id",
  "idx_executions_status",
  "idx_executions_started_at",
  "idx_executions_completed_at",
  "idx_executions_workflow_status",
  "idx_executions_user_status",
  // Agent messages
  "idx_agent_messages_execution_id",
  "idx_agent_messages_agent_id",
  "idx_agent_messages_timestamp",
  // Execution logs
  "idx_execution_logs_execution_id",
  "idx_execution_logs_level",
  "idx_execution_logs_timestamp",
  // Workflow schedules
  "idx_workflow_schedules_workflow_id",
  "idx_workflow_schedules_enabled",
  "idx_workflow_schedules_next_run",
  "idx_workflow_schedules_active_next",
  // Workflow versions
  "idx_workflow_versions_workflow_id",
  "idx_workflow_versions_created_at",
  "idx_workflow_versions_tag",
  // Workflow webhooks
  "idx_workflow_webhooks_workflow_id",
  "idx_workflow_webhooks_enabled",
  // Webhook logs
  "idx_webhook_logs_webhook_id",
  "idx_webhook_logs_timestamp",
  "idx_webhook_logs_status",
  // Execution costs
  "idx_execution_costs_execution_id",
  "idx_execution_costs_agent_id",
  "idx_execution_costs_provider",
  "idx_execution_costs_timestamp",
  "idx_execution_costs_timestamp_provider",
  // Provider pricing
  "idx_provider_pricing_provider_model",
  "idx_provider_pricing_effective_date",
  // Templates
  "idx_templates_category",
  "idx_templates_featured",
  "idx_templates_usage_count",
  "idx_templates_created_at",
  "idx_templates_featured_usage",
  // Knowledge entries
  "idx_knowledge_entries_user_id",
  "idx_knowledge_entries_source_execution_id",
  "idx_knowledge_entries_source_agent_id",
  "idx_knowledge_entries_agent_type",
  "idx_knowledge_entries_category",
  "idx_knowledge_entries_created_at",
  "idx_knowledge_entries_user_agent_category",
  // Tags
  "idx_tags_name",
  "idx_workflow_tags_workflow_id",
  "idx_workflow_tags_tag_id",
  // Users
  "idx_users_email",
  "idx_users_replit_id",
  // Agents
  "idx_agents_workflow_id",
  // Assistant chats
  "idx_assistant_chats_user_id",
  "idx_assistant_chats_created_at",
  "idx_assistant_chats_updated_at",
  // Workflow schemas
  "idx_workflow_schemas_workflow_id",
];

async function verifyIndexes() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("📊 Connecting to database...");
    const client = await pool.connect();

    console.log("🔍 Checking indexes...\n");

    // Query to get all indexes from public schema
    const result = await client.query(`
      SELECT
        indexname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    const existingIndexes = new Set(result.rows.map((row: any) => row.indexname));

    // Check which expected indexes exist
    const missing: string[] = [];
    const present: string[] = [];

    for (const indexName of EXPECTED_INDEXES) {
      if (existingIndexes.has(indexName)) {
        present.push(indexName);
      } else {
        missing.push(indexName);
      }
    }

    // Display results
    console.log("✅ PRESENT INDEXES:");
    console.log(`   Found ${present.length} of ${EXPECTED_INDEXES.length} expected indexes\n`);

    if (missing.length > 0) {
      console.log("❌ MISSING INDEXES:");
      missing.forEach((idx) => console.log(`   - ${idx}`));
      console.log("");
      console.log("💡 Run the following command to create missing indexes:");
      console.log("   npm run db:indexes\n");
    } else {
      console.log("🎉 All performance indexes are present!\n");
    }

    // Show index statistics
    console.log("📊 DATABASE INDEX STATISTICS:");
    console.log(`   Total indexes in database: ${existingIndexes.size}`);
    console.log(`   Expected performance indexes: ${EXPECTED_INDEXES.length}`);
    console.log(`   Present: ${present.length}`);
    console.log(`   Missing: ${missing.length}\n`);

    // Show table sizes for context
    const tableSizes = await client.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
      LIMIT 10;
    `);

    console.log("📦 TOP 10 LARGEST TABLES:");
    tableSizes.rows.forEach((row: any) => {
      console.log(`   ${row.tablename.padEnd(30)} ${row.size}`);
    });

    client.release();

    // Exit with error code if indexes are missing
    if (missing.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyIndexes();
