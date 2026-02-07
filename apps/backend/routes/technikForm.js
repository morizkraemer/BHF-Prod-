/**
 * Technik form: submit (PDF generation + document row), tech-names, tech-add-name.
 * POST /api/forms/technik/submit and POST /api/technik-submit (same handler).
 * GET /api/tech-names, POST /api/tech-add-name for form autocomplete.
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { getPool, getCurrentEvent } = require('../db');
const { generateTechnikFormPDF } = require('../utils/technikFormPdf');

const router = express.Router();

function poolOr503(req, res, next) {
  if (!getPool()) return res.status(503).json({ error: 'Database not configured' });
  next();
}

router.use(poolOr503);

async function handleTechnikSubmit(req, res) {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Ungültige JSON-Daten.' });
  }

  let signatureBuffer = null;
  if (typeof data.signature === 'string' && data.signature.trim()) {
    try {
      signatureBuffer = Buffer.from(data.signature.trim(), 'base64');
      if (signatureBuffer.length === 0) signatureBuffer = null;
    } catch (_) {}
  }
  if (!signatureBuffer || signatureBuffer.length === 0) {
    return res.status(400).json({ error: 'Unterschrift ist erforderlich.' });
  }

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const getInTechniker = typeof data.getInTechniker === 'string' ? data.getInTechniker.trim() : '';
  const technikEndeAbbauBis = typeof data.technikEndeAbbauBis === 'string' ? data.technikEndeAbbauBis.trim() : '';
  const soundcheck = typeof data.soundcheck === 'string' ? data.soundcheck.trim() : '';
  const doorsForm = typeof data.doors === 'string' ? data.doors.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'Name ist erforderlich.' });
  }
  if (!getInTechniker) {
    return res.status(400).json({ error: 'Get In ist erforderlich.' });
  }
  if (!technikEndeAbbauBis) {
    return res.status(400).json({ error: 'Technik Ende / Abbau bis ist erforderlich.' });
  }
  if (!soundcheck) {
    return res.status(400).json({ error: 'Soundcheck ist erforderlich.' });
  }
  if (!doorsForm) {
    return res.status(400).json({ error: 'Doors ist erforderlich.' });
  }

  const kostenpflichtigeZusatztechnik = typeof data.kostenpflichtigeZusatztechnik === 'string' ? data.kostenpflichtigeZusatztechnik.trim() : '';
  const anmerkungen = typeof data.anmerkungen === 'string' ? data.anmerkungen.trim() : '';
  const showfileDlive = !!data.showfileDlive;
  const showfileDot2 = !!data.showfileDot2;
  const hazerAus = !!data.hazerAus;
  const arbeitsplatzVerlassen = !!data.arbeitsplatzVerlassen;

  const currentEvent = await getCurrentEvent();
  if (!currentEvent) {
    return res.status(400).json({ error: 'Keine aktive Schicht. Bitte in der App eine Schicht starten.' });
  }

  const storagePath = req.app.locals.storagePath;
  const eventId = currentEvent.id;
  const eventName = currentEvent.event_name || '';
  const eventDate = currentEvent.event_date != null ? currentEvent.event_date.toISOString().slice(0, 10) : '';
  const doorsTime = doorsForm || currentEvent.doors_time || '';

  try {
    const pdfBuffer = await generateTechnikFormPDF({
      eventName,
      date: eventDate,
      doorsTime,
      kostenpflichtigeZusatztechnik,
      anmerkungen,
      showfileDlive,
      showfileDot2,
      hazerAus,
      arbeitsplatzVerlassen,
      signature: signatureBuffer,
      getInTechniker,
      name,
      technikEndeAbbauBis,
      soundcheck,
    });

    const eventDir = path.join(storagePath, 'events', eventId);
    await fs.mkdir(eventDir, { recursive: true });
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Technikfeedback-${timestamp}.pdf`;
    const filePath = path.join(eventDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    const relativePath = path.relative(storagePath, filePath);
    await getPool().query(
      `INSERT INTO documents (event_id, type, section_or_name, file_path, content_type, metadata)
       VALUES ($1, 'section', 'technik', $2, 'application/pdf', '{}'::jsonb)`,
      [eventId, relativePath]
    );

    if (name) {
      const existing = await getPool().query(
        'SELECT id FROM person_names WHERE type = $1 AND LOWER(TRIM(name)) = LOWER($2)',
        ['tech', name]
      );
      if (existing.rows.length === 0) {
        await getPool().query('INSERT INTO person_names (type, name) VALUES ($1, $2)', ['tech', name]);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Technik form submit error:', err);
    res.status(500).json({ error: 'PDF konnte nicht gespeichert werden.' });
  }
}

// GET /api/tech-names – list person names (type tech) for form autocomplete
router.get('/tech-names', async (req, res) => {
  try {
    const r = await getPool().query('SELECT id, name FROM person_names WHERE type = $1 ORDER BY name', ['tech']);
    res.json(r.rows.map((row) => ({ id: row.id, name: row.name })));
  } catch (err) {
    console.error('GET /api/tech-names:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/tech-add-name – add name to tech catalog
router.post('/tech-add-name', express.json(), async (req, res) => {
  const name = (req.body && req.body.name != null ? String(req.body.name) : '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Name erforderlich.' });
  }
  try {
    const existing = await getPool().query(
      'SELECT id FROM person_names WHERE type = $1 AND LOWER(TRIM(name)) = LOWER($2)',
      ['tech', name]
    );
    if (existing.rows.length > 0) {
      return res.json({ ok: true, name });
    }
    await getPool().query('INSERT INTO person_names (type, name) VALUES ($1, $2)', ['tech', name]);
    res.json({ ok: true, name });
  } catch (err) {
    console.error('POST /api/tech-add-name:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/technik-submit – form compatibility (same as POST /api/forms/technik/submit)
router.post('/technik-submit', express.json(), handleTechnikSubmit);

module.exports = { router, handleTechnikSubmit };
