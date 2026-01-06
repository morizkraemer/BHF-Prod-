const Store = require('electron-store');

// Settings store - persistent data that should not be cleared
const settingsStore = new Store({
  name: 'config',
  defaults: {
    riderExtrasItems: [],
    nightLeads: [],
    selectedScanner: null,
    scanFolder: null, // Will default to ~/Documents/NightclubScans if not set
    reportFolder: null, // Will default to ~/Documents/NightclubReports if not set
    einkaufsbelegeFolder: null, // Optional folder for copying Einkaufsbelege PDFs
    techNames: {
      soundEngineerName: '',
      lightingTechName: ''
    },
    templates: {
      securityzettel: null, // File path to template PDF
      handtuchzettel: null,
      technikzettel: null,
      uebersichtzettel: null
    },
    bestueckungLists: {
      'standard-konzert': [], // List of items for "Standard Konzert" - each item: {riderItemId, amount}
      'standard-tranzit': [] // List of items for "Standard Tranzit" - each item: {riderItemId, amount}
    }
  }
});

// Shift data store - temporary data that gets cleared when shift closes
const shiftDataStore = new Store({
  name: 'shift-data',
  defaults: {
    currentShiftData: null, // Stores formData for current shift
    currentPhase: 'VVA' // Current phase: 'VVA' or 'SL'
  }
});

// Export both stores
module.exports = {
  settingsStore,
  shiftDataStore,
  // For backward compatibility, export settingsStore as default
  default: settingsStore
};

