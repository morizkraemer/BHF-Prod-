/**
 * API routes for documents: stream file by id.
 * GET /api/documents/:id – stream file from storage (Content-Type from row).
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../db');

const router = express.Router();

function poolOr503(req, res, next) {
  if (!getPool()) return res.status(503).json({ error: 'Database not configured' });
  next();
}

router.use(poolOr503);

// GET /api/documents/:id – stream file
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const storagePath = req.app.locals.storagePath;
  try {
    const r = await getPool().query(
      'SELECT id, event_id, type, section_or_name, file_path, content_type FROM documents WHERE id = $1',
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const row = r.rows[0];
    const absolutePath = path.join(storagePath, row.file_path);
    try {
      await fs.promises.access(absolutePath, fs.constants.R_OK);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    const contentType = row.content_type || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    const stream = fs.createReadStream(absolutePath);
    stream.on('error', (err) => {
      console.error('Stream error GET /api/documents/:id', err);
      if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
    });
    stream.pipe(res);
  } catch (err) {
    console.error('GET /api/documents/:id', err);
    if (!res.headersSent) res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
