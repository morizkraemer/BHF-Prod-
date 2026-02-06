/**
 * Close-shift: section PDFs, Zeiterfassung entries (DB), document rows, set phase closed.
 * Report PDF (HTML→PDF) deferred to Phase 3 export app or Puppeteer follow-up.
 */

const path = require('path');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const { collectZeiterfassungData, collectZeiterfassungEntriesForDb } = require('../utils/zeiterfassungExcel');

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
  if (source === 'postprod') return 'Zusätzlich';
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
 * Also includes post-prod uploads: documents in DB with type = 'scan' not referenced in formData → section "Zusätzlich".
 */
async function collectScannedDocs(formData, eventId, pool, storagePath) {
  const docs = await pool.query('SELECT id, file_path, type, section_or_name FROM documents WHERE event_id = $1', [eventId]);
  const idToPath = {};
  docs.rows.forEach((r) => {
    idToPath[r.id] = path.join(storagePath, r.file_path);
  });

  const out = [];
  const addedIds = new Set();
  function add(source, scanName, doc, einkaufsbelegPaid) {
    let absPath = null;
    if (doc.id != null) absPath = idToPath[doc.id];
    if (!absPath && doc.filePath) absPath = path.isAbsolute(doc.filePath) ? doc.filePath : path.join(storagePath, doc.filePath);
    if (!absPath) return;
    if (doc.id != null) addedIds.add(doc.id);
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

  // Post-prod uploads: documents in DB with type = 'scan' not already included via formData
  for (const r of docs.rows) {
    if (r.type === 'scan' && !addedIds.has(r.id)) {
      const absPath = path.join(storagePath, r.file_path);
      out.push({ filePath: absPath, source: 'postprod', scanName: r.section_or_name || 'Zusätzlich', einkaufsbelegPaid: undefined });
    }
  }

  return out;
}

/**
 * Run Zeiterfassung inserts and set status = finished. No PDFs, no folder.
 * @param {{ eventId: string, formData: object, pool: object }}
 * @returns {{ success: boolean, error?: string }}
 */
async function runFinishEventOnly({ eventId, formData, pool }) {
  const eventRes = await pool.query(
    'SELECT id, event_name, event_date, phase, status, form_data FROM events WHERE id = $1',
    [eventId]
  );
  if (eventRes.rows.length === 0) {
    return { success: false, error: 'Event not found' };
  }
  const event = eventRes.rows[0];
  if (event.status === 'finished' || event.status === 'archived') {
    return { success: false, error: 'Event already finished' };
  }
  if (event.status !== 'checked') {
    return { success: false, error: 'Event must be in status "checked" before finishing' };
  }

  const data = formData || event.form_data || {};
  const eventDate = data.uebersicht?.date || (event.event_date ? event.event_date.toISOString().slice(0, 10) : new Date().toISOString().split('T')[0]);

  const { secuRows, tonLichtRows, andereRows } = collectZeiterfassungData(data, eventDate);
  const hasTimeData = secuRows.length > 0 || tonLichtRows.length > 0 || andereRows.length > 0;
  if (hasTimeData) {
    let sectionRoleNames = null;
    try {
      const sr = await pool.query("SELECT value FROM settings WHERE key = 'sectionRoleNames'");
      if (sr.rows.length > 0 && sr.rows[0].value) {
        sectionRoleNames = sr.rows[0].value;
      }
    } catch (err) {
      console.warn('runFinishEventOnly sectionRoleNames:', err.message);
    }
    const dbEntries = collectZeiterfassungEntriesForDb(eventId, data, eventDate, sectionRoleNames);

    let roleWagesMap = {};
    try {
      const rw = await pool.query('SELECT name, hourly_wage FROM roles');
      for (const row of rw.rows) {
        const k = (row.name || '').trim();
        if (k) roleWagesMap[k] = row.hourly_wage != null ? Number(row.hourly_wage) : 0;
      }
    } catch (err) {
      console.warn('runFinishEventOnly roles lookup:', err.message);
    }
    let personCustomWagesMap = {};
    try {
      const pw = await pool.query('SELECT person_name_key, hourly_wage FROM person_wages');
      for (const row of pw.rows) {
        const key = (row.person_name_key || '').trim().toLowerCase();
        if (key) personCustomWagesMap[key] = row.hourly_wage != null ? Number(row.hourly_wage) : 0;
      }
    } catch (err) {
      console.warn('runFinishEventOnly person_wages lookup:', err.message);
    }

    for (const e of dbEntries) {
      if ((e.wage === 0 || e.wage == null) && (e.person_name || '').trim()) {
        const personKey = (e.person_name || '').trim().toLowerCase();
        const wageNum = (e.role === 'Andere Mitarbeiter')
          ? personCustomWagesMap[personKey]
          : (personCustomWagesMap[personKey] ?? roleWagesMap[e.role]);
        if (wageNum != null && Number.isFinite(wageNum)) {
          e.wage = wageNum;
          e.amount = Math.round(e.hours * e.wage * 100) / 100;
        }
      }
      await pool.query(
        `INSERT INTO zeiterfassung_entries (event_id, role, event_name, entry_date, person_name, wage, start_time, end_time, hours, amount, category)
         VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11)`,
        [e.event_id, e.role, e.event_name, e.entry_date, e.person_name, e.wage, e.start_time, e.end_time, e.hours, e.amount, e.category]
      );
    }
  }

  await pool.query(
    `UPDATE events SET phase = 'closed', status = 'finished', form_data = $2::jsonb, updated_at = now(), finished_at = now()
     WHERE id = $1`,
    [eventId, JSON.stringify(data)]
  );

  return { success: true };
}

/**
 * Build event folder with section PDFs and insert document rows. Does not update event status.
 * @param {{ eventId: string, formData: object, storagePath: string, pool: object }}
 * @returns {{ success: boolean, eventFolder?: string, error?: string }}
 */
async function runExportEventFolder({ eventId, formData, storagePath, pool }) {
  const eventRes = await pool.query(
    'SELECT id, event_name, event_date, form_data FROM events WHERE id = $1',
    [eventId]
  );
  if (eventRes.rows.length === 0) {
    return { success: false, error: 'Event not found' };
  }
  const event = eventRes.rows[0];
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
      console.warn('runExportEventFolder section PDF:', section, err.message);
    }
  }

  return { success: true, eventFolder: eventFolderPath };
}

