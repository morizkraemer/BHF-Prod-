const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const store = require('./config/store');
const { checkNAPS2Installed, showNAPS2Error } = require('./utils/scannerUtils');
const { registerCatalogHandlers } = require('./handlers/catalogHandlers');
const { registerSettingsHandlers } = require('./handlers/settingsHandlers');
const { registerScannerHandlers } = require('./handlers/scannerHandlers');
const { registerReportHandlers } = require('./handlers/reportHandlers');

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
  
  // Register all IPC handlers
  registerCatalogHandlers(ipcMain, store);
  registerSettingsHandlers(ipcMain, store, mainWindow, dialog, shell);
  registerScannerHandlers(ipcMain, store, mainWindow, dialog);
  registerReportHandlers(ipcMain, store);
  
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
      // Re-register handlers for new window context
      registerCatalogHandlers(ipcMain, store);
      registerSettingsHandlers(ipcMain, store, mainWindow, dialog, shell);
      registerScannerHandlers(ipcMain, store, mainWindow, dialog);
      registerReportHandlers(ipcMain, store);
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
