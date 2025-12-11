const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  
  // PDF operations
  generatePDF: (data) => ipcRenderer.invoke('generate-pdf', data),
  
  // Scanner operations
  listScanners: () => ipcRenderer.invoke('list-scanners'),
  setSelectedScanner: (scannerId, scannerInfo) => ipcRenderer.invoke('set-selected-scanner', scannerId, scannerInfo),
  getSelectedScanner: () => ipcRenderer.invoke('get-selected-scanner'),
  setScanFolder: () => ipcRenderer.invoke('set-scan-folder'),
  getScanFolder: () => ipcRenderer.invoke('get-scan-folder'),
  scanDocument: (source = 'glass') => ipcRenderer.invoke('scan-document', source),
  selectScanFile: () => ipcRenderer.invoke('select-scan-file'),
  
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
  
  // Item Catalog (Rider Extras)
  getRiderItems: () => ipcRenderer.invoke('get-rider-items'),
  addRiderItem: (item) => ipcRenderer.invoke('add-rider-item', item),
  updateRiderItem: (itemId, updates) => ipcRenderer.invoke('update-rider-item', itemId, updates),
  deleteRiderItem: (itemId) => ipcRenderer.invoke('delete-rider-item', itemId),
  
  // Dialog operations
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showErrorBox: (title, content) => ipcRenderer.invoke('show-error-box', title, content)
});

