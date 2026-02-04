/**
 * Test script: create or append to an Excel workbook on the Desktop.
 * - If the workbook does not exist: create it with one sheet per role, each with a table.
 * - If it exists: open it and append rows to each sheet's table.
 *
 * Run: node scripts/test-excel-append.js
 */

const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const WORKBOOK_NAME = 'test-append.xlsx';
const DESKTOP_PATH = path.join(os.homedir(), 'Desktop', WORKBOOK_NAME);

const SHEET_CONFIG = [
  { sheetName: 'Secu', tableName: 'Tabelle_Secu' },
  { sheetName: 'Ton-Licht', tableName: 'Tabelle_TonLicht' },
  { sheetName: 'Andere Mitarbeiter', tableName: 'Tabelle_Andere' }
];

const TABLE_HEADERS = ['Datum', 'Name', 'Von', 'Bis'];
const COL_COUNT = TABLE_HEADERS.length;

function getEndColLetter() {
  return String.fromCharCode(64 + COL_COUNT);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read existing data rows from the sheet (between header and end of table).
 */
function readTableDataRowsFromSheet(sheet, table, dataStartRow, dataEndRow) {
  const width = table.width || COL_COUNT;
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
 * Create a new workbook with one sheet per config, each with a table (header + one initial row).
 */
function createWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Produktionstool Test';
  workbook.created = new Date();

  const today = new Date().toISOString().slice(0, 10);

  for (const { sheetName, tableName } of SHEET_CONFIG) {
    const sheet = workbook.addWorksheet(sheetName);
    const initialRows = [
      [today, 'Test Person', '18:00', '02:00']
    ];
    const rowCount = 1 + initialRows.length;
    const ref = `A1:${getEndColLetter()}${rowCount}`;
    sheet.addTable({
      name: tableName,
      ref,
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleLight2', showRowStripes: true },
      columns: TABLE_HEADERS.map((h) => ({ name: h, filterButton: true })),
      rows: initialRows
    });
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 8;
    sheet.getColumn(4).width = 8;
  }

  return workbook;
}

/**
 * Append one row to each sheet's table. Uses the same pattern as zeiterfassungExcel
 * (fix ref/model.rows when loaded from file, then addRow, update ref, store).
 */
function appendToWorkbook(workbook) {
  const today = new Date().toISOString().slice(0, 10);
  const newRows = [
    [today, 'Appended Person', '19:00', '01:00'],
    [today, 'Appended Person 2', '20:00', '00:00']
  ];

  for (const { sheetName, tableName } of SHEET_CONFIG) {
    const sheet = workbook.getWorksheet(sheetName);
    const table = sheet && sheet.getTable ? sheet.getTable(tableName) : undefined;
    if (!sheet || !table) {
      console.warn(`Sheet "${sheetName}" or table "${tableName}" not found, skipping.`);
      continue;
    }

    const model = table.model;
    if (!model) {
      console.warn(`Table "${tableName}" has no model, skipping.`);
      continue;
    }

    const rangeStr = (table.ref && typeof table.ref === 'string' ? table.ref : null) || model.tableRef || '';
    if (!rangeStr) {
      console.warn(`Table "${tableName}" has no ref/tableRef, skipping.`);
      continue;
    }

    const parts = rangeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (!parts) {
      console.warn(`Table "${tableName}" ref "${rangeStr}" could not be parsed, skipping.`);
      continue;
    }

    const startRow = parseInt(parts[2], 10);
    const endRow = parseInt(parts[4], 10);
    const endCol = getEndColLetter();
    const dataStartRow = startRow + 1;
    const dataEndRow = endRow;

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

    for (const row of newRows) {
      table.addRow(row);
    }

    const newEndRow = 1 + table.height;
    table.ref = `A1:${endCol}${newEndRow}`;
    table.validate();
    if (!table.worksheet) table.worksheet = sheet;
    table.store();
  }
}

async function run() {
  const exists = await fileExists(DESKTOP_PATH);

  if (!exists) {
    const workbook = createWorkbook();
    await workbook.xlsx.writeFile(DESKTOP_PATH);
    console.log('Created workbook:', DESKTOP_PATH);
    console.log('Sheets:', SHEET_CONFIG.map((c) => c.sheetName).join(', '));
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(DESKTOP_PATH);
  appendToWorkbook(workbook);
  await workbook.xlsx.writeFile(DESKTOP_PATH);
  console.log('Appended rows to workbook:', DESKTOP_PATH);
  console.log('Updated tables:', SHEET_CONFIG.map((c) => c.tableName).join(', '));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