/**
 * Run close-shift for event: section PDFs, Zeiterfassung, document rows, set phase closed.
 * Kept for backward compatibility; finish route now uses runFinishEventOnly.
 * @param {{ eventId: string, formData: object, storagePath: string, pool: object }}
 * @returns {{ success: boolean, eventFolder?: string, error?: string }}
 */
async function runCloseShift({ eventId, formData, storagePath, pool }) {
  const eventRes = await pool.query(
    'SELECT id, event_name, event_date, phase, status, form_data FROM events WHERE id = $1',
    [eventId]
  );
  if (eventRes.rows.length === 0) {
    return { success: false, error: 'Event not found' };
  }
  const event = eventRes.rows[0];
  if (event.status === 'finished' || event.status === 'archived') {
    return { success: false, error: 'Event already finished' };
  }
  if (event.status !== 'closed' && event.status !== 'checked') {
    return { success: false, error: 'Event must be closed or checked before running full close shift' };
  }

  const folderResult = await runExportEventFolder({ eventId, formData, storagePath, pool });
  if (!folderResult.success) return folderResult;

  const data = formData || event.form_data || {};
  const eventDate = data.uebersicht?.date || (event.event_date ? event.event_date.toISOString().slice(0, 10) : new Date().toISOString().split('T')[0]);
  const { secuRows, tonLichtRows, andereRows } = collectZeiterfassungData(data, eventDate);
  const hasTimeData = secuRows.length > 0 || tonLichtRows.length > 0 || andereRows.length > 0;
  if (hasTimeData) {
    let sectionRoleNames = null;
    try {
      const sr = await pool.query("SELECT value FROM settings WHERE key = 'sectionRoleNames'");
      if (sr.rows.length > 0 && sr.rows[0].value) sectionRoleNames = sr.rows[0].value;
    } catch (err) {
      console.warn('closeShift sectionRoleNames:', err.message);
    }
    const dbEntries = collectZeiterfassungEntriesForDb(eventId, data, eventDate, sectionRoleNames);
    let roleWagesMap = {};
    try {
      const rw = await pool.query('SELECT name, hourly_wage FROM roles');
      for (const row of rw.rows) {
        const k = (row.name || '').trim();
        if (k) roleWagesMap[k] = row.hourly_wage != null ? Number(row.hourly_wage) : 0;
      }
    } catch (err) {
      console.warn('closeShift roles lookup:', err.message);
    }
    let personCustomWagesMap = {};
    try {
      const pw = await pool.query('SELECT person_name_key, hourly_wage FROM person_wages');
      for (const row of pw.rows) {
        const key = (row.person_name_key || '').trim().toLowerCase();
        if (key) personCustomWagesMap[key] = row.hourly_wage != null ? Number(row.hourly_wage) : 0;
      }
    } catch (err) {
      console.warn('closeShift person_wages lookup:', err.message);
    }
    for (const e of dbEntries) {
      if ((e.wage === 0 || e.wage == null) && (e.person_name || '').trim()) {
        const personKey = (e.person_name || '').trim().toLowerCase();
        const wageNum = (e.role === 'Andere Mitarbeiter')
          ? personCustomWagesMap[personKey]
          : (personCustomWagesMap[personKey] ?? roleWagesMap[e.role]);
        if (wageNum != null && Number.isFinite(wageNum)) {
          e.wage = wageNum;
          e.amount = Math.round(e.hours * e.wage * 100) / 100;
        }
      }
      await pool.query(
        `INSERT INTO zeiterfassung_entries (event_id, role, event_name, entry_date, person_name, wage, start_time, end_time, hours, amount, category)
         VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11)`,
        [e.event_id, e.role, e.event_name, e.entry_date, e.person_name, e.wage, e.start_time, e.end_time, e.hours, e.amount, e.category]
      );
    }
  }
  await pool.query(
    `UPDATE events SET phase = 'closed', status = 'finished', form_data = $2::jsonb, updated_at = now(), finished_at = now()
     WHERE id = $1`,
    [eventId, JSON.stringify(data)]
  );
  return { success: true, eventFolder: folderResult.eventFolder };
}

module.exports = { runCloseShift, runFinishEventOnly, runExportEventFolder, toCamelCaseFolderName, getSectionName, mergePDFs, collectScannedDocs };
