# Nightclub Production Tool - Project Plan

## Project Overview
An Electron desktop application for gathering end-of-shift information at a nightclub. The app collects data through multiple forms, generates PDFs, handles scanner input, and organizes everything into structured folders on the hard drive.

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
  - **Rider Extras** - Artist rider and extras information
  - **Tontechniker** - Sound technician details and notes
  - **Kassenbelege** - Cash register receipts and financial information
- **Close Shift Button** (Bottom right)
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
- **React** - UI library
- **Node.js** - Backend runtime

### Key Dependencies
- `electron` - Main framework
- `react` + `react-dom` - UI components
- `pdfkit` or `jspdf` - PDF generation
- `electron-store` - Local data persistence
- `node-twain` or `scanner-js` - Scanner integration
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

### Phase 1: Basic Setup
- [ ] Initialize Electron project
- [ ] Set up React in renderer process
- [ ] Configure build tools and scripts
- [ ] Create basic window structure

### Phase 2: UI Layout & Navigation
- [ ] Create sidebar component with section navigation
- [ ] Implement main content area layout
- [ ] Add "Close Shift" button component (bottom right)
- [ ] Set up section switching/routing
- [ ] Add visual indicators for active/completed sections

### Phase 3: Form System
- [ ] Create Uebersicht form component
- [ ] Create Rider Extras form component
- [ ] Create Tontechniker form component
- [ ] Create Kassenbelege form component
- [ ] Implement form fields for each section
- [ ] Add form validation for each section
- [ ] Set up centralized form state management

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

### Phase 8: Data Persistence
- [ ] Set up electron-store
- [ ] Implement form data saving
- [ ] Add session resume functionality
- [ ] Create data export/import

### Phase 9: Polish & Testing
- [ ] UI/UX improvements
- [ ] Error handling
- [ ] User feedback (notifications, progress indicators)
- [ ] Testing on target platforms
- [ ] Documentation

## Form Sections & Fields

### Uebersicht (Overview)
#### Required Fields
- Date
- Event Name
- Number of Attendees
- Shift End Time

#### Optional Fields (to be confirmed)
- Staff present
- Revenue information
- Special notes
- Issues/incidents
- Equipment status

### Rider Extras
- Fields to be defined

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
  - Fixed "Close Shift" button in bottom right corner
- Intuitive form navigation
- Clear progress indicators
- Error messages and validation feedback
- Keyboard shortcuts
- Auto-save functionality
- Visual indicators for completed/incomplete sections

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


