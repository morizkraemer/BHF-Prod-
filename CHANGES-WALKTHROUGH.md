# Walkthrough of Open Changes

This document summarizes all **uncommitted** changes: what they do, how they fit together, and whether they are consistent.

---

## 1. Config & dependencies

### `.gitignore`
- **Change:** Added `.pnpm-store/` so pnpm’s local store is not committed.
- **Makes sense:** Yes; avoids committing a large cache.

### `config/store.js`
- **Change:**  
  - `zeiterfassungExcelFolder: null` – folder for monthly Excel Zeiterfassung files.  
  - `wageOptions: []` – list of wage labels (e.g. `["25 €/h", "30 €/h"]`).  
  - `personWages: {}` – map of person name (trimmed) → selected wage option.
- **Makes sense:** Yes; these back the new Zeiterfassung Excel flow and per-person wage UI.

### `package.json`
- **Change:** Added `exceljs` dependency; `devDependencies` reordered (e.g. `@electron/packager` before `electron`).
- **Makes sense:** Yes; Excel create/append needs ExcelJS.

### `pnpm-lock.yaml`
- **Change:** Lockfile updated for dependency changes.
- **Makes sense:** Yes; keep lockfile in sync with `package.json`.

---

## 2. IPC / main process

### `preload.js`
- **Change:** Exposed to renderer:  
  - `setZeiterfassungExcelFolder`, `getZeiterfassungExcelFolder`  
  - `getWageOptions`, `saveWageOptions`, `getPersonWage`, `getPersonWages`, `setPersonWage`  
  - `removePersonFromCatalogs`
- **Makes sense:** Yes; matches new handlers and UI.

### `handlers/settingsHandlers.js`
- **Change:**  
  - Wage: `get-wage-options`, `save-wage-options`, `get-person-wage`, `get-person-wages`, `set-person-wage` (read/write store).  
  - Zeiterfassung: `set-zeiterfassung-excel-folder`, `get-zeiterfassung-excel-folder` (dialog + store).  
  - Reset: clear `zeiterfassungExcelFolder`, `wageOptions`, `personWages` on “Alle Einstellungen zurücksetzen”.
- **Makes sense:** Yes; settings and reset are consistent.

### `handlers/catalogHandlers.js`
- **Change:**  
  - `removePersonName(storeKey, name)` – remove one name from a catalog (Secu/Tech/Andere) by trimmed lowercase match.  
  - `remove-person-from-catalogs` – removes name from all three catalogs and from `personWages`.
- **Makes sense:** Yes; supports “remove employee” in settings and keeps catalogs + wages in sync.

### `handlers/reportHandlers.js`
- **Change:** Zeiterfassung on close-shift:  
  - If folder set and there is time data: `Zeiterfassung-YYYY-MM.xlsx` in that folder.  
  - If file does not exist: `buildZeiterfassungWorkbook(formData)` → write file.  
  - If file exists: `loadZeiterfassungWorkbook` → `appendZeiterfassungToWorkbook` → write file.  
  - Errors caught and logged; close-shift still returns success.
- **Makes sense:** Yes; single monthly Excel, create once then append. Depends on `utils/zeiterfassungExcel.js` (see untracked file).

---

## 3. Zeiterfassung Excel (untracked: `utils/zeiterfassungExcel.js`)

- **Role:** Builds/loads/appends the monthly Excel workbook; collects time data from form (including wage).
- **Data flow:**  
  - `collectZeiterfassungData(formData, eventDate)` – reads Secu, Ton-Licht, Andere from form (including `soundEngineerWage`, `lightingTechWage`, `p.wage`).  
  - Create: `buildZeiterfassungWorkbook` → three sheets with tables (header + totals).  
  - Append: load file → fix `model.rows` and `table.worksheet` for loaded tables → `table.addRow` per role → update ref → `store()` → save.
- **Makes sense:** Yes; matches report handler and form data shape (wage on each person). Must be **added to git** so report handler works.

---

## 4. Forms (Secu, Ton-Licht, Andere Mitarbeiter)

### Shared pattern (all three forms)
- **State:** Each person row has a `wage` field; wage options loaded from store via `getWageOptions()`.
- **UI:** Name + wage in a combo (name input/select + wage `<select>`). Wage options from settings; if current value not in list, it still appears as option.
- **Persistence:** On wage change → `setPersonWage(name, value)`. On name change → `getPersonWage(name)` and set local wage (with `setTimeout` in list forms to avoid stale state).
- **Initial:** Existing form data normalized to include `wage: ''` (e.g. `p.wage ?? ''`).

