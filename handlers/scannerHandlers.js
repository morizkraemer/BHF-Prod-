const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { app } = require('electron');
const {
  NAPS2_PATH,
  NAPS2_SUBCOMMAND,
  getAvailableScannersList,
  classifyScannerError,
  execFileAsync
} = require('../utils/scannerUtils');

/**
 * IPC Handlers for Scanner Management
 * Handles scanner listing, selection, scanning, and file operations
 */

// Track scan state
let scanInProgress = false;
let currentScanInfo = null; // { scanName, startTime, outputPath }

function registerScannerHandlers(ipcMain, store, mainWindow, dialog) {
  // IPC Handlers for Scanner
  ipcMain.handle('check-scan-in-progress', () => {
    return {
      inProgress: scanInProgress,
      scanInfo: currentScanInfo
    };
  });

  ipcMain.handle('check-scan-folder', async (event, scanName) => {
    try {
      // Get scan folder from settings, or use default
      let scanDir = store.get('scanFolder', null);
      if (!scanDir) {
        scanDir = path.join(app.getPath('documents'), 'NightclubScans');
      }

      // Check if folder exists
      if (!fsSync.existsSync(scanDir)) {
        return {
          success: false,
          found: false,
          message: 'Scan-Ordner existiert nicht'
        };
      }

      // Read directory and find files matching scanName pattern
      const files = await fs.readdir(scanDir);
      const matchingFiles = files
        .filter(file => file.startsWith(scanName + '_') && (file.endsWith('.pdf') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')))
        .map(file => ({
          name: file,
          path: path.join(scanDir, file)
        }))
        .map(file => {
          try {
            const stats = fsSync.statSync(file.path);
            return {
              ...file,
              mtime: stats.mtime,
              size: stats.size
            };
          } catch (e) {
            return null;
          }
        })
        .filter(file => file !== null && file.size > 0)
        .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

      if (matchingFiles.length === 0) {
        return {
          success: true,
          found: false,
          message: 'Keine Scan-Dateien gefunden'
        };
      }

      // Get the most recent file
      const latestFile = matchingFiles[0];
      const fileBuffer = await fs.readFile(latestFile.path);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = latestFile.path.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      const fileType = latestFile.path.endsWith('.pdf') ? 'pdf' : 'image';

      return {
        success: true,
        found: true,
        filePath: latestFile.path,
        base64: `data:${mimeType};base64,${base64Data}`,
        type: fileType,
        filename: latestFile.name,
        scanName: scanName
      };
    } catch (error) {
      console.error('Error checking scan folder:', error);
      return {
        success: false,
        found: false,
        message: 'Fehler beim Prüfen des Scan-Ordners: ' + error.message
      };
    }
  });

  ipcMain.handle('list-scanners', async () => {
    try {
      if (process.platform === 'darwin') {
        const scanners = [];
        
        // Method 1: Use NAPS2 CLI to find scanners (preferred)
        try {
          // Check if NAPS2 is installed
          const fs = require('fs');
          if (fs.existsSync(NAPS2_PATH)) {
            // On macOS, use eSCL driver (shows IP addresses for network scanners)
            const drivers = process.platform === 'darwin' ? ['escl'] : ['twain', 'wia', 'escl'];
            
            for (const driver of drivers) {
              try {
                // Use execFileAsync with timeout to avoid hanging
                const listArgs = [NAPS2_SUBCOMMAND, '--listdevices', '--driver', driver];
                
                let naps2Output = '';
                let naps2Error = '';
                
                try {
                  const result = await execFileAsync(NAPS2_PATH, listArgs, {
                    timeout: 5000, // 5 second timeout
                    maxBuffer: 1024 * 1024 // 1MB buffer
                  });
                  naps2Output = result.stdout || '';
                  naps2Error = result.stderr || '';
                } catch (execError) {
                  // execFileAsync throws on non-zero exit codes, but NAPS2 might return non-zero even on success
                  // Check if stdout has device info anyway
                  naps2Output = execError.stdout || '';
                  naps2Error = execError.stderr || '';
                  
                  // If we got output, try to parse it even if there was an error
                  if (!naps2Output && execError.code !== 0) {
                    console.log(`NAPS2 driver ${driver} failed:`, execError.message, execError.stderr || '');
                    continue;
                  }
                }
                
                if (naps2Output && naps2Output.trim()) {
                  // Skip error messages
                  if (naps2Output.toLowerCase().includes('not supported') || 
                      naps2Output.toLowerCase().includes('not valid')) {
                    continue;
                  }
                  
                  // Parse NAPS2 output - format varies, but typically lists device names
                  const lines = naps2Output.split('\n').filter(line => line.trim());
                  lines.forEach(line => {
                    // Skip header lines and empty lines
                    if (line.toLowerCase().includes('device') || 
                        line.toLowerCase().includes('driver') || 
                        line.toLowerCase().includes('not supported') ||
                        line.toLowerCase().includes('not valid') ||
                        line.trim() === '') {
                      return;
                    }
                    // Extract device name (format may vary)
                    const deviceName = line.trim();
                    if (deviceName && deviceName.length > 0) {
                      const deviceId = `${driver}-${deviceName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
                      scanners.push({
                        id: deviceId,
                        name: deviceName,
                        deviceId: deviceName,
                        driver: driver,
                        type: 'naps2'
                      });
                    }
                  });
                }
              } catch (error) {
                // Driver not available, timeout, or no devices found - continue
                if (error.message !== 'Timeout') {
                  console.log(`NAPS2 driver ${driver} error:`, error.message);
                }
              }
            }
          }
        } catch (error) {
          console.log('NAPS2 not available or no scanners found:', error.message);
        }
        
        // Remove duplicates based on name
        const uniqueScanners = [];
        const seenNames = new Set();
        scanners.forEach(scanner => {
          if (!seenNames.has(scanner.name.toLowerCase())) {
            seenNames.add(scanner.name.toLowerCase());
            uniqueScanners.push(scanner);
          }
        });
        
        // Don't add default option if no scanners found - user should see empty list
        // This makes it clear that no scanners are currently connected
        
        return uniqueScanners;
      }
      
      // For other platforms, return empty for now
      return [];
    } catch (error) {
      console.error('Error listing scanners:', error);
      return [{ id: 'error', name: 'Error detecting scanners' }];
    }
  });

  ipcMain.handle('set-selected-scanner', (event, scannerId, scannerInfo) => {
    // Store both ID and full scanner info for NAPS2
    store.set('selectedScanner', scannerId);
    if (scannerInfo) {
      store.set('selectedScannerInfo', scannerInfo);
    }
    return true;
  });

  ipcMain.handle('get-selected-scanner', () => {
    return store.get('selectedScanner', null);
  });

  ipcMain.handle('get-selected-scanner-info', () => {
    return store.get('selectedScannerInfo', null);
  });

  // Check if selected scanner is still available
  ipcMain.handle('check-scanner-availability', async () => {
    try {
      const selectedScannerId = store.get('selectedScanner', null);
      const selectedScannerInfo = store.get('selectedScannerInfo', null);
      
      if (!selectedScannerId || !selectedScannerInfo) {
        return { available: false, name: null };
      }
      
      // Get current list of available scanners using helper function
      const availableScanners = await getAvailableScannersList();
      
      // Check if selected scanner is in the available list (match by name or ID)
      const isAvailable = availableScanners.some(scanner => 
        scanner.id === selectedScannerId || scanner.name === selectedScannerInfo.name
      );
      
      return {
        available: isAvailable,
        name: selectedScannerInfo.name
      };
    } catch (error) {
      console.error('Error checking scanner availability:', error);
      return { available: false, name: null };
    }
  });

  ipcMain.handle('select-scan-file', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Gescannte Datei auswählen',
      filters: [
        { name: 'Images & PDFs', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'tif'] },
        { name: 'PDFs', extensions: ['pdf'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tiff', 'tif'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
      const fileBuffer = await fs.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = filePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      
      return {
        success: true,
        filePath: filePath,
        base64: `data:${mimeType};base64,${base64Data}`,
        type: filePath.endsWith('.pdf') ? 'pdf' : 'image'
      };
    }
    
    return null;
  });

  ipcMain.handle('scan-document', async (event, source = 'glass', scanName = 'scan') => {
    const selectedScannerId = store.get('selectedScanner', null);
    
    // Validate source parameter
    const validSources = ['glass', 'feeder', 'duplex'];
    const scanSource = validSources.includes(source) ? source : 'glass';
    
    try {
      if (process.platform === 'darwin') {
        // Get scan folder from settings, or use default
        let scanDir = store.get('scanFolder', null);
        if (!scanDir) {
          scanDir = path.join(app.getPath('documents'), 'NightclubScans');
        }
        await fs.mkdir(scanDir, { recursive: true });
        
        // Check if NAPS2 is installed
        const fsCheck = require('fs');
        if (!fsCheck.existsSync(NAPS2_PATH)) {
          return {
            success: false,
            error: {
              type: 'naps2_not_found',
              message: 'NAPS2 ist nicht installiert. Bitte installieren Sie NAPS2 von https://www.naps2.com/download.html',
              isRecoverable: false,
              userFriendly: true
            }
          };
        }
        
        // Check if scanner is selected
        if (!selectedScannerId) {
          return {
            success: false,
            error: {
              type: 'scanner_not_selected',
              message: 'Bitte wählen Sie einen Scanner aus den Einstellungen aus.',
              isRecoverable: false,
              userFriendly: true
            }
          };
        }
        
        // Get scanner info (device name and driver) from store
        const scannerInfo = store.get('selectedScannerInfo', null);
        let driver, deviceName;
        
        if (scannerInfo && scannerInfo.driver && scannerInfo.deviceId) {
          // Use stored scanner info
          driver = scannerInfo.driver;
          deviceName = scannerInfo.deviceId; // deviceId contains the actual device name
        } else {
          // Fallback: try to extract from scanner ID
          const scannerParts = selectedScannerId.split('-');
          if (scannerParts.length < 2) {
            return {
              success: false,
              error: {
                type: 'invalid_scanner_id',
                message: 'Ungültige Scanner-ID. Bitte wählen Sie einen Scanner erneut aus den Einstellungen.',
                isRecoverable: false,
                userFriendly: true
              }
            };
          }
          driver = scannerParts[0]; // twain, wia, escl
          // Try to reconstruct device name (this might not work perfectly)
          const deviceNameParts = scannerParts.slice(1);
          deviceName = deviceNameParts.join(' ');
        }
        
        // Validate driver - NAPS2 on macOS only supports: escl, sane, apple
        const validDrivers = ['escl', 'sane', 'apple'];
        if (!validDrivers.includes(driver)) {
          return {
            success: false,
            error: {
              type: 'invalid_driver',
              message: `Ungültiger Treiber: "${driver}". Bitte wählen Sie den Scanner erneut aus den Einstellungen aus.\n\nGültige Treiber: ${validDrivers.join(', ')}`,
              isRecoverable: false,
              userFriendly: true
            }
          };
        }
        
        // Check if a scan is already in progress
        if (scanInProgress) {
          return {
            success: false,
            error: {
              type: 'scan_in_progress',
              message: 'Ein Scan läuft bereits. Bitte warten Sie, bis der aktuelle Scan abgeschlossen ist.',
              isRecoverable: false,
              userFriendly: true
            }
          };
        }

        // Set scan in progress
        scanInProgress = true;
        const scanStartTime = Date.now();

        // Generate output filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const outputFilename = `${scanName}_${timestamp}.pdf`; // NAPS2 defaults to PDF
        const outputPath = path.join(scanDir, outputFilename);

        // Store current scan info
        currentScanInfo = {
          scanName: scanName,
          startTime: scanStartTime,
          outputPath: outputPath
        };
        
        // Build NAPS2 CLI command arguments
        // Use execFile instead of exec for better argument handling
        const scanArgs = [
          NAPS2_SUBCOMMAND,
          '-o', outputPath,
          '--noprofile',
          '--driver', driver,
          '--device', deviceName,
          '--dpi', '300',
          '--source', scanSource,
          '--verbose'
        ];
        
        try {
          // Execute scan using execFile (this will block until scan completes)
          // Capture both stdout and stderr to see what NAPS2 is saying
          let scanOutput = '';
          let scanError = '';
          let exitCode = 0;
          try {
            const result = await execFileAsync(NAPS2_PATH, scanArgs, {
              maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
            });
            scanOutput = result.stdout || '';
            scanError = result.stderr || '';
            exitCode = 0;
          } catch (execError) {
            scanError = execError.stderr || execError.message || '';
            scanOutput = execError.stdout || '';
            exitCode = execError.code || -1;
            // Log full error details
            console.error('NAPS2 exec error code:', exitCode);
            console.error('NAPS2 exec error message:', execError.message);
            if (execError.stderr) {
              console.error('NAPS2 stderr:', execError.stderr);
            }
            if (execError.stdout) {
              console.error('NAPS2 stdout:', execError.stdout);
            }
            // Don't throw immediately - check if file was created anyway
          }
          
          // Log NAPS2 output only if there's an error
          if (exitCode !== 0 || scanError) {
            console.error('NAPS2 scan error - exit code:', exitCode);
            if (scanError) {
              console.error('NAPS2 stderr:', scanError);
            }
            // Only log stdout if it's clearly text (no binary characters)
            if (scanOutput && /^[\x20-\x7E\s]*$/.test(scanOutput.substring(0, 100))) {
              console.error('NAPS2 stdout:', scanOutput.substring(0, 500));
            }
          }
          
          // Wait a moment for file to be fully written
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if file exists and read it
          try {
            // Check if file exists first
            if (!fsSync.existsSync(outputPath)) {
              // Classify the error
              const errorClassification = classifyScannerError(scanSource, exitCode, scanOutput, scanError, null);
              
              // Create error with classification info
              const error = new Error(errorClassification.message);
              error.errorType = errorClassification.type;
              error.isRecoverable = errorClassification.isRecoverable;
              error.userFriendly = errorClassification.userFriendly;
              throw error;
            }
            
            const stats = fsSync.statSync(outputPath);
            if (!stats.isFile() || stats.size === 0) {
              // Classify the error
              const errorClassification = classifyScannerError(scanSource, exitCode, scanOutput, scanError, null);
              
              // Create error with classification info
              const error = new Error(errorClassification.message);
              error.errorType = errorClassification.type;
              error.isRecoverable = errorClassification.isRecoverable;
              error.userFriendly = errorClassification.userFriendly;
              throw error;
            }
            
            const fileBuffer = await fs.readFile(outputPath);
            const base64Data = fileBuffer.toString('base64');
            
            // Determine MIME type based on file extension
            const mimeType = outputPath.endsWith('.pdf') ? 'application/pdf' : 'image/png';
            const fileType = outputPath.endsWith('.pdf') ? 'pdf' : 'image';
            
            // Log file info (not the binary data!)
            console.log('Scan completed successfully:', outputFilename, `(${Math.round(stats.size / 1024)}KB)`);
            
            // Reset scan state
            scanInProgress = false;
            currentScanInfo = null;

            // Notify renderer process with confirmation request
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('scan-file-detected', {
                success: true,
                filePath: outputPath,
                base64: `data:${mimeType};base64,${base64Data}`,
                type: fileType,
                filename: outputFilename,
                scanName: scanName, // Include scanName so components can filter
                needsConfirmation: true
              });
            }
            
            return {
              success: true,
              message: 'Scan erfolgreich abgeschlossen.',
              filePath: outputPath,
              filename: outputFilename
            };
          } catch (fileError) {
            // Reset scan state on error
            scanInProgress = false;
            currentScanInfo = null;

            // Re-throw if it already has error classification
            if (fileError.errorType) {
              throw fileError;
            }
            // Classify file read errors
            const errorClassification = classifyScannerError(scanSource, exitCode, scanOutput, scanError, fileError);
            const error = new Error('Fehler beim Lesen der Scan-Datei: ' + fileError.message);
            error.errorType = errorClassification.type;
            error.isRecoverable = errorClassification.isRecoverable;
            error.userFriendly = errorClassification.userFriendly;
            throw error;
          }
        } catch (scanError) {
          // Reset scan state on error
          scanInProgress = false;
          currentScanInfo = null;

          // If error already has classification, re-throw it
          if (scanError.errorType) {
            throw scanError;
          }
          
          // Classify the error
          const errorClassification = classifyScannerError(scanSource, exitCode, scanOutput, scanError, scanError);
          
          // Create error with classification info
          const error = new Error(errorClassification.message);
          error.errorType = errorClassification.type;
          error.isRecoverable = errorClassification.isRecoverable;
          error.userFriendly = errorClassification.userFriendly;
          throw error;
        }
      } else {
        return {
          success: false,
          error: {
            type: 'platform_not_supported',
            message: 'Scanner-Funktion ist derzeit nur für macOS verfügbar.',
            isRecoverable: false,
            userFriendly: true
          }
        };
      }
      
    } catch (error) {
      // Reset scan state on error
      scanInProgress = false;
      currentScanInfo = null;

      console.error('Scan error:', error);
      
      // If error already has classification, return structured error
      if (error.errorType) {
        return {
          success: false,
          error: {
            type: error.errorType,
            message: error.message,
            isRecoverable: error.isRecoverable,
            userFriendly: error.userFriendly
          }
        };
      }
      
      // For unclassified errors, classify them now
      const errorClassification = classifyScannerError(
        scanSource || 'glass', 
        -1, 
        '', 
        error.message || '', 
        error
      );
      
      return {
        success: false,
        error: {
          type: errorClassification.type,
          message: errorClassification.message,
          isRecoverable: errorClassification.isRecoverable,
          userFriendly: errorClassification.userFriendly
        }
      };
    }
  });
}

module.exports = { registerScannerHandlers };

