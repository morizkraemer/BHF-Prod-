# Nightclub Production Tool - Project Plan

## Project Overview
An Electron desktop application for gathering end-of-shift information at a nightclub. The app collects data through multiple forms, generates PDFs, handles scanner input, and organizes everything into structured folders on the hard drive.

## Current Status
- ✅ **Phase 1 Complete** - Basic setup and UI structure working
- ✅ **Phase 2 Complete** - UI layout, sidebar, navigation, and Close Shift button in sidebar
- ✅ **Phase 3 In Progress** - Uebersicht and Rider Extras forms implemented
  - ✅ Uebersicht form complete
  - ✅ Rider Extras form complete with item catalog integration
  - ✅ Settings page for managing catalog items
  - ⏳ Tontechniker and Kassenbelege forms pending
- ✅ **Item Catalog System** - Implemented with electron-store
- ✅ **Hot Reload** - Development setup with electron-reload
- 🔄 **Next**: Complete remaining forms (Tontechniker, Kassenbelege) or proceed to Phase 4

## Core Features

### 1. Multi-Form Data Collection
- **Sidebar Navigation** (Left side)
  - Uebersicht (Overview)
  - Rider Extras
  - Tontechniker (Sound Technician)
  - Kassenbelege (Cash Receipts)
- **Form Sections**
  - **Uebersicht** - Production overview
    - Date picker
    - Event name
    - Number of attendees
    - Additional production details
  - **Rider / Backstage** - Artist rider and extras information
    - Backstage Kuehlschrank selector (Standard Konzert, Standard Tranzit, None)
    - Extras section with dynamic items
    - Item catalog integration with autocomplete
    - Amount, Name, Discount (50%, 75%, 100%), Price, Checkbox (eingebongt)
  - **Tontechniker** - Sound technician details and notes
  - **Kassenbelege** - Cash register receipts and financial information
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

### 4. Scanner Integration
- Connect to scanner hardware
- Scan documents and convert to PDF
- Save scanned PDFs to report folder
- Support for multiple scans per session

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
│   │   ├── ScannerControl.jsx       # Scanner integration component
│   │   └── PDFPreview.jsx
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

### Phase 3: Form System 🔄 IN PROGRESS
- [x] Create Uebersicht form component ✅
- [x] Implement form fields for Uebersicht section ✅
- [x] Set up centralized form state management ✅
- [x] Create Rider Extras form component ✅
- [x] Implement form fields for Rider Extras section ✅
  - [x] Backstage Kuehlschrank selector
  - [x] Dynamic extras items with Amount, Name, Discount, Price, Checkbox
  - [x] Column headers for better organization
  - [x] Item catalog integration with autocomplete
- [x] Create Settings page for catalog management ✅
- [ ] Create Tontechniker form component
- [ ] Create Kassenbelege form component
- [ ] Implement form fields for remaining sections
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

### Phase 7: Scanner Integration
- [ ] Research scanner compatibility
- [ ] Set up scanner library
- [ ] Create scanner UI component
- [ ] Implement scan-to-PDF functionality
- [ ] Integrate scanner with file management

### Phase 8: Data Persistence 🔄 PARTIALLY COMPLETE
- [x] Set up electron-store ✅
- [x] Implement item catalog persistence (Rider Extras items) ✅
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
- **Date** (date picker, preselected to current date) *
- **Event Name** (text input) *
- **Get In Zeit** (time selector) *
- **Doors Zeit** (time selector) *
- **Travel Party Anzahl** (number input)
- **Night Lead** (dropdown selector) *

\* Required fields

#### Notes
- Form component created: `src/components/UebersichtForm.jsx`
- Form state integrated with App component
- Night Lead dropdown currently has placeholder options - needs actual names

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

### Tontechniker (Sound Technician)
- Fields to be defined

### Kassenbelege (Cash Receipts)
- Fields to be defined
- Scanner integration for receipt scanning

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

## Scanner Requirements

### Supported Protocols
- TWAIN (Windows/Mac)
- WIA (Windows)
- Image Capture (macOS)
- SANE (Linux)

### Scanner Features Needed
- Scan to PDF
- Multiple page scanning
- Resolution settings
- Color/B&W options

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
  - DevTools opens automatically

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


