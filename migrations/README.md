# Database Migrations

This directory contains database migration files for the PROJECT-SWARM application.

## Migration System

This project uses a hybrid migration approach:

- **Drizzle Kit** for schema changes (tables, columns, constraints)
- **SQL migrations** for performance optimizations (indexes, custom queries)

## Available Commands

### Schema Migrations (Drizzle)

```bash
# Push schema changes to database (development)
npm run db:push

# Generate migration files from schema changes
npx drizzle-kit generate

# Apply generated migrations (if using drizzle migrations)
npx drizzle-kit migrate
```

### Performance Index Migrations

```bash
# Apply performance indexes
npm run db:indexes

# Verify that all indexes are present
npm run db:verify-indexes
```

## Migration Files

### add-performance-indexes.sql

This migration file adds 57 performance indexes to optimize query performance across all tables.

**Key optimizations:**

- Single-column indexes for foreign keys and commonly filtered fields
- Composite indexes for complex query patterns (e.g., workflow_id + status)
- DESC indexes for timestamp columns used in ORDER BY clauses
- Partial indexes with WHERE clauses for sparse columns
- Specialized indexes for cost analytics and scheduling queries

**How to apply:**

```bash
# Apply the indexes
npm run db:indexes
```

The migration uses `CREATE INDEX IF NOT EXISTS`, so it's safe to run multiple times.

**How to verify:**

```bash
# Check that all indexes are present
npm run db:verify-indexes
```

This will show:

- Which indexes are present vs missing
- Total index count in the database
- Table sizes (to understand index impact)

**Expected results:**

- 57 performance indexes will be created
- Most queries will see 10-100x speedup on large datasets
- Index creation takes 1-5 minutes depending on data volume

**Performance impact:**

- Queries: ✅ Much faster (10-100x speedup)
- Writes: ⚠️ Slightly slower (5-10% overhead)
- Storage: ⚠️ Increased by ~10-20%

## Migration Best Practices

1. **Always backup your database before running migrations**
2. **Test migrations on a staging environment first**
3. **Run migrations during low-traffic periods**
4. **Monitor query performance before and after**
5. **Use `npm run db:verify-indexes` to ensure indexes are present**

## Troubleshooting

### Index creation is slow

- This is normal for large tables (>100k rows)
- Indexes are created CONCURRENTLY by default (doesn't block reads/writes)
- Let it run to completion

### Index already exists error

- The migration uses `IF NOT EXISTS` to prevent this
- If you see this error, the index was created successfully before

### Query still slow after indexes

- Run `ANALYZE;` to update query planner statistics
- Check query EXPLAIN plan to ensure indexes are being used
- Some queries may need additional composite indexes
