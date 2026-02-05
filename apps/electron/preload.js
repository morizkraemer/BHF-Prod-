const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object.
// Same IPC API for both local (electron-store) and API-backed (serverUrl set) modes.
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  
  // PDF operations
  generatePDF: (data) => ipcRenderer.invoke('generate-pdf', data),
  closeShift: (formData) => ipcRenderer.invoke('close-shift', formData),
  getSecuWebFormPdfs: (date) => ipcRenderer.invoke('get-lan-form-pdfs', 'secu', date),
  getLanFormPdfs: (formTypeId, date) => ipcRenderer.invoke('get-lan-form-pdfs', formTypeId, date),
  deleteLanFormPdf: (filePath) => ipcRenderer.invoke('delete-lan-form-pdf', filePath),
  
  // Server URL (backend API)
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  setServerUrl: (url) => ipcRenderer.invoke('set-server-url', url),

  // Scanner operations
  listScanners: () => ipcRenderer.invoke('list-scanners'),
  setSelectedScanner: (scannerId, scannerInfo) => ipcRenderer.invoke('set-selected-scanner', scannerId, scannerInfo),
  getSelectedScanner: () => ipcRenderer.invoke('get-selected-scanner'),
  getSelectedScannerInfo: () => ipcRenderer.invoke('get-selected-scanner-info'),
  checkScannerAvailability: () => ipcRenderer.invoke('check-scanner-availability'),
  setScanFolder: () => ipcRenderer.invoke('set-scan-folder'),
  getScanFolder: () => ipcRenderer.invoke('get-scan-folder'),
  setReportFolder: () => ipcRenderer.invoke('set-report-folder'),
  getReportFolder: () => ipcRenderer.invoke('get-report-folder'),
  setEinkaufsbelegeFolder: () => ipcRenderer.invoke('set-einkaufsbelege-folder'),
  getEinkaufsbelegeFolder: () => ipcRenderer.invoke('get-einkaufsbelege-folder'),
  scanDocument: (source = 'glass', scanName = 'scan') => ipcRenderer.invoke('scan-document', source, scanName),
  selectScanFile: () => ipcRenderer.invoke('select-scan-file'),
  checkScanInProgress: () => ipcRenderer.invoke('check-scan-in-progress'),
  checkScanFolder: (scanName) => ipcRenderer.invoke('check-scan-folder', scanName),
  copyEinkaufsbeleg: (filePath, scanName) => ipcRenderer.invoke('copy-einkaufsbeleg', filePath, scanName),
  readFileAsBase64: (filePath) => ipcRenderer.invoke('read-file-as-base64', filePath),
  
  // Scanner messages
  onScanMessage: (callback) => {
    ipcRenderer.on('scan-message', (event, data) => callback(data));
  },
  removeScanMessageListener: () => {
    ipcRenderer.removeAllListeners('scan-message');
  },
  // Auto-detected scan files
  onScanFileDetected: (callback) => {
    ipcRenderer.on('scan-file-detected', (event, data) => callback(data));
  },
  removeScanFileDetectedListener: () => {
    ipcRenderer.removeAllListeners('scan-file-detected');
  },
  
  // Data persistence
  saveData: (key, data) => ipcRenderer.invoke('save-data', key, data),
  loadData: (key) => ipcRenderer.invoke('load-data', key),
  clearShiftData: () => ipcRenderer.invoke('clear-shift-data'),
  
  // Item Catalog (Rider Extras)
  getRiderItems: () => ipcRenderer.invoke('get-rider-items'),
  addRiderItem: (item) => ipcRenderer.invoke('add-rider-item', item),
  updateRiderItem: (itemId, updates) => ipcRenderer.invoke('update-rider-item', itemId, updates),
  deleteRiderItem: (itemId) => ipcRenderer.invoke('delete-rider-item', itemId),
  
  // Catering Prices
  getCateringPrices: () => ipcRenderer.invoke('get-catering-prices'),
  saveCateringPrices: (prices) => ipcRenderer.invoke('save-catering-prices', prices),
  
  // Pauschale Prices
  getPauschalePrices: () => ipcRenderer.invoke('get-pauschale-prices'),
  savePauschalePrices: (prices) => ipcRenderer.invoke('save-pauschale-prices', prices),
  
  // Saved Tech Names (settings object for Ton/Licht form pre-fill)
  getSavedTechNames: () => ipcRenderer.invoke('get-saved-tech-names'),
  saveTechNames: (names) => ipcRenderer.invoke('save-tech-names', names),

  // Person name catalogs (each returns { id, name }[])
  getSecuNames: () => ipcRenderer.invoke('get-secu-names'),
  addSecuName: (name) => ipcRenderer.invoke('add-secu-name', name),
  getTechNames: () => ipcRenderer.invoke('get-tech-names'),
  addTechName: (name) => ipcRenderer.invoke('add-tech-name', name),
  getAndereMitarbeiterNames: () => ipcRenderer.invoke('get-andere-mitarbeiter-names'),
  addAndereMitarbeiterName: (name) => ipcRenderer.invoke('add-andere-mitarbeiter-name', name),

  getWageOptions: () => ipcRenderer.invoke('get-wage-options'),
  saveWageOptions: (options) => ipcRenderer.invoke('save-wage-options', options),
  getPersonWage: (name) => ipcRenderer.invoke('get-person-wage', name),
  getPersonWages: () => ipcRenderer.invoke('get-person-wages'),
  setPersonWage: (name, wageOption) => ipcRenderer.invoke('set-person-wage', name, wageOption),
  removePersonFromCatalogs: (name) => ipcRenderer.invoke('remove-person-from-catalogs', name),

  // Template management
  getTemplate: (templateKey) => ipcRenderer.invoke('get-template', templateKey),
  uploadTemplate: (templateKey) => ipcRenderer.invoke('upload-template', templateKey),
  printTemplate: (templateKey) => ipcRenderer.invoke('print-template', templateKey),
  printAllTemplates: () => ipcRenderer.invoke('print-all-templates'),
  openGaesteliste: () => ipcRenderer.invoke('open-gaesteliste'),
  
  // Bestückung Lists
  getBestueckungLists: () => ipcRenderer.invoke('get-bestueckung-lists'),
  getBestueckungList: (bestueckungKey) => ipcRenderer.invoke('get-bestueckung-list', bestueckungKey),
  saveBestueckungList: (bestueckungKey, items) => ipcRenderer.invoke('save-bestueckung-list', bestueckungKey, items),
  addBestueckungItem: (bestueckungKey, riderItemId, amount) => ipcRenderer.invoke('add-bestueckung-item', bestueckungKey, riderItemId, amount),
  updateBestueckungItem: (bestueckungKey, itemId, updates) => ipcRenderer.invoke('update-bestueckung-item', bestueckungKey, itemId, updates),
  deleteBestueckungItem: (bestueckungKey, itemId) => ipcRenderer.invoke('delete-bestueckung-item', bestueckungKey, itemId),
  getBestueckungTotalPrices: () => ipcRenderer.invoke('get-bestueckung-total-prices'),
  saveBestueckungTotalPrice: (bestueckungKey, price) => ipcRenderer.invoke('save-bestueckung-total-price', bestueckungKey, price),
  getBestueckungPricingTypes: () => ipcRenderer.invoke('get-bestueckung-pricing-types'),
  saveBestueckungPricingType: (bestueckungKey, pricingType) => ipcRenderer.invoke('save-bestueckung-pricing-type', bestueckungKey, pricingType),
  
  // Dialog operations
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showErrorBox: (title, content) => ipcRenderer.invoke('show-error-box', title, content),
  
  // Reset all data
  resetAllData: () => ipcRenderer.invoke('reset-all-data')
});

