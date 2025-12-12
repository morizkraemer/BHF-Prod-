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
      
      // Generate PDF
      const pdfBuffer = await generateReportPDF(formData);
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
      
      // Copy all scanned PDFs to event folder
      for (const pdfPath of scannedPDFs) {
        try {
          // Check if file exists
          await fs.access(pdfPath);
          const fileName = path.basename(pdfPath);
          const destPath = path.join(eventFolderPath, fileName);
          
          // Copy file (if it doesn't already exist in destination)
          try {
            await fs.access(destPath);
            // File already exists, skip or create unique name
            const ext = path.extname(fileName);
            const baseName = path.basename(fileName, ext);
            const timestamp = Date.now();
            const uniqueFileName = `${baseName}_${timestamp}${ext}`;
            const uniqueDestPath = path.join(eventFolderPath, uniqueFileName);
            await fs.copyFile(pdfPath, uniqueDestPath);
          } catch {
            // File doesn't exist, copy it
            await fs.copyFile(pdfPath, destPath);
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

