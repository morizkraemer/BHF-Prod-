/**
 * Builds an Excel Zeiterfassung workbook from close-shift form data.
 * Sheets: Secu, Ton-Licht, Andere Mitarbeiter (each with table + totals row).
 * Used when closing a shift if zeiterfassungExcelFolder is set.
 *
 * Data flow: if Zeiterfassung-YYYY-MM.xlsx exists we load it and append to each sheet's table;
 * otherwise we create a new workbook and save it.
 *
 * Edge cases to be aware of:
 * - Empty role on first create: we now always create a table (header + totals row).
 * - Date not YYYY-MM-DD or missing: stored as-is (may be text); date filter in Excel may not work.
 * - Invalid/empty Von or Bis: Stunden and Betrag become 0 (no error).
 * - Unparseable wage: Betrag uses 0; odd formats (e.g. "25€" no space) may not parse.
 * - Excel write errors: caught in report handler, logged; close-shift still succeeds.
 */

const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

/** Parse wage string (e.g. "25 €/h") to number for summing. Returns number or null if not parseable. */
function parseWageToNumber(wageStr) {
  if (wageStr == null || wageStr === '') return null;
  const s = String(wageStr).trim();
  const match = s.match(/[\d,]+([.,]\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

/** Parse time string (e.g. "18:00", "18:30") to decimal hours since midnight. Returns null if not parseable. */
function parseTimeToDecimalHours(timeStr) {
  if (timeStr == null || String(timeStr).trim() === '') return null;
  const s = String(timeStr).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours + minutes / 60 + seconds / 3600;
}

/** Compute hours worked from Von/Bis time strings. Returns decimal hours or 0 if invalid. Handles overnight (e.g. 22:00 to 02:00). */
function computeHours(von, bis) {
  const start = parseTimeToDecimalHours(von);
  const end = parseTimeToDecimalHours(bis);
  if (start == null || end == null) return 0;
  let hours = end - start;
  if (hours < 0) hours += 24;
  return Math.round(hours * 100) / 100;
}

/** Parses YYYY-MM-DD string to a Date (local midnight). Returns the Date or the original value if not parseable. */
function parseDateForExcel(dateStr) {
  if (dateStr == null || typeof dateStr !== 'string') return dateStr;
  const match = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  if (m < 0 || m > 11 || d < 1 || d > 31) return dateStr;
  return new Date(y, m, d);
}

/**
 * Collects time entries per role from formData.
 * @param {Object} formData - Full form data (uebersicht, tontechniker, secu, andere-mitarbeiter)
 * @param {string} eventDate - YYYY-MM-DD
 * @returns {{ secuRows: Array<[eventName, date, name, wage, von, bis]>, tonLichtRows: Array<...>, andereRows: Array<[eventName, date, name, wage, von, bis, category]> }}
 */
function collectZeiterfassungData(formData, eventDate) {
  const secuRows = [];
  const tonLichtRows = [];
  const andereRows = [];
  const eventName = (formData.uebersicht && formData.uebersicht.eventName) ? String(formData.uebersicht.eventName).trim() : '';

  // Ton/Lichttechnik
  const ton = formData.tontechniker || {};
  if (ton.soundEngineerEnabled !== false && (ton.soundEngineerName || '').trim()) {
    tonLichtRows.push([
      eventName,
      eventDate,
      (ton.soundEngineerName || '').trim(),
      ton.soundEngineerWage || '',
      ton.soundEngineerStartTime || '',
      ton.soundEngineerEndTime || ''
    ]);
  }
  if (ton.lightingTechEnabled && (ton.lightingTechName || '').trim()) {
    tonLichtRows.push([
      eventName,
      eventDate,
      (ton.lightingTechName || '').trim(),
      ton.lightingTechWage || '',
      ton.lightingTechStartTime || '',
      ton.lightingTechEndTime || ''
    ]);
  }

  // Secu
  const secuList = formData.secu?.securityPersonnel || [];
  secuList.forEach((p) => {
    const n = (p.name || '').trim();
    if (!n) return;
    secuRows.push([
      eventName,
      eventDate,
      n,
      p.wage || '',
      p.startTime || '',
      p.endTime || ''
    ]);
  });

  // Andere Mitarbeiter
  const andereList = formData['andere-mitarbeiter']?.mitarbeiter || [];
  andereList.forEach((p) => {
    const n = (p.name || '').trim();
    if (!n) return;
    andereRows.push([
      eventName,
      eventDate,
      n,
      p.wage || '',
      p.startTime || '',
      p.endTime || '',
      (p.category || '').trim()
    ]);
  });

  return { secuRows, tonLichtRows, andereRows };
}

/** Role sheet config: sheet name, table name, hasNotizen. */
const ROLE_SHEETS = [
  { sheetName: 'Secu', tableName: 'Tabelle_Secu', hasNotizen: false },
  { sheetName: 'Ton-Licht', tableName: 'Tabelle_TonLicht', hasNotizen: false },
  { sheetName: 'Andere Mitarbeiter', tableName: 'Tabelle_Andere', hasNotizen: true }
];

/**
 * Converts raw role rows to table row format: numeric wage, Stunden, Betrag, Bezahlt "Nein".
 * Row from collectZeiterfassungData: [eventName, date, name, wage, von, bis] or [..., category].
 * @param {Array<Array>} rows - From collectZeiterfassungData
 * @param {boolean} hasNotizen
 * @returns {Array<Array>}
 */
function toTableRowFormat(rows, hasNotizen) {
  return rows.map((row) => {
    const r = [...row];
    r[1] = parseDateForExcel(r[1]);
    const wageNum = parseWageToNumber(r[3]);
    r[3] = wageNum != null ? wageNum : (r[3] === '' || r[3] == null ? 0 : r[3]);
    const von = r[4];   // E = Von
    const bis = r[5];   // F = Bis
    const stunden = computeHours(von, bis);  // G = Stunden
    const betrag = Math.round(stunden * (Number(r[3]) || 0) * 100) / 100;  // H = Betrag
    const category = hasNotizen ? r.pop() : null;  // Kategorie last (J) for Andere
    r.splice(6, 0, stunden, betrag);  // G=Stunden, H=Betrag after Bis
    r.push('Nein');                   // I=Bezahlt
    if (hasNotizen) r.push(category); // J=Kategorie
    return r;
  });
}

/**
 * Loads an existing Zeiterfassung workbook from disk.
 * @param {string} filePath
 * @returns {Promise<ExcelJS.Workbook>}
 */
async function loadZeiterfassungWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

/**
 * Reads existing data rows from the worksheet for a table range (between header and totals).
 * @param {ExcelJS.Worksheet} sheet
 * @param {ExcelJS.Table} table - table with ref/tableRef and width
 * @param {number} dataStartRow - 1-based first data row
 * @param {number} dataEndRow - 1-based last data row
 * @returns {Array<Array>}
 */
function readTableDataRowsFromSheet(sheet, table, dataStartRow, dataEndRow) {
  const width = table.width;
  const existingRows = [];
  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const row = sheet.getRow(r);
    const values = [];
    for (let c = 1; c <= width; c++) {
      const cell = row.getCell(c);
      let v = cell.value;
      if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
      values.push(v);
    }
    existingRows.push(values);
  }
  return existingRows;
}

/**
 * Appends current event data to an existing workbook.
 * Uses table.addRow() and table.store() so the table model and sheet stay in sync.
 * When loading from file, ExcelJS stores the range in tableRef (not ref) and may not populate table.rows; we fix both.
 * @param {ExcelJS.Workbook} workbook
 * @param {Object} formData
 */
function appendZeiterfassungToWorkbook(workbook, formData) {
  const uebersicht = formData.uebersicht || {};
  const eventDate = uebersicht.date || new Date().toISOString().split('T')[0];
  const { secuRows, tonLichtRows, andereRows } = collectZeiterfassungData(formData, eventDate);

  const secuTableRows = toTableRowFormat(secuRows, false);
  const tonLichtTableRows = toTableRowFormat(tonLichtRows, false);
  const andereTableRows = toTableRowFormat(andereRows, true);

  const roleData = [
    { sheetName: 'Secu', tableName: 'Tabelle_Secu', rows: secuTableRows, colCount: 6 },
    { sheetName: 'Ton-Licht', tableName: 'Tabelle_TonLicht', rows: tonLichtTableRows, colCount: 6 },
    { sheetName: 'Andere Mitarbeiter', tableName: 'Tabelle_Andere', rows: andereTableRows, colCount: 7 }
  ];

  for (const { sheetName, tableName, rows, colCount } of roleData) {
    if (rows.length === 0) continue;
    const sheet = workbook.getWorksheet(sheetName);
    const table = sheet && sheet.getTable ? sheet.getTable(tableName) : undefined;
    if (!sheet || !table) {
      console.warn(`Zeiterfassung: sheet "${sheetName}" or table "${tableName}" not found, skipping append.`);
      continue;
    }
    // Loaded workbooks store range in tableRef; created ones use ref.
    const model = table.model;
    if (!model) {
      console.warn(`Zeiterfassung: table "${tableName}" has no model, skipping append.`);
      continue;
    }
    const rangeStr = (table.ref && typeof table.ref === 'string' ? table.ref : null) || model.tableRef || '';
    if (!rangeStr) {
      console.warn(`Zeiterfassung: table "${tableName}" has no ref/tableRef, skipping append.`);
      continue;
    }
    const parts = rangeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (!parts) {
      console.warn(`Zeiterfassung: table "${tableName}" ref "${rangeStr}" could not be parsed, skipping append.`);
      continue;
    }
    const startRow = parseInt(parts[2], 10);
    const endRow = parseInt(parts[4], 10);
    const tableColCount = rows[0].length;
    const endCol = tableColCount <= 26 ? String.fromCharCode(64 + tableColCount) : parts[3].toUpperCase();
    const dataStartRow = startRow + 1;   // after header
    const dataEndRow = endRow - 1;        // before totals

    // Populate model.rows from sheet before touching table.ref (ExcelJS reads table.height on ref set)
    if (!model.rows || model.rows.length === 0) {
      if (dataEndRow >= dataStartRow) {
        model.rows = readTableDataRowsFromSheet(sheet, table, dataStartRow, dataEndRow);
      } else {
        model.rows = [];
      }
    }

    if (!table.ref || typeof table.ref !== 'string') {
      table.ref = rangeStr;
    }

    for (const row of rows) {
      table.addRow(row);
    }
    const newTotalsRow = 1 + table.height + 1; // header + data rows + totals
    table.ref = `A1:${endCol}${newTotalsRow}`;
    table.validate();
    if (!table.worksheet) table.worksheet = sheet;
    table.store();
  }
}

/**
 * Adds a role sheet with table and totals row. Rows must already be in table format from toTableRowFormat (Stunden, Betrag, Bezahlt included).
 *
 * Column map (Excel letter = 1-based index):
 *   Secu / Ton-Licht (9 cols): A=Event, B=Datum, C=Name, D=Stundensatz, E=Von, F=Bis, G=Stunden, H=Betrag, I=Bezahlt
 *   Andere Mitarbeiter (10):   A=Event, B=Datum, C=Name, D=Stundensatz, E=Von, F=Bis, G=Stunden, H=Betrag, I=Bezahlt, J=Kategorie?
 *
 * @param {ExcelJS.Workbook} workbook
 * @param {string} sheetName - Tab name
 * @param {string} tableName - Excel table name
 * @param {Array<Array>} rows - Data rows from toTableRowFormat (same order as headers)
 * @param {boolean} hasNotizen - If true, row has Kategorie in column J (last)
 */
function addRoleSheet(workbook, sheetName, tableName, rows, hasNotizen = false) {
  const sheet = workbook.addWorksheet(sheetName);
  const headers = hasNotizen
    ? ['Event', 'Datum', 'Name', 'Stundensatz', 'Von', 'Bis', 'Stunden', 'Betrag', 'Bezahlt', 'Kategorie']
    : ['Event', 'Datum', 'Name', 'Stundensatz', 'Von', 'Bis', 'Stunden', 'Betrag', 'Bezahlt'];
  const colConfig = [
    { name: 'Event', filterButton: true, totalsRowLabel: 'Gesamt', totalsRowFunction: 'none' },
    { name: 'Datum', filterButton: true, totalsRowFunction: 'none' },
    { name: 'Name', filterButton: true, totalsRowFunction: 'none' },
    { name: 'Stundensatz', filterButton: true, totalsRowFunction: 'none' },
    { name: 'Von', filterButton: true, totalsRowFunction: 'none' },
    { name: 'Bis', filterButton: true, totalsRowFunction: 'none' },
    { name: 'Stunden', filterButton: true, totalsRowFunction: 'sum' },
    { name: 'Betrag', filterButton: true, totalsRowFunction: 'sum' },
    { name: 'Bezahlt', filterButton: true, totalsRowFunction: 'none' }
  ];
  if (hasNotizen) colConfig.push({ name: 'Kategorie', filterButton: true, totalsRowFunction: 'none' });
  const colCount = colConfig.length;
  const stundenCol = 7;  // G
  const betragCol = 8;   // H

  const rowCount = 1 + rows.length + 1;  // header + data + totals
  const ref = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
  sheet.addTable({
    name: tableName,
    ref,
    headerRow: true,
    totalsRow: true,
    style: { theme: 'TableStyleLight2', showRowStripes: true },
    columns: colConfig,
    rows
  });
  sheet.getColumn(2).numFmt = 'dd.mm.yyyy';
  sheet.getColumn(4).numFmt = '0 "€/h"';
  sheet.getColumn(stundenCol).numFmt = '0.00';
  sheet.getColumn(betragCol).numFmt = '#,##0.00 "€"';
  const totalsRow = sheet.getRow(rowCount);
  totalsRow.getCell(1).value = 'Gesamt';
  totalsRow.getCell(stundenCol).value = { formula: `SUBTOTAL(109,${tableName}[Stunden])`, result: 0 };
  totalsRow.getCell(betragCol).value = { formula: `SUBTOTAL(109,${tableName}[Betrag])`, result: 0 };
  totalsRow.getCell(stundenCol).numFmt = '0.00';
  totalsRow.getCell(betragCol).numFmt = '#,##0.00 "€"';
  for (let i = 1; i <= colCount; i++) {
    const w = i === 1 ? 22 : i === 2 ? 12 : i === 3 ? 22 : i === 4 ? 14 : i <= 6 ? 8 : 10;
    sheet.getColumn(i).width = w;
  }
}

/**
 * Builds an ExcelJS workbook for Zeiterfassung. Does not write to disk.
 * @param {Object} formData - Full form data from close-shift
 * @returns {Promise<{ workbook: ExcelJS.Workbook, hasTimeData: boolean }>}
 */
async function buildZeiterfassungWorkbook(formData) {
  const uebersicht = formData.uebersicht || {};
  const eventDate = uebersicht.date || new Date().toISOString().split('T')[0];

  const { secuRows, tonLichtRows, andereRows } = collectZeiterfassungData(formData, eventDate);
  const hasTimeData = secuRows.length > 0 || tonLichtRows.length > 0 || andereRows.length > 0;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Produktionstool';
  workbook.created = new Date();

  addRoleSheet(workbook, 'Secu', 'Tabelle_Secu', toTableRowFormat(secuRows, false), false);
  addRoleSheet(workbook, 'Ton-Licht', 'Tabelle_TonLicht', toTableRowFormat(tonLichtRows, false), false);
  addRoleSheet(workbook, 'Andere Mitarbeiter', 'Tabelle_Andere', toTableRowFormat(andereRows, true), true);

  return { workbook, hasTimeData };
}

module.exports = {
  buildZeiterfassungWorkbook,
  loadZeiterfassungWorkbook,
  appendZeiterfassungToWorkbook,
  collectZeiterfassungData
};
