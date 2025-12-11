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
  scanDocument: () => ipcRenderer.invoke('scan-document'),
  
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

