const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { settingsStore, shiftDataStore } = require('./config/store');
const { checkNAPS2Installed, showNAPS2Error } = require('./utils/scannerUtils');
const { registerCatalogHandlers } = require('./handlers/catalogHandlers');
const { registerSettingsHandlers } = require('./handlers/settingsHandlers');
const { registerScannerHandlers } = require('./handlers/scannerHandlers');
const { registerReportHandlers } = require('./handlers/reportHandlers');
const { registerDataHandlers } = require('./handlers/dataHandlers');
const { createLanFormServer } = require('./server/secuFormServer');

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

// Check if this is a debug build by reading .env.build file
function isDebugBuild() {
  // Check environment variable first (for development)
  if (process.env.DEBUG_MODE === 'true') {
    return true;
  }
  
  // Check .env.build file (packaged in the app)
  try {
    const envBuildPath = path.join(__dirname, '.env.build');
    if (fs.existsSync(envBuildPath)) {
      const envContent = fs.readFileSync(envBuildPath, 'utf8');
      if (envContent.includes('DEBUG_MODE=true')) {
        return true;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Fallback: check app name (set by electron-packager)
  const appName = app.getName().toLowerCase();
  if (appName.includes('debug')) {
    return true;
  }
  
  return false;
}

function createWindow() {
  const debugMode = isDebugBuild();
  const appTitle = debugMode ? 'Produktionsübersicht (Debug)' : 'Produktionsübersicht';
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: appTitle,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets', 'icons', 'icon-1000px.png')
  });

  mainWindow.loadFile('index.html');

  // Maximize window on startup
  mainWindow.maximize();

  // Open DevTools in development mode or debug build
  if (process.argv.includes('--dev') || debugMode) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set app name for macOS (appears in menu bar and dock)
  const debugMode = isDebugBuild();
  const appTitle = debugMode ? 'Produktionsübersicht (Debug)' : 'Produktionsübersicht';
  app.setName(appTitle);
  
  createWindow();
  
  // Set window title
  if (mainWindow) {
    mainWindow.setTitle(appTitle);
  }
  
  // Register all IPC handlers
  registerCatalogHandlers(ipcMain, settingsStore);
  registerSettingsHandlers(ipcMain, settingsStore, mainWindow, dialog, shell, shiftDataStore);
  registerScannerHandlers(ipcMain, settingsStore, mainWindow, dialog);
  registerReportHandlers(ipcMain, settingsStore);
  registerDataHandlers(ipcMain, shiftDataStore, settingsStore);

  ipcMain.handle('show-message-box', async (event, options) => {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : BrowserWindow.getFocusedWindow();
    return dialog.showMessageBox(win || BrowserWindow.getAllWindows()[0], options);
  });

  try {
    createLanFormServer(settingsStore, shiftDataStore);
  } catch (err) {
    console.error('LAN form server failed to start:', err);
  }

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
        const debugMode = isDebugBuild();
        const appTitle = debugMode ? 'Produktionsübersicht (Debug)' : 'Produktionsübersicht';
        mainWindow.setTitle(appTitle);
      }
      // Note: IPC handlers are global and don't need to be re-registered
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
