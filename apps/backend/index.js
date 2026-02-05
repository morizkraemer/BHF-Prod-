require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { getCurrentEvent, checkDb } = require('./db');
const catalogsRouter = require('./routes/catalogs');
const settingsRouter = require('./routes/settings');
const eventsRouter = require('./routes/events');
const zeiterfassungRouter = require('./routes/zeiterfassung');
const documentsRouter = require('./routes/documents');
const { router: secuFormRouter, handleSecuSubmit } = require('./routes/secuForm');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage root for PDFs/Excel; DB stores paths relative to this
const STORAGE_PATH = path.resolve(process.env.STORAGE_PATH || path.join(__dirname, 'storage'));
app.locals.storagePath = STORAGE_PATH;

app.use(express.json());

app.use('/api/catalogs', catalogsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/zeiterfassung', zeiterfassungRouter);
app.use('/api/documents', documentsRouter);
app.post('/api/forms/secu/submit', handleSecuSubmit);
app.use('/api', secuFormRouter);

app.get('/api/health', async (_req, res) => {
  const db = await checkDb();
  res.json({ ok: true, db });
});

app.get('/api/current-event', async (_req, res) => {
  try {
    const row = await getCurrentEvent();
    if (!row) {
      return res.status(200).json({ currentEvent: null });
    }
    res.json({
      currentEvent: {
        id: row.id,
        eventName: row.event_name,
        eventDate: row.event_date != null ? row.event_date.toISOString().slice(0, 10) : null,
        doorsTime: row.doors_time
      }
    });
  } catch (err) {
    console.error('GET /api/current-event:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Secu form: serve at GET /forms/secu (and /forms/secu/)
const publicDir = path.join(__dirname, 'public');
app.get('/forms/secu', (_req, res) => {
  res.sendFile(path.join(publicDir, 'secu', 'index.html'));
});
app.get('/forms/secu/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'secu', 'index.html'));
});
// Static: /secu/* and /src/* for form assets
app.use(express.static(publicDir));

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_PATH, { recursive: true });
}

ensureStorageDir()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log(`Storage path: ${STORAGE_PATH}`);
    });
  })
  .catch((err) => {
    console.error('Failed to ensure storage directory:', err);
    process.exit(1);
  });
