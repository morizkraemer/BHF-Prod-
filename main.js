const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { exec, execFile } = require('child_process');
const { promisify } = require('util');
const Store = require('electron-store');

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// Enable hot reload in development
if (process.argv.includes('--dev')) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

// Initialize electron-store
const store = new Store({
  name: 'config',
  defaults: {
    riderExtrasItems: [],
    nightLeads: [],
    selectedScanner: null,
    scanFolder: null, // Will default to ~/Documents/NightclubScans if not set
    techNames: {
      soundEngineerName: '',
      lightingTechName: ''
    }
  }
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // Check if NAPS2 is installed (only on macOS)
  if (process.platform === 'darwin') {
    // Wait a moment for window to be ready, then check
    setTimeout(() => {
      if (!checkNAPS2Installed()) {
        showNAPS2Error();
      }
    }, 500);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      // Check again when window is recreated
      if (process.platform === 'darwin') {
        setTimeout(() => {
          if (!checkNAPS2Installed()) {
            showNAPS2Error();
          }
        }, 500);
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Item Catalog
ipcMain.handle('get-rider-items', () => {
  return store.get('riderExtrasItems', []);
});

ipcMain.handle('add-rider-item', (event, item) => {
  const items = store.get('riderExtrasItems', []);
  const newItem = {
    id: Date.now().toString(),
    name: item.name,
    price: parseFloat(item.price) || 0,
    createdAt: new Date().toISOString()
  };
  items.push(newItem);
  store.set('riderExtrasItems', items);
  return newItem;
});

ipcMain.handle('update-rider-item', (event, itemId, updates) => {
  const items = store.get('riderExtrasItems', []);
  const index = items.findIndex(item => item.id === itemId);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    store.set('riderExtrasItems', items);
    return items[index];
  }
  return null;
});

ipcMain.handle('delete-rider-item', (event, itemId) => {
  const items = store.get('riderExtrasItems', []);
  const filtered = items.filter(item => item.id !== itemId);
  store.set('riderExtrasItems', filtered);
  return true;
});

// IPC Handlers for Night Leads Catalog
ipcMain.handle('get-night-leads', () => {
  return store.get('nightLeads', []);
});

ipcMain.handle('add-night-lead', (event, lead) => {
  const leads = store.get('nightLeads', []);
  const newLead = {
    id: Date.now().toString(),
    name: lead.name,
    createdAt: new Date().toISOString()
  };
  leads.push(newLead);
  store.set('nightLeads', leads);
  return newLead;
});

ipcMain.handle('update-night-lead', (event, leadId, updates) => {
  const leads = store.get('nightLeads', []);
  const index = leads.findIndex(lead => lead.id === leadId);
  if (index !== -1) {
    leads[index] = { ...leads[index], ...updates };
    store.set('nightLeads', leads);
    return leads[index];
  }
  return null;
});

ipcMain.handle('delete-night-lead', (event, leadId) => {
  const leads = store.get('nightLeads', []);
  const filtered = leads.filter(lead => lead.id !== leadId);
  store.set('nightLeads', filtered);
  return true;
});

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

// NAPS2 CLI path and subcommand
const NAPS2_PATH = '/Applications/NAPS2.app/Contents/MacOS/NAPS2';
const NAPS2_SUBCOMMAND = 'console';

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
async function showNAPS2Error() {
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

// IPC Handlers for Scanner
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

// Store active file watchers
const activeWatchers = new Map();

ipcMain.handle('scan-document', async (event, source = 'glass') => {
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
        throw new Error('NAPS2 ist nicht installiert. Bitte installieren Sie NAPS2 von https://www.naps2.com/download.html');
      }
      
      // Check if scanner is selected
      if (!selectedScannerId) {
        throw new Error('Bitte wählen Sie einen Scanner aus den Einstellungen aus.');
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
          throw new Error('Ungültige Scanner-ID. Bitte wählen Sie einen Scanner erneut aus den Einstellungen.');
        }
        driver = scannerParts[0]; // twain, wia, escl
        // Try to reconstruct device name (this might not work perfectly)
        const deviceNameParts = scannerParts.slice(1);
        deviceName = deviceNameParts.join(' ');
      }
      
      // Validate driver - NAPS2 on macOS only supports: escl, sane, apple
      const validDrivers = ['escl', 'sane', 'apple'];
      if (!validDrivers.includes(driver)) {
        throw new Error(`Ungültiger Treiber: "${driver}". Bitte wählen Sie den Scanner erneut aus den Einstellungen aus.\n\nGültige Treiber: ${validDrivers.join(', ')}`);
      }
      
      // Generate output filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const outputFilename = `scan_${timestamp}.pdf`; // NAPS2 defaults to PDF
      const outputPath = path.join(scanDir, outputFilename);
      
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
          const stats = fsSync.statSync(outputPath);
          if (!stats.isFile() || stats.size === 0) {
            // Only include text-safe output in error message
            const safeOutput = scanOutput && /^[\x20-\x7E\s]*$/.test(scanOutput.substring(0, 200)) 
              ? scanOutput.substring(0, 200) 
              : '(binäre Daten oder nicht verfügbar)';
            const errorMsg = `Scan-Datei wurde nicht erstellt oder ist leer.\n\nNAPS2 Exit Code: ${exitCode}\nNAPS2 Output: ${safeOutput}\nNAPS2 Error: ${scanError || '(keine)'}`;
            throw new Error(errorMsg);
          }
          
          const fileBuffer = await fs.readFile(outputPath);
          const base64Data = fileBuffer.toString('base64');
          
          // Determine MIME type based on file extension
          const mimeType = outputPath.endsWith('.pdf') ? 'application/pdf' : 'image/png';
          const fileType = outputPath.endsWith('.pdf') ? 'pdf' : 'image';
          
          // Log file info (not the binary data!)
          console.log('Scan completed successfully:', outputFilename, `(${Math.round(stats.size / 1024)}KB)`);
          
          // Notify renderer process with confirmation request
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('scan-file-detected', {
              success: true,
              filePath: outputPath,
              base64: `data:${mimeType};base64,${base64Data}`,
              type: fileType,
              filename: outputFilename,
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
          throw new Error('Fehler beim Lesen der Scan-Datei: ' + fileError.message);
        }
      } catch (scanError) {
        // Check if NAPS2 command failed
        if (scanError.code === 'ENOENT') {
          throw new Error('NAPS2 wurde nicht gefunden. Bitte installieren Sie NAPS2 von https://www.naps2.com/download.html');
        }
        throw new Error('Fehler beim Scannen: ' + scanError.message + '\n\nStellen Sie sicher, dass:\n- Der Scanner eingeschaltet und verbunden ist\n- Der Scanner in NAPS2 erkannt wird\n- Die richtige Treiberauswahl getroffen wurde');
      }
    } else {
      throw new Error('Scanner-Funktion ist derzeit nur für macOS verfügbar.');
    }
    
  } catch (error) {
    console.error('Scan error:', error);
    throw error;
  }
});

