const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const { app } = require('electron');
const { PDFDocument } = require('pdf-lib');

/**
 * IPC Handlers for Settings Management
 * Handles tech names, templates, and folder management
 */

function registerSettingsHandlers(ipcMain, store, mainWindow, dialog, shell, shiftDataStore) {
  // IPC Handlers for saved Tech Names (settings object for form pre-fill; distinct from tech person catalog)
  ipcMain.handle('get-saved-tech-names', () => {
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
    const isGaesteliste = templateKey === 'gaesteliste';
    const result = await dialog.showOpenDialog(mainWindow, {
      title: isGaesteliste ? 'Gästeliste Excel-Datei auswählen' : 'Template PDF auswählen',
      filters: isGaesteliste
        ? [
            { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        : [
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

  ipcMain.handle('open-gaesteliste', async () => {
    const templates = store.get('templates', {});
    const filePath = templates.gaesteliste;
    if (!filePath || filePath.trim() === '') {
      throw new Error('Keine Gästeliste-Datei hinterlegt. Bitte in den Einstellungen unter Templates eine Excel-Datei auswählen.');
    }
    try {
      await fs.access(filePath);
    } catch (err) {
      throw new Error(`Gästeliste-Datei nicht gefunden: ${filePath}`);
    }
    const error = await shell.openPath(filePath);
    if (error) {
      throw new Error(`Datei konnte nicht geöffnet werden: ${error}`);
    }
    return { success: true };
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

    // Create a visible popup window to show the PDF with print button
    return new Promise((resolve, reject) => {
      const { BrowserWindow } = require('electron');
      const printWindow = new BrowserWindow({
        width: 900,
        height: 700,
        show: false, // Show after content loads
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: false, // Disable for simpler IPC
          plugins: true // Enable PDF plugin support
        },
        parent: mainWindow, // Make it a child window
        modal: false
      });

      // Create HTML content with PDF viewer (no toolbar - PDF viewer has its own UI)
      const fileUrl = `file://${templatePath.replace(/\\/g, '/')}`;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            embed, iframe {
              width: 100%;
              height: 100vh;
              border: none;
            }
          </style>
        </head>
        <body>
          <embed src="${fileUrl}" type="application/pdf" />
        </body>
        </html>
      `;

      // Write HTML to temp file and load it
      const tempDir = app.getPath('temp');
      const tempHtmlPath = path.join(tempDir, 'temp-pdf-viewer.html');
      fs.writeFile(tempHtmlPath, htmlContent, 'utf8')
        .then(() => {
          printWindow.loadFile(tempHtmlPath);
          
          // Show window when ready
          printWindow.once('ready-to-show', () => {
            printWindow.show();
          });

          let isResolved = false;

          // Handle window close
          printWindow.on('closed', () => {
            // Clean up temp file
            fs.unlink(tempHtmlPath).catch(() => {});
            if (!isResolved) {
              isResolved = true;
              resolve({ success: false, cancelled: true });
            }
          });

          // Handle errors
          printWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
            if (isResolved) return;
            isResolved = true;
            printWindow.close();
            reject(new Error(`Fehler beim Laden des Templates: ${errorDescription}`));
          });
        })
        .catch((error) => {
          printWindow.close();
          reject(new Error(`Fehler beim Erstellen der Vorschau: ${error.message}`));
        });
    });
  });

  // IPC Handler to merge and print all templates
  ipcMain.handle('print-all-templates', async (event) => {
    const templates = store.get('templates', {});
    
    // Get all available template paths
    const templateKeys = ['securityzettel', 'handtuchzettel', 'technikzettel', 'uebersichtzettel'];
    const templatePaths = [];
    
    for (const key of templateKeys) {
      const templatePath = templates[key];
      if (templatePath) {
        try {
          await fs.access(templatePath);
          templatePaths.push(templatePath);
        } catch (error) {
          console.warn(`Template ${key} nicht gefunden: ${templatePath}`);
        }
      }
    }

    if (templatePaths.length === 0) {
      throw new Error('Keine Templates zum Drucken gefunden. Bitte laden Sie Templates in den Einstellungen hoch.');
    }

    try {
      // Merge all PDFs into one
      const mergedPdf = await PDFDocument.create();
      
      for (const templatePath of templatePaths) {
        const pdfBytes = await fs.readFile(templatePath);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      // Save merged PDF to temp file
      const mergedPdfBytes = await mergedPdf.save();
      const tempDir = app.getPath('temp');
      const tempMergedPath = path.join(tempDir, 'temp-merged-templates.pdf');
      await fs.writeFile(tempMergedPath, mergedPdfBytes);

      // Show merged PDF in popup (same as print-template)
      return new Promise((resolve, reject) => {
        const { BrowserWindow } = require('electron');
        const printWindow = new BrowserWindow({
          width: 900,
          height: 700,
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            plugins: true
          },
          parent: mainWindow,
          modal: false
        });

        const fileUrl = `file://${tempMergedPath.replace(/\\/g, '/')}`;
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
              embed, iframe {
                width: 100%;
                height: 100vh;
                border: none;
              }
            </style>
          </head>
          <body>
            <embed src="${fileUrl}" type="application/pdf" />
          </body>
          </html>
        `;

        const tempHtmlPath = path.join(tempDir, 'temp-pdf-viewer.html');
        fs.writeFile(tempHtmlPath, htmlContent, 'utf8')
          .then(() => {
            printWindow.loadFile(tempHtmlPath);
            
            printWindow.once('ready-to-show', () => {
              printWindow.show();
            });

            let isResolved = false;

            printWindow.on('closed', () => {
              // Clean up temp files
              fs.unlink(tempHtmlPath).catch(() => {});
              fs.unlink(tempMergedPath).catch(() => {});
              if (!isResolved) {
                isResolved = true;
                resolve({ success: false, cancelled: true });
              }
            });

            printWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
              if (isResolved) return;
              isResolved = true;
              printWindow.close();
              reject(new Error(`Fehler beim Laden des zusammengeführten PDFs: ${errorDescription}`));
            });
          })
          .catch((error) => {
            printWindow.close();
            reject(new Error(`Fehler beim Erstellen der Vorschau: ${error.message}`));
          });
      });
    } catch (error) {
      throw new Error(`Fehler beim Zusammenführen der PDFs: ${error.message}`);
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

  // IPC Handlers for Einkaufsbelege Folder
  ipcMain.handle('set-einkaufsbelege-folder', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Einkaufsbelege Ordner auswählen',
      properties: ['openDirectory']
    });
    
    if (filePaths && filePaths.length > 0) {
      store.set('einkaufsbelegeFolder', filePaths[0]);
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('get-einkaufsbelege-folder', () => {
    return store.get('einkaufsbelegeFolder', null);
  });

  // Wage options list (e.g. ["25 €/h", "30 €/h"])
  ipcMain.handle('get-wage-options', () => {
    return store.get('wageOptions', []);
  });

  ipcMain.handle('save-wage-options', (event, options) => {
    store.set('wageOptions', Array.isArray(options) ? options : []);
    return true;
  });

  // Person wage = selected option from wageOptions, keyed by name
  ipcMain.handle('get-person-wage', (event, name) => {
    const wages = store.get('personWages', {});
    const key = (name || '').trim();
    return key ? (wages[key] ?? '') : '';
  });

  ipcMain.handle('get-person-wages', () => {
    return store.get('personWages', {});
  });

  ipcMain.handle('set-person-wage', (event, name, wageOption) => {
    const key = (name || '').trim();
    if (!key) return;
    const wages = store.get('personWages', {});
    wages[key] = (wageOption == null ? '' : String(wageOption).trim());
    store.set('personWages', wages);
    return true;
  });

  // IPC Handlers for Excel Zeiterfassung Folder
  ipcMain.handle('set-zeiterfassung-excel-folder', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Excel Zeiterfassung Ordner auswählen',
      properties: ['openDirectory']
    });

    if (filePaths && filePaths.length > 0) {
      store.set('zeiterfassungExcelFolder', filePaths[0]);
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('get-zeiterfassung-excel-folder', () => {
    return store.get('zeiterfassungExcelFolder', null);
  });

  // IPC Handlers for Catering Prices
  ipcMain.handle('get-catering-prices', () => {
    return store.get('cateringPrices', {
      warmPerPerson: '',
      coldPerPerson: ''
    });
  });

  ipcMain.handle('save-catering-prices', (event, prices) => {
    store.set('cateringPrices', prices);
    return true;
  });

  // IPC Handlers for Pauschale Prices
  ipcMain.handle('get-pauschale-prices', () => {
    return store.get('pauschalePrices', {
      standard: '',
      longdrinks: '',
      shots: ''
    });
  });

  ipcMain.handle('save-pauschale-prices', (event, prices) => {
    store.set('pauschalePrices', prices);
    return true;
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
      store.set('einkaufsbelegeFolder', null);
      store.set('zeiterfassungExcelFolder', null);
      store.set('wageOptions', []);
      store.set('personWages', {});
      store.set('techNames', {
        soundEngineerName: '',
        lightingTechName: ''
      });
      store.set('templates', {
        securityzettel: null,
        handtuchzettel: null,
        technikzettel: null,
        uebersichtzettel: null,
        gaesteliste: null
      });
      store.set('bestueckungLists', {
        'standard-konzert': [],
        'standard-tranzit': []
      });
      store.set('bestueckungTotalPrices', {
        'standard-konzert': '',
        'standard-tranzit': ''
      });
      store.set('bestueckungPricingTypes', {
        'standard-konzert': 'pauschale',
        'standard-tranzit': 'pauschale'
      });
      store.set('cateringPrices', {
        warmPerPerson: '',
        coldPerPerson: ''
      });
      store.set('pauschalePrices', {
        standard: '',
        longdrinks: '',
        sektCocktails: '',
        shots: ''
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

