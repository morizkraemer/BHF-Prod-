/**
 * Run Postgres migrations from backend/migrations/*.sql in order.
 * Tracks applied migrations in schema_migrations table.
 * Usage: DATABASE_URL=postgres://... node migrate.js  (or npm run migrate with .env)
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Set it in .env or the environment.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found in', migrationsDir);
      return;
    }

    const applied = await client.query(
      'SELECT filename FROM schema_migrations'
    );
    const appliedSet = new Set(applied.rows.map((r) => r.filename));

    for (const filename of files) {
      if (appliedSet.has(filename)) {
        console.log('Skip (already applied):', filename);
        continue;
      }

      const filepath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filepath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename]
        );
        await client.query('COMMIT');
        console.log('Applied:', filename);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', filename, err.message);
        throw err;
      }
    }

    console.log('Migrations complete.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
