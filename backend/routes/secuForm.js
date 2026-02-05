/**
 * Secu form: submit (PDF generation + document row), secu-names, secu-add-name.
 * POST /api/forms/secu/submit and POST /api/secu-submit (same handler).
 * GET /api/secu-names, POST /api/secu-add-name for form compatibility.
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { getPool, getCurrentEvent } = require('../db');
const { generateSecuFormPDF } = require('../utils/secuFormPdf');

const router = express.Router();

function poolOr503(req, res, next) {
  if (!getPool()) return res.status(503).json({ error: 'Database not configured' });
  next();
}

router.use(poolOr503);

async function handleSecuSubmit(req, res) {
  let data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Ungültige JSON-Daten.' });
  }

  const vorfalle = typeof data.vorfalle === 'string' ? data.vorfalle.trim() : '';
  const getickert = data.getickert != null && data.getickert !== '' ? String(data.getickert).trim() : '';
  const einlassbereichAbgeraeumt = !!data.einlassbereichAbgeraeumt;
  const sachenZurueckgebracht = !!data.sachenZurueckgebracht;
  const arbeitsplatzHinterlassen = !!data.arbeitsplatzHinterlassen;
  let signatureBuffer = null;
  if (typeof data.signature === 'string' && data.signature.trim()) {
    try {
      signatureBuffer = Buffer.from(data.signature.trim(), 'base64');
      if (signatureBuffer.length === 0) signatureBuffer = null;
    } catch (_) {}
  }
  let people = Array.isArray(data.people) ? data.people : null;
  if (!people || people.length === 0) {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const startTime = typeof data.startTime === 'string' ? data.startTime.trim() : '';
    const endTime = typeof data.endTime === 'string' ? data.endTime.trim() : '';
    if (name || startTime || endTime) people = [{ name, startTime, endTime }];
  }

  if (!people || people.length === 0) {
    return res.status(400).json({ error: 'Mindestens eine Person mit Name, Start und Ende ist erforderlich.' });
  }
  for (const p of people) {
    const n = typeof p.name === 'string' ? p.name.trim() : '';
    const st = typeof p.startTime === 'string' ? p.startTime.trim() : '';
    const et = typeof p.endTime === 'string' ? p.endTime.trim() : '';
    if (!n || !st || !et) {
      return res.status(400).json({ error: 'Jede Person braucht Name, Start und Ende.' });
    }
  }

  const current = await getCurrentEvent();
  if (!current) {
    return res.status(400).json({ error: 'Keine aktive Schicht. Bitte in der App eine Schicht starten.' });
  }

  const storagePath = req.app.locals.storagePath;
  const eventId = current.id;
  const eventName = current.event_name || '';
  const eventDate = current.event_date != null ? current.event_date.toISOString().slice(0, 10) : '';
  const doorsTime = current.doors_time || '';

  try {
    const pdfBuffer = await generateSecuFormPDF({
      people,
      getickert,
      vorfalle,
      signature: signatureBuffer,
      einlassbereichAbgeraeumt,
      sachenZurueckgebracht,
      arbeitsplatzHinterlassen,
      eventName,
      date: eventDate,
      doorsTime,
    });

    const eventDir = path.join(storagePath, 'events', eventId);
    await fs.mkdir(eventDir, { recursive: true });
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Secuzettel-${timestamp}.pdf`;
    const filePath = path.join(eventDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    const relativePath = path.relative(storagePath, filePath);
    await getPool().query(
      `INSERT INTO documents (event_id, type, section_or_name, file_path, content_type, metadata)
       VALUES ($1, 'section', 'secu', $2, 'application/pdf', '{}'::jsonb)`,
      [eventId, relativePath]
    );

    // Add submitted names to person_names (type secu) if not present
    for (const p of people) {
      const name = (typeof p.name === 'string' ? p.name : '').trim();
      if (!name) continue;
      const existing = await getPool().query(
        'SELECT id FROM person_names WHERE type = $1 AND LOWER(TRIM(name)) = LOWER($2)',
        ['secu', name]
      );
      if (existing.rows.length === 0) {
        await getPool().query('INSERT INTO person_names (type, name) VALUES ($1, $2)', ['secu', name]);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Secu form submit error:', err);
    res.status(500).json({ error: 'PDF konnte nicht gespeichert werden.' });
  }
}

// GET /api/secu-names – list person names (type secu) for form autocomplete
router.get('/secu-names', async (req, res) => {
  try {
    const r = await getPool().query('SELECT id, name FROM person_names WHERE type = $1 ORDER BY name', ['secu']);
    res.json(r.rows.map((row) => ({ id: row.id, name: row.name })));
  } catch (err) {
    console.error('GET /api/secu-names:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/secu-add-name – add name to secu catalog
router.post('/secu-add-name', express.json(), async (req, res) => {
  const name = (req.body && req.body.name != null ? String(req.body.name) : '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Name erforderlich.' });
  }
  try {
    const existing = await getPool().query(
      'SELECT id FROM person_names WHERE type = $1 AND LOWER(TRIM(name)) = LOWER($2)',
      ['secu', name]
    );
    if (existing.rows.length > 0) {
      return res.json({ ok: true });
    }
    await getPool().query('INSERT INTO person_names (type, name) VALUES ($1, $2)', ['secu', name]);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/secu-add-name:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/secu-submit – form compatibility (same as POST /api/forms/secu/submit)
router.post('/secu-submit', express.json(), handleSecuSubmit);

module.exports = { router, handleSecuSubmit };
