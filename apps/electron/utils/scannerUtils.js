const { promisify } = require('util');
const { execFile } = require('child_process');

const execFileAsync = promisify(execFile);

// NAPS2 CLI path and subcommand
const NAPS2_PATH = '/Applications/NAPS2.app/Contents/MacOS/NAPS2';
const NAPS2_SUBCOMMAND = 'console';

// Helper function to get available scanners (extracted from list-scanners logic)
async function getAvailableScannersList() {
  const scanners = [];
  if (process.platform === 'darwin') {
    const fs = require('fs');
    if (fs.existsSync(NAPS2_PATH)) {
      const drivers = ['escl'];
      for (const driver of drivers) {
        try {
          const listArgs = [NAPS2_SUBCOMMAND, '--listdevices', '--driver', driver];
          let naps2Output = '';
          try {
            const result = await execFileAsync(NAPS2_PATH, listArgs, {
              timeout: 5000,
              maxBuffer: 1024 * 1024
            });
            naps2Output = result.stdout || '';
          } catch (execError) {
            naps2Output = execError.stdout || '';
          }
          
          if (naps2Output && naps2Output.trim()) {
            const lines = naps2Output.split('\n').filter(line => line.trim());
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && 
                  !trimmed.toLowerCase().includes('error') && 
                  !trimmed.toLowerCase().includes('device') &&
                  !trimmed.toLowerCase().includes('driver') &&
                  !trimmed.toLowerCase().includes('not supported') &&
                  !trimmed.toLowerCase().includes('not valid')) {
                scanners.push({
                  id: trimmed.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-'),
                  name: trimmed,
                  driver: driver
                });
              }
            }
          }
        } catch (error) {
          // Continue to next driver
        }
      }
    }
  }
  return scanners;
}

// Check if NAPS2 is installed
function checkNAPS2Installed() {
  if (process.platform === 'darwin') {
    const fs = require('fs');
    return fs.existsSync(NAPS2_PATH);
  }
  // For other platforms, return true (not checking for now)
  return true;
}

// Show NAPS2 installation error dialog
async function showNAPS2Error(mainWindow, dialog, shell) {
  if (mainWindow) {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'NAPS2 nicht gefunden',
      message: 'NAPS2 ist nicht installiert',
      detail: 'Die Scanner-Funktion erfordert NAPS2.\n\nBitte installieren Sie NAPS2 von:\nhttps://www.naps2.com/download.html\n\nNach der Installation starten Sie die App bitte neu.',
      buttons: ['OK', 'Download-Seite öffnen'],
      defaultId: 0,
      cancelId: 0
    });
    
    if (response === 1) {
      // Open download page
      shell.openExternal('https://www.naps2.com/download.html');
    }
  }
}

/**
 * Classifies scanner errors into specific categories
 * @param {string} scanSource - The scan source ('glass', 'feeder', 'duplex')
 * @param {number} exitCode - NAPS2 exit code
 * @param {string} scanOutput - NAPS2 stdout output
 * @param {string} scanError - NAPS2 stderr output
 * @param {Error} error - The error object (if any)
 * @returns {Object} - { type: string, message: string, isRecoverable: boolean }
 */
