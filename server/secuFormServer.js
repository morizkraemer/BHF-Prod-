const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');
const { generateSecuFormPDF } = require('../utils/secuFormPdf');
const { shiftDataStore } = require('../config/store');
const { getLanFormRegistry, getFormById } = require('./lanFormRegistry');

const PORT = 3847;
const SELECTOR_PREFIX = '/_selector';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
};

/**
 * @param {import('electron-store')} store
 * @param {import('electron-store')} [shiftStore] - optional, defaults to shiftDataStore from config
 * @returns {http.Server}
 */
function createLanFormServer(store, shiftStore) {
  const shift = shiftStore != null ? shiftStore : shiftDataStore;
  const projectRoot = path.resolve(__dirname, '..');
  const projectSrcResolved = path.join(projectRoot, 'src');
  const projectSrcResolvedNorm = path.resolve(projectRoot, 'src');
  const selectorPublicDir = path.resolve(__dirname, 'form-selector-public');
  const registry = getLanFormRegistry();

  function getScanFolder() {
    const scanFolder = store.get('scanFolder', null);
    if (scanFolder) return scanFolder;
    return path.join(app.getPath('documents'), 'NightclubScans');
  }

  function getCurrentEvent() {
    let eventName = '';
    let date = '';
    let doorsTime = '';
    try {
      if (shift && typeof shift.get === 'function') {
        const shiftData = shift.get('currentShiftData', null);
        const uebersicht = (shiftData && typeof shiftData === 'object' && shiftData.uebersicht) || {};
        eventName = uebersicht.eventName != null ? String(uebersicht.eventName).trim() : '';
        date = uebersicht.date != null ? String(uebersicht.date).trim() : '';
        doorsTime = uebersicht.doorsTime != null ? String(uebersicht.doorsTime).trim() : '';
      }
    } catch (err) {
      console.warn('current-event read error:', err.message);
    }
    return { eventName, date, doorsTime };
  }

  /** Add name to a catalog by store key if not already present. */
  function addNameToCatalog(storeKey, name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const list = store.get(storeKey, []);
    const exists = list.some((item) => (item.name || '').trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    list.push({ id: Date.now().toString(), name: trimmed });
    store.set(storeKey, list);
  }

  async function serveFile(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
      }
    }
  }

  async function handleSecuSubmit(body, res) {
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Ungültige JSON-Daten.' }));
      return;
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
      if (name || startTime || endTime) {
        people = [{ name, startTime, endTime }];
      }
    }

    if (!people || people.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Mindestens eine Person mit Name, Start und Ende ist erforderlich.' }));
      return;
    }

    for (const p of people) {
      const n = typeof p.name === 'string' ? p.name.trim() : '';
      const st = typeof p.startTime === 'string' ? p.startTime.trim() : '';
      const et = typeof p.endTime === 'string' ? p.endTime.trim() : '';
      if (!n || !st || !et) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Jede Person braucht Name, Start und Ende.' }));
        return;
      }
    }

    const formEntry = getFormById('secu');
    if (!formEntry) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Form-Konfiguration fehlt.' }));
      return;
    }

    try {
      const { eventName, date, doorsTime } = getCurrentEvent();
      const scanBase = getScanFolder();
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateFolder = path.join(scanBase, formEntry.folderName, `${yyyy}-${mm}-${dd}`);
      await fs.mkdir(dateFolder, { recursive: true });

      const pdfBuffer = await generateSecuFormPDF({
        people,
        getickert,
        vorfalle,
        signature: signatureBuffer,
        einlassbereichAbgeraeumt,
        sachenZurueckgebracht,
        arbeitsplatzHinterlassen,
        eventName,
        date,
        doorsTime,
      });
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `Securityzettel-${timestamp}.pdf`;
      const filePath = path.join(dateFolder, fileName);
      await fs.writeFile(filePath, pdfBuffer);

      if (formEntry.nameCatalog) {
        for (const p of people) {
          const name = typeof p.name === 'string' ? p.name.trim() : '';
          if (name) addNameToCatalog(formEntry.nameCatalog.storeKey, name);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Secu form PDF save error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'PDF konnte nicht gespeichert werden.' }));
    }
  }

  const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);
    let pathname = parsed.pathname || '/';
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Favicon (app icon for browser tab)
    if (pathname === '/favicon.png' || pathname === '/icon.png') {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
        return;
      }
      const iconPath = path.join(projectRoot, 'assets', 'icons', 'icon.png');
      await serveFile(res, iconPath);
      return;
    }

    // Form selector: root
    if (pathname === '/' || pathname === '/index.html') {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
        return;
      }
      const indexPath = path.join(selectorPublicDir, 'index.html');
      await serveFile(res, indexPath);
      return;
    }

    // Form selector assets
    if (pathname.startsWith(SELECTOR_PREFIX + '/')) {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
        return;
      }
      const rel = pathname.slice(SELECTOR_PREFIX.length).replace(/^\//, '') || 'index.html';
      const safePath = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
      const filePath = path.join(selectorPublicDir, safePath);
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(selectorPublicDir) && resolved !== path.join(selectorPublicDir, '')) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      await serveFile(res, filePath);
      return;
    }

    // API: list forms (for selector page)
    if (pathname === '/api/forms') {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
        return;
      }
      const list = registry.map((f) => ({ id: f.id, name: f.name, path: f.path }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(list));
      return;
    }

    // API: Secu submit
    if (pathname === '/api/secu-submit') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          handleSecuSubmit(body, res);
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
      }
      return;
    }

    if (pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, message: 'LAN form server running' }));
      return;
    }

    // API: current event (shared)
    if (pathname === '/api/current-event') {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
        return;
      }
      const { eventName, date, doorsTime } = getCurrentEvent();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ eventName, date, doorsTime }));
      return;
    }

    // API: Secu name catalog
    if (pathname === '/api/secu-names') {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
        return;
      }
      const list = store.get('secuPersonNames', []);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(Array.isArray(list) ? list : []));
      return;
    }

    if (pathname === '/api/secu-add-name') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          let data;
          try {
            data = JSON.parse(body);
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Ungültige JSON-Daten.' }));
            return;
          }
          const name = typeof data.name === 'string' ? data.name.trim() : '';
          if (!name) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Name ist erforderlich.' }));
            return;
          }
          const list = store.get('secuPersonNames', []);
          const existing = list.find((item) => (item.name || '').trim().toLowerCase() === name.toLowerCase());
          if (existing) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(existing));
            return;
          }
          const newItem = { id: Date.now().toString(), name };
          list.push(newItem);
          store.set('secuPersonNames', list);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(newItem));
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
      }
      return;
    }

    // Project /src/ (PersonNameSelect, etc.)
    if (pathname.startsWith('/src/')) {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method Not Allowed');
        return;
      }
      const rel = pathname.replace(/^\//, '').replace(/^(\.\.(\/|\\|$))+/, '');
      const srcFilePath = path.join(projectRoot, rel);
      const resolvedSrc = path.resolve(srcFilePath);
      if (resolvedSrc !== projectSrcResolvedNorm && !resolvedSrc.startsWith(projectSrcResolvedNorm + path.sep)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      await serveFile(res, srcFilePath);
      return;
    }

    // Form app: match by path prefix (e.g. /secu, /secu/, /secu/style.css)
    const formEntryForPath = registry.find(
      (f) => pathname === f.path || pathname.startsWith(f.path + '/')
    );
    if (formEntryForPath && req.method === 'GET') {
      let relativePath = pathname.slice(formEntryForPath.path.length).replace(/^\//, '') || 'index.html';
      relativePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
      if (!relativePath) relativePath = 'index.html';
      const publicDir = path.join(__dirname, formEntryForPath.publicDir);
      const publicDirResolved = path.resolve(publicDir);
      const filePath = path.join(publicDirResolved, relativePath);
      const resolvedFile = path.resolve(filePath);
      if (!resolvedFile.startsWith(publicDirResolved) || resolvedFile === publicDirResolved) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      await serveFile(res, filePath);
      return;
    }

    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`LAN form server: port ${PORT} in use, forms not available`);
    } else {
      console.error('LAN form server error:', err);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LAN form server: http://0.0.0.0:${PORT}`);
  });

  return server;
}

// Backward compatibility: same module can be required as createSecuFormServer
const createSecuFormServer = createLanFormServer;

module.exports = { createLanFormServer, createSecuFormServer, PORT };
