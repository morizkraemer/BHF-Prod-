/**
 * API routes for events/shifts. Mirror store shape (camelCase, formData, phase).
 * GET /api/events, GET /api/events/current, POST /api/events, GET /api/events/:id, PATCH /api/events/:id.
 * POST /api/events/:id/close for close-shift.
 * GET/POST /api/events/:eventId/documents for list and upload.
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { randomUUID } = require('crypto');
const multer = require('multer');
const { getPool } = require('../db');
const { runCloseShift } = require('../services/closeShift');
const { toEntry: toZeiterfassungEntry } = require('./zeiterfassung');

const router = express.Router();

const DOCUMENT_TYPES = ['scan', 'report', 'section', 'einkaufsbeleg', 'zeiterfassung'];

function toDocument(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    type: row.type,
    sectionOrName: row.section_or_name ?? null,
    filePath: row.file_path,
    contentType: row.content_type ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at?.toISOString?.() ?? row.created_at
  };
}

function createUploadMiddleware() {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const storagePath = req.app.locals.storagePath;
        const eventId = req.params.eventId;
        const dir = path.join(storagePath, 'events', eventId);
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.pdf';
      cb(null, `${randomUUID()}${ext}`);
    }
  });
  return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).single('file');
}

function poolOr503(req, res, next) {
  if (!getPool()) return res.status(503).json({ error: 'Database not configured' });
  next();
}

router.use(poolOr503);

function toEvent(row) {
  return {
    id: row.id,
    eventName: row.event_name,
    eventDate: row.event_date != null ? row.event_date.toISOString().slice(0, 10) : null,
    doorsTime: row.doors_time ?? null,
    phase: row.phase ?? 'VVA',
    abgeschlossen: row.abgeschlossen ?? false,
    formData: row.form_data ?? {},
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at
  };
}

// GET /api/events – list events (newest first)
router.get('/', async (req, res) => {
  try {
    const r = await getPool().query(
      'SELECT id, event_name, event_date, doors_time, phase, abgeschlossen, form_data, created_at, updated_at FROM events ORDER BY updated_at DESC'
    );
    res.json(r.rows.map(toEvent));
  } catch (err) {
    console.error('GET /api/events:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/events/current – full current open event (for Electron load-data)
router.get('/current', async (req, res) => {
  try {
    const r = await getPool().query(
      `SELECT id, event_name, event_date, doors_time, phase, abgeschlossen, form_data, created_at, updated_at
       FROM events WHERE phase != 'closed' ORDER BY updated_at DESC LIMIT 1`
    );
    const row = r.rows[0];
    if (!row) return res.status(200).json({ currentEvent: null });
    res.json({ currentEvent: toEvent(row) });
  } catch (err) {
    console.error('GET /api/events/current:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/events – create event
router.post('/', async (req, res) => {
  const body = req.body || {};
  const eventName = body.eventName ?? body.event_name ?? null;
  const eventDate = body.eventDate ?? body.event_date ?? null;
  const doorsTime = body.doorsTime ?? body.doors_time ?? null;
  const phase = body.phase ?? 'VVA';
  const formData = body.formData ?? body.form_data ?? {};
  try {
    const r = await getPool().query(
      `INSERT INTO events (event_name, event_date, doors_time, phase, form_data)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, event_name, event_date, doors_time, phase, form_data, created_at, updated_at`,
      [eventName, eventDate, doorsTime, phase, JSON.stringify(formData)]
    );
    res.status(201).json(toEvent(r.rows[0]));
  } catch (err) {
    console.error('POST /api/events:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/events/:eventId/zeiterfassung – zeiterfassung entries for one event
router.get('/:eventId/zeiterfassung', async (req, res) => {
  const { eventId } = req.params;
  try {
    const eventCheck = await getPool().query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    const r = await getPool().query(
      `SELECT id, event_id, role, event_name, entry_date, person_name, wage, start_time, end_time, hours, amount, category, created_at
       FROM zeiterfassung_entries WHERE event_id = $1 ORDER BY entry_date DESC, created_at DESC`,
      [eventId]
    );
    res.json(r.rows.map(toZeiterfassungEntry));
  } catch (err) {
    console.error('GET /api/events/:eventId/zeiterfassung:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/events/:id – get one event (/current is matched first above)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await getPool().query(
      'SELECT id, event_name, event_date, doors_time, phase, abgeschlossen, form_data, created_at, updated_at FROM events WHERE id = $1',
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(toEvent(r.rows[0]));
  } catch (err) {
    console.error('GET /api/events/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/events/:id – update formData and/or phase; optionally sync core columns from form_data.uebersicht
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const formData = body.formData ?? body.form_data;
  const phase = body.currentPhase ?? body.phase;
  const abgeschlossen = body.abgeschlossen;
  try {
    const updates = [];
    const values = [id];
    let n = 2;
    if (formData !== undefined) {
      updates.push(`form_data = $${n++}::jsonb`);
      values.push(JSON.stringify(formData));
    }
    if (phase !== undefined) {
      updates.push(`phase = $${n++}`);
      values.push(phase);
    }
    if (abgeschlossen !== undefined) {
      updates.push(`abgeschlossen = $${n++}`);
      values.push(!!abgeschlossen);
    }
    if (formData !== undefined && formData?.uebersicht) {
      const u = formData.uebersicht;
      if (u.eventName !== undefined) { updates.push(`event_name = $${n++}`); values.push(u.eventName); }
      if (u.date !== undefined) { updates.push(`event_date = $${n++}::date`); values.push(u.date); }
      if (u.doorsTime !== undefined) { updates.push(`doors_time = $${n++}`); values.push(u.doorsTime); }
    }
    updates.push('updated_at = now()');
    if (values.length === 1) {
      const r = await getPool().query(
        'SELECT id, event_name, event_date, doors_time, phase, abgeschlossen, form_data, created_at, updated_at FROM events WHERE id = $1',
        [id]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(toEvent(r.rows[0]));
    }
    const r = await getPool().query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $1 RETURNING id, event_name, event_date, doors_time, phase, abgeschlossen, form_data, created_at, updated_at`,
      values
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(toEvent(r.rows[0]));
  } catch (err) {
    console.error('PATCH /api/events/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/events/:id/close – close shift: section PDFs, Zeiterfassung entries (DB), set phase closed
router.post('/:id/close', async (req, res) => {
  const { id } = req.params;
  const formData = req.body?.formData ?? req.body?.form_data ?? req.body;
  const storagePath = req.app.locals.storagePath;
  try {
    const result = await runCloseShift({
      eventId: id,
      formData,
      storagePath,
      pool: getPool()
    });
    if (!result.success) {
      const status = result.error === 'Event not found' ? 404 : result.error === 'Event already closed' ? 409 : 400;
      return res.status(status).json({ error: result.error });
    }
    res.json({ success: true, eventFolder: result.eventFolder });
  } catch (err) {
    console.error('POST /api/events/:id/close:', err);
    res.status(500).json({ error: 'Fehler beim Schließen des Shifts.' });
  }
});

// GET /api/events/:eventId/documents – list documents for event
router.get('/:eventId/documents', async (req, res) => {
  const { eventId } = req.params;
  try {
    const eventCheck = await getPool().query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    const r = await getPool().query(
      'SELECT id, event_id, type, section_or_name, file_path, content_type, metadata, created_at FROM documents WHERE event_id = $1 ORDER BY created_at',
      [eventId]
    );
    res.json(r.rows.map(toDocument));
  } catch (err) {
    console.error('GET /api/events/:eventId/documents:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/events/:eventId/documents – upload document (multipart, field: file)
router.post('/:eventId/documents', createUploadMiddleware(), async (req, res) => {
  const { eventId } = req.params;
  const storagePath = req.app.locals.storagePath;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const eventCheck = await getPool().query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: 'Event not found' });
    }
    const type = (req.body.type && DOCUMENT_TYPES.includes(req.body.type)) ? req.body.type : 'scan';
    const sectionOrName = req.body.sectionOrName || req.body.section_or_name || null;
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata;
      } catch (_) {}
    }
    const relativePath = path.relative(storagePath, req.file.path);
    const contentType = req.file.mimetype || null;
    const r = await getPool().query(
      `INSERT INTO documents (event_id, type, section_or_name, file_path, content_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id, event_id, type, section_or_name, file_path, content_type, metadata, created_at`,
      [eventId, type, sectionOrName, relativePath, contentType, JSON.stringify(metadata)]
    );
    res.status(201).json(toDocument(r.rows[0]));
  } catch (err) {
    console.error('POST /api/events/:eventId/documents:', err);
    await fs.unlink(req.file.path).catch(() => {});
    if (!res.headersSent) res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
