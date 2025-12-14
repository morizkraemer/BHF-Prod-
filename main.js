const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { settingsStore, shiftDataStore } = require('./config/store');
const { checkNAPS2Installed, showNAPS2Error } = require('./utils/scannerUtils');
const { registerCatalogHandlers } = require('./handlers/catalogHandlers');
const { registerSettingsHandlers } = require('./handlers/settingsHandlers');
const { registerScannerHandlers } = require('./handlers/scannerHandlers');
const { registerReportHandlers } = require('./handlers/reportHandlers');
const { registerDataHandlers } = require('./handlers/dataHandlers');

// Add V8 flags for macOS 15.6 compatibility
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--no-sandbox');

// Enable hot reload in development
if (process.argv.includes('--dev')) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Produktionsübersicht',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets', 'icons', 'icon-1000px.png')
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set app name for macOS (appears in menu bar and dock)
  app.setName('Produktionsübersicht');
  
  createWindow();
  
  // Set window title
  if (mainWindow) {
    mainWindow.setTitle('Produktionsübersicht');
  }
  
  // Register all IPC handlers
  registerCatalogHandlers(ipcMain, settingsStore);
  registerSettingsHandlers(ipcMain, settingsStore, mainWindow, dialog, shell, shiftDataStore);
  registerScannerHandlers(ipcMain, settingsStore, mainWindow, dialog);
  registerReportHandlers(ipcMain, settingsStore);
  registerDataHandlers(ipcMain, shiftDataStore, settingsStore);
  
  // Check if NAPS2 is installed (only on macOS)
  if (process.platform === 'darwin') {
    // Wait a moment for window to be ready, then check
    setTimeout(() => {
      if (!checkNAPS2Installed()) {
        showNAPS2Error(mainWindow, dialog, shell);
      }
    }, 500);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      // Set window title
      if (mainWindow) {
        mainWindow.setTitle('Produktionsübersicht');
      }
      // Re-register handlers for new window context
      registerCatalogHandlers(ipcMain, settingsStore);
      registerSettingsHandlers(ipcMain, settingsStore, mainWindow, dialog, shell, shiftDataStore);
      registerScannerHandlers(ipcMain, settingsStore, mainWindow, dialog);
      registerReportHandlers(ipcMain, settingsStore);
      registerDataHandlers(ipcMain, shiftDataStore, settingsStore);
      // Check again when window is recreated
      if (process.platform === 'darwin') {
        setTimeout(() => {
          if (!checkNAPS2Installed()) {
            showNAPS2Error(mainWindow, dialog, shell);
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
