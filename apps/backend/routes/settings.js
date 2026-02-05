/**
 * API routes for settings (key-value JSONB). Mirror store shape.
 * Keys: techNames, templates, scanFolder, reportFolder, einkaufsbelegeFolder,
 * selectedScanner, cateringPrices, pauschalePrices.
 */

const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

function poolOr503(req, res, next) {
  if (!getPool()) return res.status(503).json({ error: 'Database not configured' });
  next();
}

router.use(poolOr503);

async function getSetting(key) {
  const r = await getPool().query('SELECT value FROM settings WHERE key = $1', [key]);
  return r.rows[0]?.value ?? null;
}

async function setSetting(key, value) {
  await getPool().query(
    'INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb',
    [key, JSON.stringify(value)]
  );
}

// GET /api/settings – return all settings as object (for compatibility)
router.get('/', async (req, res) => {
  try {
    const r = await getPool().query('SELECT key, value FROM settings');
    const obj = {};
    for (const row of r.rows) obj[row.key] = row.value;
    res.json(obj);
  } catch (err) {
    console.error('GET /api/settings:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/settings/:key – return single setting value (null if not set)
router.get('/:key', async (req, res) => {
  try {
    const value = await getSetting(req.params.key);
    res.json(value);
  } catch (err) {
    console.error('GET /api/settings/:key:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /api/settings/:key – set setting value (body = JSON value)
router.put('/:key', async (req, res) => {
  const key = req.params.key;
  const value = req.body;
  try {
    await setSetting(key, value);
    res.json(await getSetting(key));
  } catch (err) {
    console.error('PUT /api/settings/:key:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
