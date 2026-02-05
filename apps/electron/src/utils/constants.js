// Section definitions
const sections = [
  { id: 'uebersicht', name: 'Übersicht' },
  { id: 'rider-extras', name: 'Hospitality' },
  { id: 'tontechniker', name: 'Ton/Lichttechnik' },
  { id: 'secu', name: 'Secu' },
  { id: 'andere-mitarbeiter', name: 'Andere Mitarbeiter' },
  { id: 'gaeste', name: 'Gäste' },
  { id: 'kassen', name: 'Kassen' }
];

const settingsSection = { id: 'settings', name: 'Settings' };

// Initial form data structure
const getInitialFormData = () => ({
  uebersicht: {},
  'rider-extras': {},
  tontechniker: { personnel: [], scannedImages: [] },
  kassen: {},
  secu: {
    securityPersonnel: [{ name: '', startTime: '', endTime: '' }],
    scannedDocuments: []
  },
  'andere-mitarbeiter': {
    mitarbeiter: []
  },
  gaeste: {}
});

// Initial shift notes structure
const getInitialShiftNotes = () => ({
  vvaConfirmationNote: null,
  closeShiftConfirmationNote: null,
  vvaMissingFieldsNote: null,
  slMissingFieldsNote: null,
  vvaMissingFields: null,
  slMissingFields: null,
  vvaFieldConfirmations: null,
  slFieldConfirmations: null
});

// Initial printed templates structure
const getInitialPrintedTemplates = () => ({
  securityzettel: false,
  handtuchzettel: false,
  technikzettel: false,
  uebersichtzettel: false,
  kassenzettel: false
});

// Make available globally
window.AppConstants = {
  sections,
  settingsSection,
  getInitialFormData,
  getInitialShiftNotes,
  getInitialPrintedTemplates
};

