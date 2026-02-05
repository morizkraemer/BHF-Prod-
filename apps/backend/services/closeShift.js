/**
 * Close-shift: section PDFs, Zeiterfassung Excel, document rows, set phase closed.
 * Report PDF (HTML→PDF) deferred to Phase 3 export app or Puppeteer follow-up.
 */

const path = require('path');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const {
  buildZeiterfassungWorkbook,
  loadZeiterfassungWorkbook,
  appendZeiterfassungToWorkbook,
  collectZeiterfassungData
} = require('../utils/zeiterfassungExcel');

function toCamelCaseFolderName(str) {
  if (!str) return 'unbekanntesEvent';
  const sanitized = String(str).replace(/[<>:"/\\|?*]/g, '_');
  const words = sanitized.split(/[\s_\-]+/).filter((w) => w.length > 0);
  if (words.length === 0) return 'unbekanntesEvent';
  return words.map((word, i) => {
    const lower = word.toLowerCase();
    return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join('');
}

function getSectionName(source, scanName) {
  if (source === 'tontechniker') return 'Technik';
  if (source === 'secu') return 'Security';
  if (source === 'kassen') return (scanName === 'Abrechnungen') ? 'Abrechnungen' : 'Belege';
  if (source === 'rider-extras') {
    if (scanName === 'Handtuchzettel') return 'Handtucher';
    if (scanName === 'Einkaufsbeleg') return 'Einkaufsbelege';
    if (scanName === 'Buyout Quittung') return 'Buyout Quittung';
    return 'Handtucher';
  }
  if (source === 'gaeste') return 'Agentur';
  return 'Belege';
}

async function mergePDFs(pdfPaths) {
  const merged = await PDFDocument.create();
  for (const filePath of pdfPaths) {
    try {
      const bytes = await fs.readFile(filePath);
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } catch (err) {
      console.warn('mergePDFs skip:', filePath, err.message);
    }
  }
  return Buffer.from(await merged.save());
}

/**
 * Resolve document ref (id or filePath) to absolute path. Load documents for event to build id->path.
 */
async function collectScannedDocs(formData, eventId, pool, storagePath) {
  const docs = await pool.query('SELECT id, file_path FROM documents WHERE event_id = $1', [eventId]);
  const idToPath = {};
  docs.rows.forEach((r) => {
    idToPath[r.id] = path.join(storagePath, r.file_path);
  });

  const out = [];
  function add(source, scanName, doc, einkaufsbelegPaid) {
    let absPath = null;
    if (doc.id != null) absPath = idToPath[doc.id];
    if (!absPath && doc.filePath) absPath = path.isAbsolute(doc.filePath) ? doc.filePath : path.join(storagePath, doc.filePath);
    if (!absPath) return;
    out.push({ filePath: absPath, source, scanName: scanName || 'unknown', einkaufsbelegPaid });
  }

  const ton = formData.tontechniker?.scannedImages || [];
  ton.forEach((d) => add('tontechniker', d.scanName || 'Technikzettel', d));
  const secu = formData.secu?.scannedDocuments || [];
  secu.forEach((d) => add('secu', d.scanName || 'Securityzettel', d));
  const kassenR = formData.kassen?.receipts || [];
  kassenR.forEach((d) => add('kassen', d.scanName || 'Kassen-Belege', d));
  const kassenA = formData.kassen?.abrechnungen || [];
  kassenA.forEach((d) => add('kassen', d.scanName || 'Abrechnungen', d));
  const riderScan = formData['rider-extras']?.scannedDocuments || [];
  riderScan.forEach((d) => add('rider-extras', d.scanName || 'Handtuchzettel', d));
  const einkaufsbelegPaid = formData.shiftNotes?.einkaufsbelegPaid;
  const riderPurchase = formData['rider-extras']?.purchaseReceipts || [];
  riderPurchase.forEach((d) => add('rider-extras', d.scanName || 'Einkaufsbeleg', d, einkaufsbelegPaid));
  const riderBuyout = formData['rider-extras']?.buyoutQuittungDocuments || [];
  riderBuyout.forEach((d) => add('rider-extras', d.scanName || 'Buyout Quittung', d));
  const gaeste = formData.gaeste?.scannedDocuments || [];
  gaeste.forEach((d) => add('gaeste', d.scanName || 'Agenturzettel', d));

  return out;
}

/**
 * Run close-shift for event: section PDFs, Zeiterfassung, document rows, set phase closed.
 * @param {{ eventId: string, formData: object, storagePath: string, pool: object }}
 * @returns {{ success: boolean, eventFolder?: string, error?: string }}
 */
async function runCloseShift({ eventId, formData, storagePath, pool }) {
  const eventRes = await pool.query(
    'SELECT id, event_name, event_date, phase, form_data FROM events WHERE id = $1',
    [eventId]
  );
  if (eventRes.rows.length === 0) {
    return { success: false, error: 'Event not found' };
  }
  const event = eventRes.rows[0];
  if (event.phase === 'closed') {
    return { success: false, error: 'Event already closed' };
  }

  const data = formData || event.form_data || {};
  const uebersicht = data.uebersicht || {};
  const eventName = uebersicht.eventName || event.event_name || 'Unbekanntes Event';
  const eventDate = uebersicht.date || (event.event_date ? event.event_date.toISOString().slice(0, 10) : new Date().toISOString().split('T')[0]);
  const sanitizedEventName = toCamelCaseFolderName(eventName);
  const eventFolderName = `${eventDate}_${sanitizedEventName}`;
  const reportsRoot = path.join(storagePath, 'reports');
  const eventFolderPath = path.join(reportsRoot, eventFolderName);
  await fs.mkdir(eventFolderPath, { recursive: true });

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const scannedDocs = await collectScannedDocs(data, eventId, pool, storagePath);
  const scansByScanName = {};
  scannedDocs.forEach((doc) => {
    const key = doc.scanName || 'unknown';
    if (!scansByScanName[key]) scansByScanName[key] = [];
    scansByScanName[key].push(doc);
  });

  for (const [scanName, docs] of Object.entries(scansByScanName)) {
    if (docs.length === 0) continue;
    const isEinkaufsbeleg = scanName === 'Einkaufsbeleg' || String(scanName).toLowerCase().includes('einkaufsbeleg');
    const paid = docs[0].einkaufsbelegPaid === true;
    if (isEinkaufsbeleg && paid) continue;
    const section = getSectionName(docs[0].source, docs[0].scanName);
    const fileName = isEinkaufsbeleg && !paid
      ? `UNBEZAHLT_EINKAUFSBELEG_${section}-${dateStr}-${sanitizedEventName}.pdf`
      : `${section}-${dateStr}-${sanitizedEventName}.pdf`;
    let destPath = path.join(eventFolderPath, fileName);
    let counter = 1;
    while (true) {
      try {
        await fs.access(destPath);
        destPath = path.join(eventFolderPath, `${path.basename(fileName, '.pdf')}_${counter}.pdf`);
        counter++;
      } catch {
        break;
      }
    }
    const pdfPaths = docs.map((d) => d.filePath).filter(Boolean);
    if (pdfPaths.length === 0) continue;
    try {
      const buffer = pdfPaths.length > 1 ? await mergePDFs(pdfPaths) : await fs.readFile(pdfPaths[0]);
      await fs.writeFile(destPath, buffer);
      const relativePath = path.relative(storagePath, destPath);
      await pool.query(
        `INSERT INTO documents (event_id, type, section_or_name, file_path, content_type, metadata)
         VALUES ($1, 'section', $2, $3, 'application/pdf', '{}'::jsonb)`,
        [eventId, section, relativePath]
      );
    } catch (err) {
      console.warn('closeShift section PDF:', section, err.message);
    }
  }

  const zeiterfassungDir = path.join(storagePath, 'zeiterfassung');
  const { secuRows, tonLichtRows, andereRows } = collectZeiterfassungData(data, eventDate);
  const hasTimeData = secuRows.length > 0 || tonLichtRows.length > 0 || andereRows.length > 0;
  if (hasTimeData) {
    await fs.mkdir(zeiterfassungDir, { recursive: true });
    const yearMonth = eventDate.slice(0, 7);
    const excelPath = path.join(zeiterfassungDir, `Zeiterfassung-${yearMonth}.xlsx`);
    let exists = false;
    try {
      await fs.access(excelPath);
      exists = true;
    } catch {}
    try {
      if (exists) {
        const workbook = await loadZeiterfassungWorkbook(excelPath);
        appendZeiterfassungToWorkbook(workbook, data);
        await workbook.xlsx.writeFile(excelPath);
      } else {
        const { workbook } = await buildZeiterfassungWorkbook(data);
        await workbook.xlsx.writeFile(excelPath);
      }
      const relativePath = path.relative(storagePath, excelPath);
      await pool.query(
        `INSERT INTO documents (event_id, type, section_or_name, file_path, content_type, metadata)
         VALUES ($1, 'zeiterfassung', $2, $3, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '{}'::jsonb)`,
        [eventId, yearMonth, relativePath]
      );
    } catch (err) {
      console.warn('closeShift Zeiterfassung:', err.message);
    }
  }

  await pool.query(
    `UPDATE events SET phase = 'closed', form_data = $2::jsonb, updated_at = now()
     WHERE id = $1`,
    [eventId, JSON.stringify(data)]
  );

  return { success: true, eventFolder: eventFolderPath };
}

module.exports = { runCloseShift, toCamelCaseFolderName, getSectionName, mergePDFs, collectScannedDocs };
