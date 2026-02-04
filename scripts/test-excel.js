/**
 * Quick test script for Excel integration (Zeiterfassung).
 * Creates an .xlsx with multiple sheets and tables, writes sample data.
 * Production implementation: utils/zeiterfassungExcel.js (used on close-shift).
 *
 * Run: node scripts/test-excel.js
 */

const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'test-zeiterfassung.xlsx');

async function run() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Produktionstool Test';
  workbook.created = new Date();

  // --- Sheet 1: Mitarbeiter (as Excel Table / ListObject) ---
  const sheetMitarbeiter = workbook.addWorksheet('Mitarbeiter', {
    headerFooter: { firstHeader: 'Mitarbeiter', firstFooter: 'Zeiterfassung Test' },
  });

  sheetMitarbeiter.addTable({
    name: 'Tabelle_Mitarbeiter',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleLight9', showRowStripes: true },
    columns: [
      { name: 'ID', filterButton: true },
      { name: 'Name', filterButton: true },
      { name: 'Rolle', filterButton: true },
    ],
    rows: [
      [1, 'Max Müller', 'Tontechniker'],
      [2, 'Anna Schmidt', 'Licht'],
      [3, 'Tom Weber', 'Secu'],
    ],
  });
  sheetMitarbeiter.getColumn(1).width = 8;
  sheetMitarbeiter.getColumn(2).width = 18;
  sheetMitarbeiter.getColumn(3).width = 14;

  // --- Sheet 2: Zeiten (Excel Table + sample data) ---
  const sheetZeiten = workbook.addWorksheet('Zeiten');

  const zeitenHeaders = ['Datum', 'Name', 'Von', 'Bis', 'Pause (min)', 'Notizen'];
  const zeitenData = [
    ['2025-02-01', 'Max Müller', '18:00', '02:00', 30, 'Setup früher'],
    ['2025-02-01', 'Anna Schmidt', '19:00', '01:30', 15, ''],
    ['2025-02-02', 'Max Müller', '17:30', '02:30', 45, 'Konzert'],
  ];

  const zeitenRowCount = 1 + zeitenData.length;
  const zeitenRef = `A1:F${zeitenRowCount}`;
  sheetZeiten.addTable({
    name: 'Tabelle_Zeiten',
    ref: zeitenRef,
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleLight2', showRowStripes: true },
    columns: zeitenHeaders.map((h) => ({ name: h, filterButton: true })),
    rows: zeitenData,
  });
  sheetZeiten.getColumn(1).width = 12;
  sheetZeiten.getColumn(2).width = 18;
  sheetZeiten.getColumn(3).width = 8;
  sheetZeiten.getColumn(4).width = 8;
  sheetZeiten.getColumn(5).width = 12;
  sheetZeiten.getColumn(6).width = 20;

  // --- Sheet 3: Übersicht (plain data, no ListObject) ---
  const sheetUebersicht = workbook.addWorksheet('Übersicht');

  sheetUebersicht.addRow(['Zeiterfassung – Übersicht']);
  sheetUebersicht.addRow([]);
  sheetUebersicht.addRow(['Zeitraum', 'Anzahl Schichten', 'Stunden gesamt']);
  sheetUebersicht.addRow(['01.02.2025 – 02.02.2025', 3, 11.5]);
  sheetUebersicht.addRow([]);
  sheetUebersicht.addRow(['Erstellt', new Date().toISOString().slice(0, 19)]);

  sheetUebersicht.getRow(1).font = { bold: true, size: 14 };
  sheetUebersicht.getRow(3).font = { bold: true };
  sheetUebersicht.getColumn(1).width = 28;
  sheetUebersicht.getColumn(2).width = 20;
  sheetUebersicht.getColumn(3).width = 18;

  // --- Write file ---
  await workbook.xlsx.writeFile(OUTPUT_FILE);
  console.log('Created:', OUTPUT_FILE);
  console.log('Sheets: Mitarbeiter (Table), Zeiten (Table), Übersicht (plain)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
