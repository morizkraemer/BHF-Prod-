/**
 * Builds an Excel Zeiterfassung workbook from close-shift form data.
 * Sheets: Secu, Ton-Licht, Andere Mitarbeiter (each with table + totals row).
 * Server copy – uses ExcelJS and fs only.
 */

const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

function parseWageToNumber(wageStr) {
  if (wageStr == null || wageStr === '') return null;
  const s = String(wageStr).trim();
  const match = s.match(/[\d,]+([.,]\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

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

function computeHours(von, bis) {
  const start = parseTimeToDecimalHours(von);
  const end = parseTimeToDecimalHours(bis);
  if (start == null || end == null) return 0;
  let hours = end - start;
  if (hours < 0) hours += 24;
  return Math.round(hours * 100) / 100;
}

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

function collectZeiterfassungData(formData, eventDate) {
  const secuRows = [];
  const tonLichtRows = [];
  const andereRows = [];
  const eventName = (formData.uebersicht && formData.uebersicht.eventName) ? String(formData.uebersicht.eventName).trim() : '';
  const ton = formData.tontechniker || {};
  if (ton.soundEngineerEnabled !== false && (ton.soundEngineerName || '').trim()) {
    tonLichtRows.push([eventName, eventDate, (ton.soundEngineerName || '').trim(), ton.soundEngineerWage || '', ton.soundEngineerStartTime || '', ton.soundEngineerEndTime || '']);
  }
  if (ton.lightingTechEnabled && (ton.lightingTechName || '').trim()) {
    tonLichtRows.push([eventName, eventDate, (ton.lightingTechName || '').trim(), ton.lightingTechWage || '', ton.lightingTechStartTime || '', ton.lightingTechEndTime || '']);
  }
  (formData.secu?.securityPersonnel || []).forEach((p) => {
    const n = (p.name || '').trim();
    if (!n) return;
    secuRows.push([eventName, eventDate, n, p.wage || '', p.startTime || '', p.endTime || '']);
  });
  (formData['andere-mitarbeiter']?.mitarbeiter || []).forEach((p) => {
    const n = (p.name || '').trim();
    if (!n) return;
    andereRows.push([eventName, eventDate, n, p.wage || '', p.startTime || '', p.endTime || '', (p.category || '').trim()]);
  });
  return { secuRows, tonLichtRows, andereRows };
}

function toTableRowFormat(rows, hasNotizen) {
  return rows.map((row) => {
    const r = [...row];
    r[1] = parseDateForExcel(r[1]);
    const wageNum = parseWageToNumber(r[3]);
    r[3] = wageNum != null ? wageNum : (r[3] === '' || r[3] == null ? 0 : r[3]);
    const von = r[4];
    const bis = r[5];
    const stunden = computeHours(von, bis);
    const betrag = Math.round(stunden * (Number(r[3]) || 0) * 100) / 100;
    const category = hasNotizen ? r.pop() : null;
    r.splice(6, 0, stunden, betrag);
    r.push('Nein');
    if (hasNotizen) r.push(category);
    return r;
  });
}

async function loadZeiterfassungWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

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

function appendZeiterfassungToWorkbook(workbook, formData) {
  const uebersicht = formData.uebersicht || {};
  const eventDate = uebersicht.date || new Date().toISOString().split('T')[0];
  const { secuRows, tonLichtRows, andereRows } = collectZeiterfassungData(formData, eventDate);
  const secuTableRows = toTableRowFormat(secuRows, false);
  const tonLichtTableRows = toTableRowFormat(tonLichtRows, false);
  const andereTableRows = toTableRowFormat(andereRows, true);
  const roleData = [
    { sheetName: 'Secu', tableName: 'Tabelle_Secu', rows: secuTableRows },
    { sheetName: 'Ton-Licht', tableName: 'Tabelle_TonLicht', rows: tonLichtTableRows },
    { sheetName: 'Andere Mitarbeiter', tableName: 'Tabelle_Andere', rows: andereTableRows }
  ];
  for (const { sheetName, tableName, rows } of roleData) {
    if (rows.length === 0) continue;
    const sheet = workbook.getWorksheet(sheetName);
    const table = sheet && sheet.getTable ? sheet.getTable(tableName) : undefined;
    if (!sheet || !table) continue;
    const model = table.model;
    if (!model) continue;
    const rangeStr = (table.ref && typeof table.ref === 'string' ? table.ref : null) || model.tableRef || '';
    if (!rangeStr) continue;
    const parts = rangeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (!parts) continue;
    const startRow = parseInt(parts[2], 10);
    const endRow = parseInt(parts[4], 10);
    const tableColCount = rows[0].length;
    const endCol = tableColCount <= 26 ? String.fromCharCode(64 + tableColCount) : parts[3].toUpperCase();
    const dataStartRow = startRow + 1;
    const dataEndRow = endRow - 1;
    if (!model.rows || model.rows.length === 0) {
      model.rows = dataEndRow >= dataStartRow ? readTableDataRowsFromSheet(sheet, table, dataStartRow, dataEndRow) : [];
    }
    if (!table.ref || typeof table.ref !== 'string') table.ref = rangeStr;
    for (const row of rows) table.addRow(row);
    table.ref = `A1:${endCol}${1 + table.height + 1}`;
    table.validate();
    if (!table.worksheet) table.worksheet = sheet;
    table.store();
  }
}

function addRoleSheet(workbook, sheetName, tableName, rows, hasNotizen = false) {
  const sheet = workbook.addWorksheet(sheetName);
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
  const stundenCol = 7;
  const betragCol = 8;
  const rowCount = 1 + rows.length + 1;
  const ref = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
  sheet.addTable({ name: tableName, ref, headerRow: true, totalsRow: true, style: { theme: 'TableStyleLight2', showRowStripes: true }, columns: colConfig, rows });
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
    sheet.getColumn(i).width = i === 1 ? 22 : i === 2 ? 12 : i === 3 ? 22 : i === 4 ? 14 : i <= 6 ? 8 : 10;
  }
}

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