### `SecuForm.jsx`
- **Change:** `securityPersonnel` items have `wage`; header “Name” → “Name / €/h”; name+wage combo per row; add row includes `wage: ''`.
- **Makes sense:** Yes; structure matches `zeiterfassungExcel` (secu `p.wage`).

### `TontechnikerForm.jsx`
- **Change:** `localData` has `soundEngineerWage`, `lightingTechWage`; load wage from store when name changes; name+wage combo for both techs; `handleWageChange` updates store.
- **Makes sense:** Yes; `collectZeiterfassungData` uses `ton.soundEngineerWage` and `ton.lightingTechWage`.

### `AndereMitarbeiterForm.jsx`
- **Change:** Same as Secu: `mitarbeiter` items have `wage`; “Name” → “Name / €/h”; name+wage combo; add row with `wage: ''`.
- **Makes sense:** Yes; andere rows include wage and category for Excel.

---

## 5. Settings UI

### `SettingsForm.jsx`
- **Zeiterfassung folder:** New block “Excel Zeiterfassung Ordner” – select folder, display path, same pattern as other folder settings. Reset and copy text updated to mention this folder.
- **Wage options (Stundensätze):** New block – add/remove wage labels (e.g. “25 €/h”); stored in `wageOptions`. Used by forms as dropdown options.
- **Employees (Mitarbeiter):** New section – list of all persons from Secu + Tech + Andere (+ current shift) with their saved wage; dropdown to change wage; “Remove” calls `removePersonFromCatalogs` (after confirm). Refreshes when opening the section or clicking “Aktualisieren”.
- **Test data:** “Fill test data” picks random names from Secu/Tech/Andere catalogs instead of hardcoded placeholders; wages still come from store when forms load.
- **Makes sense:** Yes; one place to manage wages and Zeiterfassung folder; employees list and remove are consistent with catalogs and `personWages`.

---

## 6. Styles

### `src/styles/forms.css`
- **Change:** Tech row grid adjusted; name+wage combo for Ton/Licht (`.name-wage-combo-*`, inner border, no double border on inner input); wage column width; min-widths for flex/grid.
- **Makes sense:** Yes; supports the new combo layout.

### `src/styles/pages.css`
- **Change:** Secu and Andere: “Name” column → name+wage combo (`.secu-name-wage-combo`, `.andere-mitarbeiter-name-wage-combo`); header class renames; grid columns from `2fr 1fr 1fr` to `1fr 0.33fr 0.33fr` so wage has fixed space; combo focus and inner input border removal.
- **Makes sense:** Yes; aligns with form structure.

### `src/styles/settings.css`
- **Change:** New styles for employees table (e.g. `.settings-employees-table-wrapper`, `.settings-employees-table`), buttons and layout for wage options and employee list.
- **Makes sense:** Yes; needed for new Settings sections.

---

## 7. Untracked files

| Path | Purpose |
|------|--------|
| `utils/zeiterfassungExcel.js` | Zeiterfassung Excel: create/append workbook, collect form data. **Required** for close-shift Excel. |
| `scripts/test-excel.js` | Existing test that creates a sample Excel (multiple sheets/tables). |
| `scripts/test-excel-append.js` | Test: create workbook on Desktop or append rows to existing; same append pattern as production. |

**Recommendation:** Add `utils/zeiterfassungExcel.js` to the repo. Keep or add `scripts/test-excel-append.js` if you want a quick way to test append without closing a shift.

---

## 8. Consistency checks

| Check | Status |
|-------|--------|
| Form data has `wage` on Secu, Ton/Licht, Andere | Yes – all forms and `collectZeiterfassungData` use it. |
| Store: wageOptions + personWages | Yes – used by settings and forms; reset clears them. |
| Zeiterfassung: folder in store + handler | Yes – report handler reads folder, create/append uses same path. |
| Remove person: catalogs + personWages | Yes – catalogHandlers remove from all three + wages. |
| Preload exposes all new APIs | Yes – folder, wage, remove-person. |

---

## 9. Summary

- **Theme:** Wage per person (Secu, Ton/Licht, Andere), stored by name; optional monthly Excel Zeiterfassung (create or append) on close-shift; settings to manage wage options, folder, and employee list (with remove).
- **Implementation:** Consistent: same form shape, same store keys, same IPC names, and Excel module matches form data and report handler.
- **Action:** Commit the modified files and **add** `utils/zeiterfassungExcel.js` (and optionally the script(s) under `scripts/`).
