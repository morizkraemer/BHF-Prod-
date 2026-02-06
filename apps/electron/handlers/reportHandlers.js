const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');
const { generateReportPDF } = require('../utils/pdfGenerator');
const { PDFDocument } = require('pdf-lib');
const { getLanFormRegistry, getFormById } = require('../server/lanFormRegistry');
const api = require('../api/client');

/**
 * IPC Handlers for Report Generation
 * Handles close-shift and report generation
 */

/**
 * Converts a string to camelCase folder name
 * Removes invalid characters, removes spaces, and converts to camelCase
 * @param {string} str - The string to convert
 * @returns {string} - The camelCase string
 */
function toCamelCaseFolderName(str) {
  if (!str) return 'unbekanntesEvent';
  
  // Remove invalid characters and replace with underscore
  let sanitized = str.replace(/[<>:"/\\|?*]/g, '_');
  
  // Split by spaces, underscores, and hyphens, then convert to camelCase
  const words = sanitized.split(/[\s_\-]+/).filter(word => word.length > 0);
  
  if (words.length === 0) return 'unbekanntesEvent';
  
  // First word lowercase, rest capitalize first letter
  const camelCase = words.map((word, index) => {
    const lowerWord = word.toLowerCase();
    if (index === 0) {
      return lowerWord;
    }
    return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
  }).join('');
  
  return camelCase;
}

/**
 * Determines the section name based on the source and scanName
 * @param {string} source - The source section (e.g., 'tontechniker', 'secu', 'kassen', 'rider-extras', 'gaeste')
 * @param {string} scanName - The scanName from the document
 * @returns {string} - The section name
 */
function getSectionName(source, scanName) {
  if (source === 'tontechniker') {
    return 'Technik';
  }
  if (source === 'secu') {
    return 'Security';
  }
  if (source === 'kassen') {
    if (scanName === 'Abrechnungen') {
      return 'Abrechnungen';
    }
    return 'Belege';
  }
  if (source === 'rider-extras') {
    if (scanName === 'Handtuchzettel') {
      return 'Handtucher';
    }
    if (scanName === 'Einkaufsbeleg') {
      return 'Einkaufsbelege';
    }
    if (scanName === 'Buyout Quittung') {
      return 'Buyout Quittung';
    }
    // Default for other rider-extras scans
    return 'Handtucher';
  }
  if (source === 'gaeste') {
    return 'Agentur';
  }
  // Default fallback
  return 'Belege';
}

/**
 * Merges multiple PDFs into one PDF
 * @param {string[]} pdfPaths - Array of file paths to PDFs
 * @returns {Promise<Buffer>} - Merged PDF as buffer
 */
async function mergePDFs(pdfPaths) {
  const mergedPdf = await PDFDocument.create();
  
  for (const pdfPath of pdfPaths) {
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (error) {
      console.warn(`Could not merge PDF ${pdfPath}:`, error.message);
      // Continue with other PDFs
    }
  }
  
  return await mergedPdf.save();
}

function registerReportHandlers(ipcMain, store) {
  // IPC Handler for close-shift – API first when serverUrl set; else local report/Excel
  ipcMain.handle('close-shift', async (event, formData) => {
    try {
      const serverUrl = (store.get('serverUrl', '') || '').trim();
      if (serverUrl) {
        try {
          const currentEvent = await api.getCurrentEventFull(serverUrl);
          if (currentEvent && currentEvent.id) {
            const result = await api.closeEvent(serverUrl, currentEvent.id, formData);
            return {
              success: true,
              eventFolder: (result && result.eventFolder) ? result.eventFolder : '',
              pdfPath: (result && result.eventFolder) ? result.eventFolder : '',
              scannedPDFsCount: 0
            };
          }
        } catch (apiErr) {
          console.warn('Close-shift API failed, falling back to local:', apiErr.message);
        }
      }

      // Local close-shift: report folder, PDF, section PDFs, Excel
      // Get report folder from settings or use default
      let reportBaseFolder = store.get('reportFolder', null);
      if (!reportBaseFolder) {
        reportBaseFolder = path.join(app.getPath('documents'), 'NightclubReports');
      }
      
      // Create base folder if it doesn't exist
      await fs.mkdir(reportBaseFolder, { recursive: true });
      
      // Get event info for folder name
      const uebersicht = formData.uebersicht || {};
      const eventName = uebersicht.eventName || 'Unbekanntes Event';
      const eventDate = uebersicht.date || new Date().toISOString().split('T')[0];
      
      // Convert to camelCase folder name (remove invalid characters and spaces)
      const sanitizedEventName = toCamelCaseFolderName(eventName);
      const eventFolderName = `${eventDate}_${sanitizedEventName}`;
      const eventFolderPath = path.join(reportBaseFolder, eventFolderName);
      
      // Create event folder
      await fs.mkdir(eventFolderPath, { recursive: true });
      
      // Get catering and bestueckung settings: from API when serverUrl set (viewer-managed), else from store
      const defaultBestueckungPrices = () => ({ 'leer': '', 'abgeschlossen': '', 'standard-konzert': '', 'standard-tranzit': '' });
      const defaultBestueckungTypes = () => ({ 'leer': 'pauschale', 'abgeschlossen': 'pauschale', 'standard-konzert': 'pauschale', 'standard-tranzit': 'pauschale' });
      let cateringPrices = store.get('cateringPrices', { warmPerPerson: '', coldPerPerson: '' });
      let bestueckungTotalPrices = { ...defaultBestueckungPrices(), ...store.get('bestueckungTotalPrices', defaultBestueckungPrices()) };
      let bestueckungPricingTypes = { ...defaultBestueckungTypes(), ...store.get('bestueckungPricingTypes', defaultBestueckungTypes()) };
      if (serverUrl) {
        try {
          const all = await api.getSettings(serverUrl);
          if (all && all.cateringPrices != null) cateringPrices = { warmPerPerson: '', coldPerPerson: '', ...all.cateringPrices };
          if (all && all.bestueckungTotalPrices != null) bestueckungTotalPrices = { ...defaultBestueckungPrices(), ...all.bestueckungTotalPrices };
          if (all && all.bestueckungPricingTypes != null) bestueckungPricingTypes = { ...defaultBestueckungTypes(), ...all.bestueckungPricingTypes };
        } catch (e) {
          // keep store values
        }
      }

      // Get pauschale prices from settings store (Electron-only)
      const pauschalePrices = store.get('pauschalePrices', {
        standard: '',
        longdrinks: '',
        shots: ''
      });
      
      // Get rider items for resolving riderItemId -> name/price in report
      let riderItems = [];
      if (serverUrl) {
        try {
          riderItems = await api.getRiderItems(serverUrl) || [];
        } catch (e) {
          riderItems = store.get('riderExtrasItems', []);
        }
      } else {
        riderItems = store.get('riderExtrasItems', []);
      }

      // Add settings data to formData for PDF generation
      const formDataWithSettings = {
        ...formData,
        cateringPrices: cateringPrices,
        pauschalePrices: pauschalePrices,
        bestueckungTotalPrices: bestueckungTotalPrices,
        bestueckungPricingTypes: bestueckungPricingTypes,
        riderItems: riderItems
      };
      
      // Generate PDF
      const pdfBuffer = await generateReportPDF(formDataWithSettings);
      const pdfFileName = `report-${eventDate}-${sanitizedEventName}.pdf`;
      const pdfPath = path.join(eventFolderPath, pdfFileName);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Collect all scanned PDFs from all sections with metadata
      const scannedDocs = [];
      
      // From Ton/Lichttechnik
      if (formData.tontechniker?.scannedImages) {
        formData.tontechniker.scannedImages.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'tontechniker',
              scanName: doc.scanName || 'Technikzettel'
            });
          }
        });
      }
      
      // From Secu
      if (formData.secu?.scannedDocuments) {
        formData.secu.scannedDocuments.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'secu',
              scanName: doc.scanName || 'Securityzettel'
            });
          }
        });
      }

      // From LAN form submissions (Secu, future Ton/Licht, Extern – stored in temp scan folder)
      let scanFolder = store.get('scanFolder', null);
      if (!scanFolder) {
        scanFolder = path.join(app.getPath('documents'), 'NightclubScans');
      }
      const lanFormRegistry = getLanFormRegistry();
      for (const formEntry of lanFormRegistry) {
        const formDir = path.join(scanFolder, formEntry.folderName, eventDate);
        try {
          const entries = await fs.readdir(formDir, { withFileTypes: true });
          for (const ent of entries) {
            if (ent.isFile() && ent.name.toLowerCase().endsWith('.pdf')) {
              scannedDocs.push({
                filePath: path.join(formDir, ent.name),
                source: formEntry.source,
                scanName: formEntry.scanName
              });
            }
          }
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.warn(`${formEntry.folderName} folder read error:`, err.message);
          }
        }
      }

      // From Kassen - Belege
      if (formData.kassen?.receipts) {
        formData.kassen.receipts.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'kassen',
              scanName: doc.scanName || 'Kassen-Belege'
            });
          }
        });
      }
      
      // From Kassen - Abrechnungen
      if (formData.kassen?.abrechnungen) {
        formData.kassen.abrechnungen.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'kassen',
              scanName: doc.scanName || 'Abrechnungen'
            });
          }
        });
      }
      
      // From Hospitality - scannedDocuments (Handtuchzettel)
      if (formData['rider-extras']?.scannedDocuments) {
        formData['rider-extras'].scannedDocuments.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'rider-extras',
              scanName: doc.scanName || 'Handtuchzettel'
            });
          }
        });
      }
      
      // From Hospitality - purchaseReceipts (Einkaufsbelege)
      // Get payment status from shiftNotes
      const einkaufsbelegPaid = formData.shiftNotes?.einkaufsbelegPaid;
      if (formData['rider-extras']?.purchaseReceipts) {
        formData['rider-extras'].purchaseReceipts.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'rider-extras',
              scanName: doc.scanName || 'Einkaufsbeleg',
              einkaufsbelegPaid: einkaufsbelegPaid // Pass payment status with the document
            });
          }
        });
      }
      
      // From Hospitality - buyoutQuittungDocuments (Buyout Quittung)
      if (formData['rider-extras']?.buyoutQuittungDocuments) {
        formData['rider-extras'].buyoutQuittungDocuments.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'rider-extras',
              scanName: doc.scanName || 'Buyout Quittung'
            });
          }
        });
      }
      
      // From Gäste
      if (formData.gaeste?.scannedDocuments) {
        formData.gaeste.scannedDocuments.forEach(doc => {
          if (doc.filePath) {
            scannedDocs.push({
              filePath: doc.filePath,
              source: 'gaeste',
              scanName: doc.scanName || 'Agenturzettel'
            });
          }
        });
      }
      
      // Generate date string for file naming (YYYY-MM-DD format)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Group scans by scanName
      const scansByScanName = {};
      scannedDocs.forEach(doc => {
        const key = doc.scanName || 'unknown';
        if (!scansByScanName[key]) {
          scansByScanName[key] = [];
        }
        scansByScanName[key].push(doc);
      });
      
      // Process each group of scans
      for (const [scanName, docs] of Object.entries(scansByScanName)) {
        if (docs.length === 0) continue;
        
        // Check if this is an Einkaufsbeleg and get payment status
        const isEinkaufsbeleg = scanName === 'Einkaufsbeleg' || scanName.toLowerCase().includes('einkaufsbeleg');
        const einkaufsbelegPaidStatus = docs[0].einkaufsbelegPaid;
        
        // Check if this is a Buyout Quittung
        const isBuyoutQuittung = scanName === 'Buyout Quittung' || scanName.toLowerCase().includes('buyout quittung');
        
        // Handle Einkaufsbeleg separately based on payment status
        if (isEinkaufsbeleg && einkaufsbelegPaidStatus === true) {
          // Paid: Copy to einkaufsbelege folder (year-month structure)
          try {
            const einkaufsbelegeFolder = store.get('einkaufsbelegeFolder', null);
            if (einkaufsbelegeFolder) {
              // Get current date for year-month folder and filename
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const yearMonthFolder = path.join(einkaufsbelegeFolder, `${year}-${month}`);
              
              // Create year-month folder if it doesn't exist
              await fs.mkdir(yearMonthFolder, { recursive: true });
              
              // Process each document
              for (const doc of docs) {
                // Create filename: yyyy-mm-dd-bezahlt.pdf
                let baseFilename = `${year}-${month}-${day}-bezahlt.pdf`;
                let destPath = path.join(yearMonthFolder, baseFilename);
                
                // Check if file already exists and create unique name if needed
                let finalDestPath = destPath;
                let counter = 1;
                while (true) {
                  try {
                    await fs.access(finalDestPath);
                    // If file exists, add counter: yyyy-mm-dd-bezahlt_1.pdf, etc.
                    const nameWithoutExt = `${year}-${month}-${day}-bezahlt`;
                    finalDestPath = path.join(yearMonthFolder, `${nameWithoutExt}_${counter}.pdf`);
                    counter++;
                  } catch {
                    break;
                  }
                }
                
                await fs.copyFile(doc.filePath, finalDestPath);
                console.log('Einkaufsbeleg (paid) copied to:', finalDestPath);
              }
            }
          } catch (error) {
            console.warn('Error copying paid Einkaufsbeleg to folder:', error.message);
          }
          
          // Delete original files from temporary folder
          for (const doc of docs) {
            try {
              await fs.unlink(doc.filePath);
            } catch (deleteError) {
              console.warn(`Could not delete original file ${doc.filePath}:`, deleteError.message);
            }
          }
          
          // Skip normal processing for paid einkaufsbeleg
          continue;
        }
        
        // Handle unpaid Einkaufsbeleg - copy to einkaufsbelege folder, then also save to report folder
        if (isEinkaufsbeleg && einkaufsbelegPaidStatus === false) {
          // Unpaid: Copy to einkaufsbelege folder (year-month structure) with date-only format
          try {
            const einkaufsbelegeFolder = store.get('einkaufsbelegeFolder', null);
            if (einkaufsbelegeFolder) {
              // Get current date for year-month folder and filename
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const yearMonthFolder = path.join(einkaufsbelegeFolder, `${year}-${month}`);
              
              // Create year-month folder if it doesn't exist
              await fs.mkdir(yearMonthFolder, { recursive: true });
              
              // Process each document
              for (const doc of docs) {
                // Create filename: yyyy-mm-dd.pdf (unpaid, no "bezahlt" suffix)
                let baseFilename = `${year}-${month}-${day}.pdf`;
                let destPath = path.join(yearMonthFolder, baseFilename);
                
                // Check if file already exists and create unique name if needed
                let finalDestPath = destPath;
                let counter = 1;
                while (true) {
                  try {
                    await fs.access(finalDestPath);
                    // If file exists, add counter: yyyy-mm-dd_1.pdf, etc.
                    const nameWithoutExt = `${year}-${month}-${day}`;
                    finalDestPath = path.join(yearMonthFolder, `${nameWithoutExt}_${counter}.pdf`);
                    counter++;
                  } catch {
                    break;
                  }
                }
                
                await fs.copyFile(doc.filePath, finalDestPath);
                console.log('Einkaufsbeleg (unpaid) copied to:', finalDestPath);
              }
            }
          } catch (error) {
            console.warn('Error copying unpaid Einkaufsbeleg to folder:', error.message);
          }
          
          // Continue to normal processing to also save to report folder
          // (original files will be deleted after saving to report folder)
        }
        
        // Handle Buyout Quittung - copy to einkaufsbelege folder, then also save to report folder
        if (isBuyoutQuittung) {
          try {
            const einkaufsbelegeFolder = store.get('einkaufsbelegeFolder', null);
            if (einkaufsbelegeFolder) {
              // Get current date for year-month folder
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const yearMonthFolder = path.join(einkaufsbelegeFolder, `${year}-${month}`);
              
              // Create year-month folder if it doesn't exist
              await fs.mkdir(yearMonthFolder, { recursive: true });
              
              // Process each document
              for (const doc of docs) {
                const filename = path.basename(doc.filePath);
                const destPath = path.join(yearMonthFolder, filename);
                
                // Check if file already exists and create unique name if needed
                let finalDestPath = destPath;
                let counter = 1;
                while (true) {
                  try {
                    await fs.access(finalDestPath);
                    const nameWithoutExt = path.basename(filename, '.pdf');
                    finalDestPath = path.join(yearMonthFolder, `${nameWithoutExt}_${counter}.pdf`);
                    counter++;
                  } catch {
                    break;
                  }
                }
                
                await fs.copyFile(doc.filePath, finalDestPath);
                console.log('Buyout Quittung copied to:', finalDestPath);
              }
            }
          } catch (error) {
            console.warn('Error copying Buyout Quittung to folder:', error.message);
          }
          
          // Continue to normal processing to also save to report folder
          // (original files will be deleted after saving to report folder)
        }
        
        // Get section name from first document (all in group have same source)
        const section = getSectionName(docs[0].source, docs[0].scanName);
        
        // Create filename: {section}-{date}-{eventname}.pdf
        // For unpaid einkaufsbeleg, prefix with UNBEZAHLT_EINKAUFSBELEG_
        let fileName;
        if (isEinkaufsbeleg && einkaufsbelegPaidStatus === false) {
          fileName = `UNBEZAHLT_EINKAUFSBELEG_${section}-${dateStr}-${sanitizedEventName}.pdf`;
        } else {
          fileName = `${section}-${dateStr}-${sanitizedEventName}.pdf`;
        }
        let destPath = path.join(eventFolderPath, fileName);
        
        // Check if destination file already exists and create unique name if needed
        let finalDestPath = destPath;
        let counter = 1;
        while (true) {
          try {
            await fs.access(finalDestPath);
            // File exists, add counter
            const nameWithoutExt = path.basename(fileName, '.pdf');
            finalDestPath = path.join(eventFolderPath, `${nameWithoutExt}_${counter}.pdf`);
            counter++;
          } catch {
            // File doesn't exist, use this path
            break;
          }
        }
        
        try {
          // If multiple scans, merge them; otherwise just copy
          if (docs.length > 1) {
            // Merge multiple PDFs
            const pdfPaths = docs.map(doc => doc.filePath).filter(p => p);
            const mergedPdfBuffer = await mergePDFs(pdfPaths);
            await fs.writeFile(finalDestPath, mergedPdfBuffer);
          } else {
            // Single PDF, just copy
            await fs.copyFile(docs[0].filePath, finalDestPath);
          }
          
          // Delete original files from temporary folder
          for (const doc of docs) {
            try {
              await fs.unlink(doc.filePath);
            } catch (deleteError) {
              console.warn(`Could not delete original file ${doc.filePath}:`, deleteError.message);
              // Continue even if deletion fails
            }
          }
        } catch (error) {
          console.warn(`Could not process scans for ${scanName}:`, error.message);
          // Continue with other scan groups
        }
      }
      
      // Count consolidated PDFs (one per scanName group)
      const consolidatedPDFsCount = Object.keys(scansByScanName).length;

      // Remove LAN form PDFs from temp scan folder after merge
      for (const formEntry of lanFormRegistry) {
        try {
          const formDirToClean = path.join(scanFolder, formEntry.folderName, eventDate);
          const cleanEntries = await fs.readdir(formDirToClean, { withFileTypes: true });
          for (const ent of cleanEntries) {
            if (ent.isFile() && ent.name.toLowerCase().endsWith('.pdf')) {
              await fs.unlink(path.join(formDirToClean, ent.name));
            }
          }
          await fs.rmdir(formDirToClean).catch(() => {});
        } catch (cleanErr) {
          if (cleanErr.code !== 'ENOENT') {
            console.warn(`${formEntry.folderName} cleanup error:`, cleanErr.message);
          }
        }
      }

      return {
        success: true,
        eventFolder: eventFolderPath,
        pdfPath: pdfPath,
        scannedPDFsCount: consolidatedPDFsCount
      };
    } catch (error) {
      console.error('Error closing shift:', error);
      throw new Error('Fehler beim Schließen des Shifts: ' + error.message);
    }
  });

  // List PDFs from a LAN form type for a given date – for display in app (temp scan folder)
  ipcMain.handle('get-lan-form-pdfs', async (event, formTypeId, date) => {
    const eventDate = typeof date === 'string' && date.trim() ? date.trim() : null;
    if (!eventDate) return [];
    const formEntry = getFormById(formTypeId);
    if (!formEntry) return [];
    let scanFolder = store.get('scanFolder', null);
    if (!scanFolder) {
      scanFolder = path.join(app.getPath('documents'), 'NightclubScans');
    }
    const formDir = path.join(scanFolder, formEntry.folderName, eventDate);
    try {
      const entries = await fs.readdir(formDir, { withFileTypes: true });
      const result = [];
      for (const ent of entries) {
        if (ent.isFile() && ent.name.toLowerCase().endsWith('.pdf')) {
          const filePath = path.join(formDir, ent.name);
          result.push({
            id: 'webform-' + filePath,
            filePath,
            filename: ent.name,
            scanName: formEntry.scanName,
            type: 'pdf',
            readOnly: true,
          });
        }
      }
      return result;
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      console.warn(`LAN form ${formTypeId} PDFs list error:`, err.message);
      return [];
    }
  });

  // Delete a LAN form PDF file (e.g. web form PDF) – only allows paths under scanFolder/<folderName>/
  ipcMain.handle('delete-lan-form-pdf', async (event, filePath) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return { ok: false, error: 'Ungültiger Pfad.' };
    }
    const normalizedPath = path.normalize(filePath.trim());
    let scanFolder = store.get('scanFolder', null);
    if (!scanFolder) {
      scanFolder = path.join(app.getPath('documents'), 'NightclubScans');
    }
    const scanFolderResolved = path.resolve(scanFolder);
    const fileResolved = path.resolve(normalizedPath);
    if (!fileResolved.startsWith(scanFolderResolved + path.sep) && fileResolved !== scanFolderResolved) {
      return { ok: false, error: 'Datei liegt nicht im Scan-Ordner.' };
    }
    const registry = getLanFormRegistry();
    const relativeToScan = path.relative(scanFolderResolved, fileResolved);
    const parts = relativeToScan.split(path.sep);
    const folderName = parts[0];
    const isAllowedFolder = registry.some((f) => f.folderName === folderName);
    if (!isAllowedFolder || parts.length < 2) {
      return { ok: false, error: 'Datei liegt nicht in einem LAN-Formular-Ordner.' };
    }
    if (!fileResolved.toLowerCase().endsWith('.pdf')) {
      return { ok: false, error: 'Nur PDF-Dateien können gelöscht werden.' };
    }
    try {
      await fs.unlink(fileResolved);
      return { ok: true };
    } catch (err) {
      if (err.code === 'ENOENT') return { ok: true };
      console.warn('delete-lan-form-pdf error:', err.message);
      return { ok: false, error: err.message || 'Löschen fehlgeschlagen.' };
    }
  });
}

module.exports = { registerReportHandlers };

