/**
 * Postgres pool and helpers. Pool is created only when DATABASE_URL is set.
 */

const { Pool } = require('pg');

let _pool = null;

function getPool() {
  if (process.env.DATABASE_URL && !_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

/**
 * Get current event (latest open: status = 'open').
 * Returns { id, event_name, event_date, doors_time } or null.
 */
async function getCurrentEvent() {
  const p = getPool();
  if (!p) return null;
  const result = await p.query(
    `SELECT id, event_name, event_date, doors_time
     FROM events
     WHERE status = 'open'
     ORDER BY updated_at DESC
     LIMIT 1`
  );
  const row = result.rows[0];
  return row
    ? {
        id: row.id,
        event_name: row.event_name,
        event_date: row.event_date,
        doors_time: row.doors_time
      }
    : null;
}

/**
 * Simple health check: run SELECT 1. Returns true if DB is reachable.
 */
async function checkDb() {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = { getPool, getCurrentEvent, checkDb };
