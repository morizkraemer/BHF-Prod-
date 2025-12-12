const Store = require('electron-store');

// Initialize electron-store
const store = new Store({
  name: 'config',
  defaults: {
    riderExtrasItems: [],
    nightLeads: [],
    selectedScanner: null,
    scanFolder: null, // Will default to ~/Documents/NightclubScans if not set
    reportFolder: null, // Will default to ~/Documents/NightclubReports if not set
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

module.exports = store;

