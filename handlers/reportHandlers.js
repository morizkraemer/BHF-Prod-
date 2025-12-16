const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');
const { generateReportPDF } = require('../utils/pdfGenerator');

/**
 * IPC Handlers for Report Generation
 * Handles close-shift and report generation
 */

function registerReportHandlers(ipcMain, store) {
  // IPC Handler for close-shift
  ipcMain.handle('close-shift', async (event, formData) => {
    try {
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
      
      // Sanitize folder name (remove invalid characters)
      const sanitizedEventName = eventName.replace(/[<>:"/\\|?*]/g, '_');
      const eventFolderName = `${eventDate}_${sanitizedEventName}`;
      const eventFolderPath = path.join(reportBaseFolder, eventFolderName);
      
      // Create event folder
      await fs.mkdir(eventFolderPath, { recursive: true });
      
      // Get catering prices from settings store
      const cateringPrices = store.get('cateringPrices', {
        warmPerPerson: '',
        coldPerPerson: ''
      });
      
      // Get pauschale prices from settings store
      const pauschalePrices = store.get('pauschalePrices', {
        standard: '',
        longdrinks: '',
        sektCocktails: '',
        shots: ''
      });
      
      // Get bestueckung total prices from settings store
      const bestueckungTotalPrices = store.get('bestueckungTotalPrices', {
        'standard-konzert': '',
        'standard-tranzit': ''
      });
      
      // Add settings data to formData for PDF generation
      const formDataWithSettings = {
        ...formData,
        cateringPrices: cateringPrices,
        pauschalePrices: pauschalePrices,
        bestueckungTotalPrices: bestueckungTotalPrices
      };
      
      // Generate PDF
      const pdfBuffer = await generateReportPDF(formDataWithSettings);
      const pdfFileName = `${eventDate}_${sanitizedEventName}_Report.pdf`;
      const pdfPath = path.join(eventFolderPath, pdfFileName);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Collect all scanned PDFs from all sections
      const scannedPDFs = [];
      
      // From Ton/Lichttechnik
      if (formData.tontechniker?.scannedImages) {
        formData.tontechniker.scannedImages.forEach(doc => {
          if (doc.filePath) scannedPDFs.push(doc.filePath);
        });
      }
      
      // From Secu
      if (formData.secu?.scannedDocuments) {
        formData.secu.scannedDocuments.forEach(doc => {
          if (doc.filePath) scannedPDFs.push(doc.filePath);
        });
      }
      
      // From Orderbird
      if (formData.orderbird?.receipts) {
        formData.orderbird.receipts.forEach(doc => {
          if (doc.filePath) scannedPDFs.push(doc.filePath);
        });
      }
      
      // From Hospitality
      if (formData['rider-extras']?.scannedDocuments) {
        formData['rider-extras'].scannedDocuments.forEach(doc => {
          if (doc.filePath) scannedPDFs.push(doc.filePath);
        });
      }
      if (formData['rider-extras']?.purchaseReceipts) {
        formData['rider-extras'].purchaseReceipts.forEach(doc => {
          if (doc.filePath) scannedPDFs.push(doc.filePath);
        });
      }
      
      // From Gäste
      if (formData.gaeste?.scannedDocuments) {
        formData.gaeste.scannedDocuments.forEach(doc => {
          if (doc.filePath) scannedPDFs.push(doc.filePath);
        });
      }
      
      // Generate date/time string for file naming (YYYY-MM-DD_HH-MM format)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const dateTimeStr = `${year}-${month}-${day}_${hours}-${minutes}`;
      
      // Copy all scanned PDFs to event folder with renamed files
      for (const pdfPath of scannedPDFs) {
        try {
          // Check if file exists
          await fs.access(pdfPath);
          const originalFileName = path.basename(pdfPath);
          const ext = path.extname(originalFileName);
          const originalBaseName = path.basename(originalFileName, ext);
          
          // Create new filename: EventName_YYYY-MM-DD_HH-MM_originalname.pdf
          const newFileName = `${sanitizedEventName}_${dateTimeStr}_${originalBaseName}${ext}`;
          const destPath = path.join(eventFolderPath, newFileName);
          
          // Check if destination file already exists and create unique name if needed
          let finalDestPath = destPath;
          let counter = 1;
          while (true) {
            try {
              await fs.access(finalDestPath);
              // File exists, add counter
              const nameWithoutExt = path.basename(newFileName, ext);
              finalDestPath = path.join(eventFolderPath, `${nameWithoutExt}_${counter}${ext}`);
              counter++;
            } catch {
              // File doesn't exist, use this path
              break;
            }
          }
          
          // Copy file to destination
          await fs.copyFile(pdfPath, finalDestPath);
          
          // Delete original file from temporary folder
          try {
            await fs.unlink(pdfPath);
          } catch (deleteError) {
            console.warn(`Could not delete original file ${pdfPath}:`, deleteError.message);
            // Continue even if deletion fails
          }
        } catch (error) {
          console.warn(`Could not copy scanned PDF ${pdfPath}:`, error.message);
          // Continue with other files
        }
      }
      
      return {
        success: true,
        eventFolder: eventFolderPath,
        pdfPath: pdfPath,
        scannedPDFsCount: scannedPDFs.length
      };
    } catch (error) {
      console.error('Error closing shift:', error);
      throw new Error('Fehler beim Schließen des Shifts: ' + error.message);
    }
  });
}

module.exports = { registerReportHandlers };

