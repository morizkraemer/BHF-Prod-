/**
 * IPC Handlers for Shift Data Persistence
 * When serverUrl is set: load/save map to API current event; otherwise use local shiftDataStore.
 */

const api = require('../api/client');

const SHIFT_KEYS = ['currentPhase', 'currentShiftData', 'shiftStartTime'];

function getServerUrl(settingsStore) {
  return (settingsStore && settingsStore.get && settingsStore.get('serverUrl', '') || '').trim();
}

function registerDataHandlers(ipcMain, shiftDataStore, settingsStore) {
  // Load shift data – API: GET current event and map key; else store
  ipcMain.handle('load-data', async (event, key) => {
    try {
      const serverUrl = getServerUrl(settingsStore);
      if (serverUrl && SHIFT_KEYS.includes(key)) {
        try {
          const eventObj = await api.getCurrentEventFull(serverUrl);
          if (eventObj) {
            let data = null;
            if (key === 'currentPhase') data = eventObj.phase ?? 'VVA';
            else if (key === 'currentShiftData') data = eventObj.formData ?? null;
            else if (key === 'shiftStartTime') data = (eventObj.formData && eventObj.formData._shiftStartTime != null) ? eventObj.formData._shiftStartTime : (eventObj.createdAt || null);
            if (data != null) shiftDataStore.set(key, data);
            return { success: true, data };
          }
        } catch (err) {
          console.warn('load-data API fallback to store:', err.message);
        }
      }
      const data = shiftDataStore.get(key, null);
      return { success: true, data };
    } catch (error) {
      console.error('Error loading shift data:', error);
      return { success: false, error: error.message, data: null };
    }
  });

  // Save shift data – API: PATCH current event or POST if none; else store
  ipcMain.handle('save-data', async (event, key, data) => {
    try {
      const serverUrl = getServerUrl(settingsStore);
      if (serverUrl && SHIFT_KEYS.includes(key)) {
        try {
          let current = await api.getCurrentEventFull(serverUrl);
          if (!current) {
            if (key === 'currentShiftData') {
              current = await api.createEvent(serverUrl, { phase: 'VVA', formData: data || {} });
            } else if (key === 'currentPhase') {
              current = await api.createEvent(serverUrl, { phase: data || 'VVA', formData: {} });
            } else if (key === 'shiftStartTime') {
              current = await api.createEvent(serverUrl, { phase: 'VVA', formData: { _shiftStartTime: data } });
            }
            if (current) {
              shiftDataStore.set(key, data);
              return { success: true };
            }
          } else {
            if (key === 'currentPhase') {
              await api.updateEvent(serverUrl, current.id, { phase: data });
            } else if (key === 'currentShiftData') {
              await api.updateEvent(serverUrl, current.id, { formData: data });
            } else if (key === 'shiftStartTime') {
              const formData = { ...(current.formData || {}), _shiftStartTime: data };
              await api.updateEvent(serverUrl, current.id, { formData });
            }
            shiftDataStore.set(key, data);
            return { success: true };
          }
        } catch (err) {
          console.warn('save-data API fallback to store:', err.message);
        }
      }
      shiftDataStore.set(key, data);
      return { success: true };
    } catch (error) {
      console.error('Error saving shift data:', error);
      return { success: false, error: error.message };
    }
  });

  // Clear all shift data (called when shift is closed) – local only; close-shift already closed event on API
  ipcMain.handle('clear-shift-data', () => {
    try {
      shiftDataStore.clear();
      shiftDataStore.set('currentShiftData', null);
      shiftDataStore.set('currentPhase', 'VVA');

      if (settingsStore) {
        settingsStore.set('techNames', {
          soundEngineerName: '',
          lightingTechName: ''
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error clearing shift data:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerDataHandlers };


