const { BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

/**
 * Generates a PDF report from form data using HTML template
 * @param {Object} formData - The form data object containing all sections
 * @returns {Promise<Buffer>} - A promise that resolves to the PDF buffer
 */
async function generateReportPDF(formData) {
  return new Promise(async (resolve, reject) => {
    let printWindow = null;

    try {
      // Read template files
      const templatesDir = path.join(__dirname, '..', 'templates');
      const htmlTemplate = await fs.readFile(path.join(templatesDir, 'report-template.html'), 'utf8');
      const cssContent = await fs.readFile(path.join(templatesDir, 'report-styles.css'), 'utf8');
      const jsContent = await fs.readFile(path.join(templatesDir, 'report-template.js'), 'utf8');

      // Replace CSS link with inline styles
      let html = htmlTemplate.replace(
        '<link rel="stylesheet" href="report-styles.css">',
        `<style>${cssContent}</style>`
      );

      // Replace script src with inline script that includes data
      // Match the first script tag (with test data or null) and the following script tag
      html = html.replace(
        /<script>[\s\S]*?window\.reportData = [\s\S]*?<\/script>\s*<script src="report-template\.js"><\/script>/,
        `<script>
          window.reportData = ${JSON.stringify(formData)};
        </script>
        <script>
          ${jsContent}
        </script>`
      );

      // Write HTML to a temporary file instead of using data URL (to avoid URL length limits)
      const tempDir = app.getPath('temp');
      const tempHtmlPath = path.join(tempDir, 'temp-report.html');
      await fs.writeFile(tempHtmlPath, html, 'utf8');

      // Create a hidden browser window for PDF generation
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false // Allow loading local files
        }
      });

      // Load HTML from file instead of data URL (to avoid URL length limits)
      await printWindow.loadFile(tempHtmlPath);

      // Wait for the page to be fully loaded and scripts to execute
      await printWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          if (document.readyState === 'complete') {
            setTimeout(resolve, 300);
          } else {
            window.addEventListener('load', () => setTimeout(resolve, 300));
          }
        });
      `);

      // Generate current date/time for footer
      const now = new Date();
      const dateStr = now.toLocaleDateString('de-DE');
      const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

      // Generate PDF using Electron's printToPDF
      const pdfBuffer = await printWindow.webContents.printToPDF({
        printBackground: true,
        margins: {
          top: 0.6,
          bottom: 0.6,
          left: 0.4,
          right: 0.4
        },
        pageSize: 'A4',
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 8px; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between; align-items: center; color: #7f8c8d;">
            <span>Erstellt am ${dateStr} um ${timeStr}</span>
            <span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span>
          </div>
        `
      });

      // Close the window
      printWindow.close();
      printWindow = null;

      // Clean up temporary file
      try {
        await fs.unlink(tempHtmlPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      // Add fillable notes field to the PDF on a new page
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();

      // Convert mm to points (1 mm = 72/25.4 points)
      const mmToPoints = (mm) => (mm * 72) / 25.4;
      
      // Add a new page for the notes field
      const notesPage = pdfDoc.addPage([width, height]);
      
      // Position the notes field on the new page
      // Position: centered horizontally, 50mm from top, width: 170mm, height: 150mm
      const fieldWidth = mmToPoints(170); // 170mm wide
      const fieldHeight = mmToPoints(150); // 150mm high (larger for more space)
      const fieldX = (width - fieldWidth) / 2; // Centered horizontally
      const fieldY = height - mmToPoints(50) - fieldHeight; // 50mm from top

      // Get form and create a text field for notes
      const form = pdfDoc.getForm();
      const notesField = form.createTextField('notes');
      notesField.setText('');
      notesField.enableMultiline();
      notesField.addToPage(notesPage, {
        x: fieldX,
        y: fieldY,
        width: fieldWidth,
        height: fieldHeight,
      });

      // Add label text above the field
      const helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold');
      notesPage.drawText('Nachträgliche Notizen:', {
        x: fieldX,
        y: fieldY + fieldHeight + mmToPoints(5), // 5mm above the field
        size: 14,
        font: helveticaBoldFont,
      });

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      resolve(Buffer.from(modifiedPdfBytes));
    } catch (error) {
      if (printWindow) {
        printWindow.close();
      }
      // Try to clean up temp file on error
      const tempDir = app.getPath('temp');
      const tempHtmlPath = path.join(tempDir, 'temp-report.html');
      try {
        await fs.unlink(tempHtmlPath).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      reject(error);
    }
  });
}

module.exports = { generateReportPDF };
