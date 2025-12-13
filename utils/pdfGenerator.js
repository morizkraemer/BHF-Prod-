const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;

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

      // Create a hidden browser window for PDF generation
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Load HTML as data URL
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

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
          top: 0.4,
          bottom: 0.4,
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

      resolve(pdfBuffer);
    } catch (error) {
      if (printWindow) {
        printWindow.close();
      }
      reject(error);
    }
  });
}

module.exports = { generateReportPDF };
