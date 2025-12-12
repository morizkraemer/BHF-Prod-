/**
 * IPC Handlers for Shift Data Persistence
 * Handles saving, loading, and clearing shift data
 */

function registerDataHandlers(ipcMain, shiftDataStore) {
  // Save shift data (formData and currentPhase)
  ipcMain.handle('save-data', (event, key, data) => {
    try {
      shiftDataStore.set(key, data);
      return { success: true };
    } catch (error) {
      console.error('Error saving shift data:', error);
      return { success: false, error: error.message };
    }
  });

  // Load shift data
  ipcMain.handle('load-data', (event, key) => {
    try {
      const data = shiftDataStore.get(key, null);
      return { success: true, data };
    } catch (error) {
      console.error('Error loading shift data:', error);
      return { success: false, error: error.message, data: null };
    }
  });

  // Clear all shift data (called when shift is closed)
  ipcMain.handle('clear-shift-data', () => {
    try {
      // Clear all data in the shift data store and reset to defaults
      shiftDataStore.clear();
      shiftDataStore.set('currentShiftData', null);
      shiftDataStore.set('currentPhase', 'VVA');
      return { success: true };
    } catch (error) {
      console.error('Error clearing shift data:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerDataHandlers };


