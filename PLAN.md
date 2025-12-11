# Nightclub Production Tool - Project Plan

## Project Overview
An Electron desktop application for gathering end-of-shift information at a nightclub. The app collects data through multiple forms, generates PDFs, handles scanner input, and organizes everything into structured folders on the hard drive.

## Current Status
- ✅ **Phase 1 Complete** - Basic setup and UI structure working
- ✅ **Phase 2 Complete** - UI layout, sidebar, navigation, and Close Shift button in sidebar
- ✅ **Phase 3 Complete** - All forms implemented
  - ✅ Uebersicht form complete with event type selection and improved layout
  - ✅ Rider Extras form complete with item catalog integration
  - ✅ Ton/Lichttechnik form complete with scanner integration and tech info fields
  - ✅ Kassenbelege form complete with scanner integration
  - ✅ Settings page for managing catalog items (Rider Extras & Night Leads) and scanner settings
- ✅ **Item Catalog Systems** - Implemented with electron-store
  - ✅ Rider Extras catalog
  - ✅ Night Leads catalog
- ✅ **Hot Reload** - Development setup with electron-reload
- ✅ **Scanner Integration** - Complete with NAPS2 CLI
  - ✅ Scanner detection and selection
  - ✅ Scanner status display (green/red indicator)
  - ✅ Scan source selection (Glas/Oben) with page-specific defaults
  - ✅ PDF preview with PDF.js
  - ✅ Document management with filename list and preview popup
  - ✅ NAPS2 installation check on startup
  - ✅ Reusable DocumentScanner component
- 🔄 **Next**: Phase 4 - Validation & Close Shift Logic

## Core Features

### 1. Multi-Form Data Collection
- **Sidebar Navigation** (Left side)
  - Uebersicht (Overview)
  - Rider / Backstage
  - Ton/Lichttechnik (Sound/Lighting Technician)
  - Kassenbelege (Cash Receipts)
- **Form Sections**
  - **Uebersicht** - Production overview ✅
    - Event name, event type (club/konzert/einmietung), date on same line
    - Get In, Doors, Travel Party on same line
    - Night Lead selector (from catalog)
  - **Rider / Backstage** - Artist rider and extras information
    - Backstage Kuehlschrank selector (Standard Konzert, Standard Tranzit, None)
    - Extras section with dynamic items
    - Item catalog integration with autocomplete
    - Amount, Name, Discount (50%, 75%, 100%), Price, Checkbox (eingebongt)
  - **Ton/Lichttechnik** - Sound/Lighting technician details ✅
    - Sound engineer name and start/end time
    - Lighting tech name and start/end time (optional)
    - Document scanner integration (defaults to feeder)
    - Scan documents (PDF/images)
    - Preview scanned documents
    - Remove documents
  - **Kassenbelege** - Cash register receipts ✅
    - Document scanner integration (defaults to glass)
    - Scan receipts (PDF/images)
    - Preview scanned receipts
    - Remove receipts
- **Close Shift Button** (Bottom of sidebar)
  - Positioned at bottom of sidebar for easy access
  - Validates all required information across all sections
  - Shows validation errors if information is missing
  - Generates PDFs and saves all data when validation passes
  - Creates folder structure and organizes all files

### 2. PDF Generation
- Generate PDFs from form data
- Template-based PDF layout
- Include all form fields in organized format
- Professional formatting

### 3. File Management
- Create folder structure: `~/Documents/NightclubReports/[Date]_[EventName]/`
- Save generated PDFs to folder
- Organize all documents in one location
- Handle file naming conventions

### 4. Scanner Integration ✅ IMPLEMENTED
- ✅ Connect to scanner hardware (NAPS2 CLI)
- ✅ Scan documents and convert to PDF
- ✅ Scanner detection and selection in settings
- ✅ Scan source selection (glass/flatbed or feeder)
- ✅ PDF preview with PDF.js library
- ✅ Document management (filename list with preview popup)
- ✅ NAPS2 installation check on startup
- ⏳ Save scanned PDFs to report folder (pending file management)
- ✅ Support for multiple scans per session

### 5. Data Persistence
- Save form progress locally
- Resume incomplete sessions
- Store form templates and preferences

## Technical Stack

### Core Technologies
- **Electron** - Desktop app framework
- **React** - UI library (via CDN)
- **Node.js** - Backend runtime
- **npm** - Package manager

### Key Dependencies
- `electron` - Main framework
- `react` + `react-dom` - UI components (via CDN)
- `pdfkit` - PDF generation
- `electron-store` - Local data persistence ✅ Implemented
- `electron-reload` - Hot reload for development ✅ Implemented
- `node-twain` or `scanner-js` - Scanner integration (pending)
- `date-fns` - Date handling
- `react-router-dom` - Navigation (if needed)

## Project Structure

```
Produktionstool/
├── package.json
├── main.js                 # Electron main process
├── preload.js              # Preload script for security
├── index.html              # Main window HTML
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx              # Left sidebar navigation
│   │   ├── CloseShiftButton.jsx     # Bottom right validation/save button
│   │   ├── UebersichtForm.jsx       # Overview form
│   │   ├── RiderExtrasForm.jsx      # Rider Extras form
│   │   ├── TontechnikerForm.jsx     # Sound Technician form
│   │   ├── KassenbelegeForm.jsx     # Cash Receipts form
│   │   ├── DocumentScanner.jsx     # Reusable scanner component ✅
│   │   ├── PDFViewer.jsx           # PDF preview component ✅
│   │   └── TontechnikerForm.jsx    # Sound Technician form ✅
│   ├── utils/
│   │   ├── pdfGenerator.js
│   │   ├── fileManager.js
│   │   ├── scannerHandler.js
│   │   └── formValidator.js         # Validation logic for all forms
│   ├── styles/
│   │   └── main.css
│   └── App.jsx
├── assets/
│   └── icons/
└── output/                 # Generated reports (gitignored)
```

## Implementation Phases

### Phase 1: Basic Setup ✅ COMPLETE
- [x] Initialize Electron project
- [x] Set up React in renderer process
- [x] Configure build tools and scripts (using pnpm)
- [x] Create basic window structure
- [x] Sidebar navigation with 4 sections
- [x] Close Shift button (UI only, functionality in Phase 4)

### Phase 2: UI Layout & Navigation ✅ COMPLETE
- [x] Create sidebar component with section navigation
- [x] Implement main content area layout
- [x] Add "Close Shift" button component (moved to bottom of sidebar)
- [x] Set up section switching/routing
- [x] Settings page added to sidebar bottom
- [ ] Add visual indicators for active/completed sections (enhancement)

### Phase 3: Form System ✅ COMPLETE
- [x] Create Uebersicht form component ✅
- [x] Implement form fields for Uebersicht section ✅
  - [x] Event name, event type (club/konzert/einmietung), and date on same line
  - [x] Get In, Doors, and Travel Party on same line
  - [x] Night Lead dropdown (integrated with catalog)
- [x] Set up centralized form state management ✅
- [x] Create Rider Extras form component ✅
- [x] Implement form fields for Rider Extras section ✅
  - [x] Backstage Kuehlschrank selector
  - [x] Dynamic extras items with Amount, Name, Discount, Price, Checkbox
  - [x] Column headers for better organization
  - [x] Item catalog integration with autocomplete
- [x] Create Settings page for catalog management ✅
  - [x] Rider Extras catalog management
  - [x] Night Leads catalog management
  - [x] Scanner settings
- [x] Create Tontechniker form component ✅
  - [x] Renamed to "Ton/Lichttechnik"
  - [x] Sound engineer name and start/end time fields
  - [x] Lighting tech name and start/end time fields (optional)
  - [x] Document scanner integration in box
  - [x] Scanner defaults to feeder source
  - [x] Reusable DocumentScanner component
  - [x] PDF preview functionality
- [x] Create Kassenbelege form component ✅
  - [x] Document scanner integration (defaults to glass source)
  - [x] Receipt scanning functionality
  - [x] Document list with preview
- [ ] Add form validation for each section

### Phase 4: Validation & Close Shift Logic
- [ ] Implement form validation utility
- [ ] Create validation rules for each section
- [ ] Add "Close Shift" button validation logic
- [ ] Show validation errors/missing fields
- [ ] Implement save workflow when validation passes

### Phase 5: PDF Generation
- [ ] Set up PDF library
- [ ] Design PDF template
- [ ] Implement PDF generation from form data
- [ ] Add PDF preview functionality
- [ ] Test PDF output

### Phase 6: File Management
- [ ] Implement folder creation logic
- [ ] Set up file saving functionality
- [ ] Create file naming conventions
- [ ] Handle file organization
- [ ] Add error handling for file operations

### Phase 7: Scanner Integration ✅ COMPLETE
- [x] Research scanner compatibility ✅ (NAPS2 CLI chosen)
- [x] Set up scanner library ✅ (NAPS2 CLI integration)
- [x] Create scanner UI component ✅ (DocumentScanner reusable component)
- [x] Implement scan-to-PDF functionality ✅
- [x] Scanner detection and selection ✅
- [x] Scanner status display (green/red indicator) ✅
- [x] Scan source selection (Glas/Oben) ✅
- [x] Default source configuration per page ✅
  - [x] Ton/Lichttechnik: defaults to feeder
  - [x] Kassenbelege: defaults to glass
- [x] PDF preview with PDF.js ✅
- [x] Document preview popup ✅
- [x] Filename-based document list ✅
- [x] NAPS2 installation check ✅
- [ ] Integrate scanner with file management (pending Phase 6)

### Phase 8: Data Persistence 🔄 PARTIALLY COMPLETE
- [x] Set up electron-store ✅
- [x] Implement item catalog persistence (Rider Extras items) ✅
- [x] Implement Night Leads catalog persistence ✅
- [x] Scanner selection persistence ✅
- [x] Scan folder selection persistence ✅
- [ ] Implement form data saving (session persistence)
- [ ] Add session resume functionality
- [ ] Create data export/import

### Phase 9: Polish & Testing
- [ ] UI/UX improvements
- [ ] Error handling
- [ ] User feedback (notifications, progress indicators)
- [ ] Testing on target platforms
- [ ] Documentation

## Form Sections & Fields

### Uebersicht (Overview) ✅ IMPLEMENTED
#### Implemented Fields
- **Event Name** (text input) * - Left side of header row
- **Event Type** (dropdown: Club, Konzert, Einmietung) - Middle of header row
- **Date** (date picker, preselected to current date) * - Right side, small
- **Get In Zeit** (time selector) * - First of three columns
- **Doors Zeit** (time selector) * - Second of three columns
- **Travel Party Anzahl** (number input) - Third of three columns
- **Night Lead** (dropdown selector) * - Integrated with catalog system

\* Required fields

#### Layout
- Event name, event type, and date on same line (event name flexible width, type ~160px, date ~180px small)
- Get In, Doors, and Travel Party on same line (three equal columns)
- Responsive: stacks vertically on smaller screens

#### Notes
- Form component: `src/components/UebersichtForm.jsx`
- Night Lead dropdown loads from catalog (Settings → Night Leads)
- Form state integrated with App component

### Rider / Backstage ✅ IMPLEMENTED
#### Implemented Fields
- **Backstage Kuehlschrank** (dropdown: Standard Konzert, Standard Tranzit, None)
- **Extras Section** (dynamic list of items)
  - **Anzahl** (number input) - Amount/quantity
  - **Name** (text input with autocomplete from catalog) *
  - **Rabatt** (dropdown: 50%, 75%, 100%) - Discount percentage
  - **Preis** (number input) - Price (auto-calculated with discount)
  - **eingebongt** (checkbox) - Checked in status

#### Features
- Item catalog integration with autocomplete
- Discount calculation (50%, 75%, 100% reduction)
- Dynamic add/remove items
- Column headers for organization
- Settings page for managing catalog items

### Ton/Lichttechnik (Sound/Lighting Technician) ✅ IMPLEMENTED
- **Sound Engineer Fields** ✅
  - Name (required)
  - Start time
  - End time
- **Lighting Tech Fields** ✅ (Optional)
  - Name
  - Start time
  - End time
- **Document Scanner** ✅
  - Scanner in styled box
  - Scanner status display (green if connected, red if not)
  - Scan source selection (Glas/Oben) - defaults to "Oben" (feeder)
  - Scan button
  - Scanned documents list (filename-based)
  - Document preview popup (click filename to preview)
  - Remove document functionality
- **Notes**: 
  - Uses reusable DocumentScanner component
  - Page renamed from "Tontechniker" to "Ton/Lichttechnik"
  - Scanner defaults to feeder source for this page

### Kassenbelege (Cash Receipts) ✅ IMPLEMENTED
- **Document Scanner** ✅
  - Scanner in styled box
  - Scanner status display (green if connected, red if not)
  - Scan source selection (Glas/Oben) - defaults to "Glas" (glass/flatbed)
  - Scan button
  - Scanned documents list (filename-based)
  - Document preview popup (click filename to preview)
  - Remove document functionality
- **Notes**: 
  - Uses reusable DocumentScanner component
  - Scanner defaults to glass source for receipts
  - No manual file upload option (scanning only)

## File Organization Structure

```
~/Documents/NightclubReports/
└── YYYY-MM-DD_EventName/
    ├── Uebersicht.pdf
    ├── RiderExtras.pdf
    ├── Tontechniker.pdf
    ├── Kassenbelege.pdf
    └── Scans/
        ├── scan_001.pdf
        ├── scan_002.pdf
        └── ...
```

## Scanner Requirements ✅ IMPLEMENTED

### Implementation
- **NAPS2 CLI** - Cross-platform scanner utility
- **eSCL Driver** - Used on macOS for network scanners (shows IP addresses)
- **Scanner Detection** - Automatic detection via NAPS2 CLI
- **Scan Sources** - Glass (flatbed) or Feeder (automatic document feeder)

### Supported Features ✅
- ✅ Scan to PDF
- ✅ Multiple page scanning (supported by NAPS2, not currently implemented in UI)
- ✅ Resolution settings (300 DPI default)
- ⏳ Color/B&W options (NAPS2 supports, not exposed in UI yet)

### Scanner Settings
- Scanner selection in Settings → Printer / Scanner
- Scan folder selection
- NAPS2 installation check on startup

## Development Considerations

### Security
- Use preload scripts for secure IPC
- Validate all file paths
- Sanitize user inputs
- Secure file operations

### Cross-Platform Compatibility
- Test on macOS (primary)
- Consider Windows compatibility
- Handle platform-specific scanner APIs

### User Experience
- **Layout**
  - Left sidebar with section navigation
  - Main content area for active form
  - "Close Shift" button at bottom of sidebar ✅
- Intuitive form navigation
- Clear progress indicators
- Error messages and validation feedback
- Keyboard shortcuts
- Auto-save functionality
- Visual indicators for completed/incomplete sections

### Development
- **Hot Reload** ✅ Implemented
  - Use `npm run dev` for development with hot reload
  - Automatically reloads on file changes
  - DevTools can be opened manually (Cmd+Option+I / Ctrl+Shift+I)

## Future Enhancements (Optional)

- Export to cloud storage
- Email reports
- Report templates customization
- Data analytics dashboard
- Multi-language support
- Dark mode
- Report history viewer

## Questions to Resolve

1. What specific fields are required in each section?
   - Uebersicht: ✓ (partially defined)
   - Rider Extras: ?
   - Tontechniker: ?
   - Kassenbelege: ?
2. What scanner model will be used?
3. What operating system(s) need to be supported?
4. Should there be a way to edit/update existing reports?
5. Any specific PDF formatting requirements?
6. Should reports be searchable/indexed?
7. What validation rules apply to each section?
8. Should the "Close Shift" button be disabled until all required fields are filled?

## Notes

- Scanner integration complexity depends on hardware model
- May need platform-specific scanner drivers
- Consider fallback options if scanner library doesn't work
- PDF generation should be fast and reliable
- File organization should be clear and consistent


