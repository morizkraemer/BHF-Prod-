/**
 * API routes for zeiterfassung (time entries). Read-only.
 * GET /api/zeiterfassung – list with optional eventId, from, to, role.
 */

const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

const ROLES = ['secu', 'ton_licht', 'andere'];

function poolOr503(req, res, next) {
  if (!getPool()) return res.status(503).json({ error: 'Database not configured' });
  next();
}

function toEntry(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    role: row.role,
    eventName: row.event_name ?? null,
    entryDate: row.entry_date != null ? row.entry_date.toISOString().slice(0, 10) : null,
    personName: row.person_name,
    wage: Number(row.wage),
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    hours: Number(row.hours),
    amount: Number(row.amount),
    category: row.category ?? null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at
  };
}

router.use(poolOr503);

// GET /api/zeiterfassung – list entries with optional filters
router.get('/', async (req, res) => {
  const { eventId, from, to, role } = req.query;
  try {
    const conditions = [];
    const values = [];
    let n = 1;

    if (eventId && typeof eventId === 'string' && eventId.trim()) {
      conditions.push(`event_id = $${n++}`);
      values.push(eventId.trim());
    }
    if (from && typeof from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(from.trim())) {
      conditions.push(`entry_date >= $${n++}`);
      values.push(from.trim());
    }
    if (to && typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to.trim())) {
      conditions.push(`entry_date <= $${n++}`);
      values.push(to.trim());
    }
    if (role && typeof role === 'string' && ROLES.includes(role.trim())) {
      conditions.push(`role = $${n++}`);
      values.push(role.trim());
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const q = `SELECT id, event_id, role, event_name, entry_date, person_name, wage, start_time, end_time, hours, amount, category, created_at
      FROM zeiterfassung_entries
      ${where}
      ORDER BY entry_date DESC, created_at DESC`;
    const r = await getPool().query(q, values);
    res.json(r.rows.map(toEntry));
  } catch (err) {
    console.error('GET /api/zeiterfassung:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
module.exports.toEntry = toEntry;