function classifyScannerError(scanSource, exitCode, scanOutput, scanError, error) {
  const outputLower = (scanOutput || '').toLowerCase();
  const errorLower = (scanError || '').toLowerCase();
  const errorMsgLower = (error?.message || '').toLowerCase();
  const combinedText = `${outputLower} ${errorLower} ${errorMsgLower}`;
  
  // Check for empty feeder (only relevant when using feeder source)
  if (scanSource === 'feeder') {
    const emptyFeederIndicators = [
      'empty',
      'no document',
      'no paper',
      'document feeder empty',
      'adf empty',
      'feeder empty',
      'no documents',
      'no pages',
      'document missing'
    ];
    
    const hasEmptyFeederIndicator = emptyFeederIndicators.some(indicator => 
      combinedText.includes(indicator)
    );
    
    // If exit code is non-zero AND we have empty feeder indicators, it's likely empty
    // Also check if file wasn't created - empty feeder often results in no file
    if (hasEmptyFeederIndicator || (exitCode !== 0 && !scanOutput && !scanError)) {
      return {
        type: 'empty_feeder',
        message: 'Feeder ist leer.\n\nBitte legen Sie Dokumente in den Einzug (Oben) ein und versuchen Sie es erneut.',
        isRecoverable: true,
        userFriendly: true
      };
    }
  }
  
  // Check for paper jam
  const paperJamIndicators = [
    'paper jam',
    'jam',
    'jammed',
    'stuck',
    'double-feed',
    'double feed',
    'multiple sheets'
  ];
  
  if (paperJamIndicators.some(indicator => combinedText.includes(indicator))) {
    return {
      type: 'paper_jam',
      message: 'Papierstau erkannt.\n\nBitte:\n- Öffnen Sie den Einzug\n- Entfernen Sie das verklemmte Papier\n- Reinigen Sie die Sensoren falls nötig\n- Schließen Sie den Einzug und versuchen Sie es erneut',
      isRecoverable: true,
      userFriendly: true
    };
  }
  
  // Check for cover open
  const coverOpenIndicators = [
    'cover open',
    'lid open',
    'door open',
    'adf open',
    'cover not closed',
    'close cover',
    'close lid'
  ];
  
  if (coverOpenIndicators.some(indicator => combinedText.includes(indicator))) {
    return {
      type: 'cover_open',
      message: 'Deckel/Einzug ist geöffnet.\n\nBitte schließen Sie den Deckel oder Einzug vollständig und versuchen Sie es erneut.',
      isRecoverable: true,
      userFriendly: true
    };
  }
  
  // Check for hardware/connection errors
  const hardwareIndicators = [
    'hardware error',
    'scanner failure',
    'device not found',
    'scanner not found',
    'connection',
    'not connected',
    'disconnected',
    'timeout',
    'communication error',
    'driver error',
    'device error'
  ];
  
  if (hardwareIndicators.some(indicator => combinedText.includes(indicator))) {
    return {
      type: 'hardware_error',
      message: 'Hardware- oder Verbindungsfehler.\n\nBitte überprüfen Sie:\n- Ist der Scanner eingeschaltet?\n- Ist der Scanner korrekt verbunden?\n- Wird der Scanner in NAPS2 erkannt?\n- Ist der richtige Treiber ausgewählt?',
      isRecoverable: false,
      userFriendly: true
    };
  }
  
  // Check for permission/access errors
  if (error?.code === 'ENOENT' && error?.message?.includes('NAPS2')) {
    return {
      type: 'naps2_not_found',
      message: 'NAPS2 wurde nicht gefunden.\n\nBitte installieren Sie NAPS2 von:\nhttps://www.naps2.com/download.html',
      isRecoverable: false,
      userFriendly: true
    };
  }
  
  // Generic error - try to provide helpful context
  const hasOutput = scanOutput || scanError;
  const safeOutput = scanOutput && /^[\x20-\x7E\s]*$/.test(scanOutput.substring(0, 200)) 
    ? scanOutput.substring(0, 200) 
    : '(binäre Daten oder nicht verfügbar)';
  
  let genericMessage = 'Fehler beim Scannen.';
  
  if (scanSource === 'feeder' && exitCode !== 0 && !hasOutput) {
    // When using feeder and we get no output, it might still be empty
    genericMessage = 'Feeder könnte leer sein oder ein anderer Fehler ist aufgetreten.\n\nBitte überprüfen Sie:\n- Sind Dokumente im Einzug?\n- Ist der Scanner bereit?\n- Gibt es Fehlermeldungen am Scanner?';
  } else if (exitCode !== 0) {
    genericMessage = `Scan-Datei wurde nicht erstellt.\n\nNAPS2 Exit Code: ${exitCode}\nNAPS2 Output: ${safeOutput}\nNAPS2 Error: ${scanError || '(keine)'}\n\nBitte überprüfen Sie:\n- Ist der Scanner eingeschaltet und verbunden?\n- Wird der Scanner in NAPS2 erkannt?\n- Ist die richtige Treiberauswahl getroffen?`;
  } else {
    genericMessage = `Fehler beim Scannen: ${error?.message || 'Unbekannter Fehler'}\n\nStellen Sie sicher, dass:\n- Der Scanner eingeschaltet und verbunden ist\n- Der Scanner in NAPS2 erkannt wird\n- Die richtige Treiberauswahl getroffen wurde`;
  }
  
  return {
    type: 'unknown_error',
    message: genericMessage,
    isRecoverable: false,
    userFriendly: true
  };
}

module.exports = {
  NAPS2_PATH,
  NAPS2_SUBCOMMAND,
  getAvailableScannersList,
  checkNAPS2Installed,
  showNAPS2Error,
  classifyScannerError,
  execFileAsync
};

