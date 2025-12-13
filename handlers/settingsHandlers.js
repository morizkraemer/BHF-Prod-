const fs = require('fs').promises;

/**
 * IPC Handlers for Settings Management
 * Handles tech names, templates, and folder management
 */

function registerSettingsHandlers(ipcMain, store, mainWindow, dialog, shell, shiftDataStore) {
  // IPC Handlers for Tech Names
  ipcMain.handle('get-tech-names', () => {
    return store.get('techNames', {
      soundEngineerName: '',
      lightingTechName: ''
    });
  });

  ipcMain.handle('save-tech-names', (event, names) => {
    store.set('techNames', names);
    return true;
  });

  // Template management
  ipcMain.handle('get-template', (event, templateKey) => {
    const templates = store.get('templates', {});
    return templates[templateKey] || null;
  });

  ipcMain.handle('set-template', async (event, templateKey, filePath) => {
    const templates = store.get('templates', {});
    templates[templateKey] = filePath;
    store.set('templates', templates);
    return true;
  });

  ipcMain.handle('upload-template', async (event, templateKey) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Template PDF auswählen',
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const templates = store.get('templates', {});
      templates[templateKey] = filePath;
      store.set('templates', templates);
      return { success: true, filePath };
    }
    
    return { success: false };
  });

  ipcMain.handle('print-template', async (event, templateKey) => {
    const templates = store.get('templates', {});
    const templatePath = templates[templateKey];
    
    if (!templatePath) {
      throw new Error(`Kein Template für ${templateKey} gefunden. Bitte laden Sie ein Template in den Einstellungen hoch.`);
    }

    // Check if file exists
    try {
      await fs.access(templatePath);
    } catch (error) {
      throw new Error(`Template-Datei nicht gefunden: ${templatePath}`);
    }

    // Use Electron's webContents.printToPDF or shell.openPath with print dialog
    // For now, we'll use shell.openPath which opens the PDF and user can print manually
    // Or we can use a better approach with webContents.printToPDF
    try {
      // Open PDF in default viewer, which allows printing
      await shell.openPath(templatePath);
      return { success: true };
    } catch (error) {
      throw new Error(`Fehler beim Öffnen des Templates: ${error.message}`);
    }
  });

  // IPC Handlers for Scan Folder
  ipcMain.handle('set-scan-folder', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Scan-Ordner auswählen',
      properties: ['openDirectory']
    });
    
    if (filePaths && filePaths.length > 0) {
      store.set('scanFolder', filePaths[0]);
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('get-scan-folder', () => {
    return store.get('scanFolder', null);
  });

  // IPC Handlers for Report Folder
  ipcMain.handle('set-report-folder', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Report-Ordner auswählen',
      properties: ['openDirectory']
    });
    
    if (filePaths && filePaths.length > 0) {
      store.set('reportFolder', filePaths[0]);
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('get-report-folder', () => {
    return store.get('reportFolder', null);
  });

  // Reset all settings and data
  ipcMain.handle('reset-all-data', async () => {
    try {
      // Clear settings store and reset to defaults
      store.clear();
      store.set('riderExtrasItems', []);
      store.set('nightLeads', []);
      store.set('selectedScanner', null);
      store.set('scanFolder', null);
      store.set('reportFolder', null);
      store.set('techNames', {
        soundEngineerName: '',
        lightingTechName: ''
      });
      store.set('templates', {
        securityzettel: null,
        handtuchzettel: null,
        technikzettel: null,
        uebersichtzettel: null
      });
      store.set('bestueckungLists', {
        'standard-konzert': [],
        'standard-tranzit': []
      });

      // Clear shift data store and reset to defaults
      if (shiftDataStore) {
        shiftDataStore.clear();
        shiftDataStore.set('currentShiftData', null);
        shiftDataStore.set('currentPhase', 'VVA');
      }

      return { success: true };
    } catch (error) {
      console.error('Error resetting all data:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerSettingsHandlers };

