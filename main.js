const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

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
    riderExtrasItems: []
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

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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

