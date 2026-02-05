/**
 * IPC Handlers for Catalog Management
 * Handles rider items, night leads, and bestückung lists.
 * When serverUrl is set, uses API client first; falls back to store on error/offline.
 */

const api = require('../api/client');

function getBaseUrl(store) {
  return (store.get('serverUrl', '') || '').trim();
}

function registerCatalogHandlers(ipcMain, store) {
  // IPC Handlers for Item Catalog
  ipcMain.handle('get-rider-items', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.getRiderItems(baseUrl);
      } catch (err) {
        console.warn('API get-rider-items fallback to store:', err.message);
      }
    }
    return store.get('riderExtrasItems', []);
  });

  ipcMain.handle('add-rider-item', async (event, item) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.addRiderItem(baseUrl, item);
      } catch (err) {
        console.warn('API add-rider-item fallback to store:', err.message);
      }
    }
    const items = store.get('riderExtrasItems', []);
    const newItem = {
      id: Date.now().toString(),
      name: item.name,
      price: parseFloat(item.price) || 0,
      ekPrice: item.ekPrice ? parseFloat(item.ekPrice) : null,
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    store.set('riderExtrasItems', items);
    return newItem;
  });

  ipcMain.handle('update-rider-item', async (event, itemId, updates) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.updateRiderItem(baseUrl, itemId, updates);
      } catch (err) {
        console.warn('API update-rider-item fallback to store:', err.message);
      }
    }
    const items = store.get('riderExtrasItems', []);
    const index = items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      store.set('riderExtrasItems', items);
      return items[index];
    }
    return null;
  });

  ipcMain.handle('delete-rider-item', async (event, itemId) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        await api.deleteRiderItem(baseUrl, itemId);
        return true;
      } catch (err) {
        console.warn('API delete-rider-item fallback to store:', err.message);
      }
    }
    const items = store.get('riderExtrasItems', []);
    const filtered = items.filter(item => item.id !== itemId);
    store.set('riderExtrasItems', filtered);
    return true;
  });

  // IPC Handlers for Night Leads Catalog
  ipcMain.handle('get-night-leads', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.getNightLeads(baseUrl);
      } catch (err) {
        console.warn('API get-night-leads fallback to store:', err.message);
      }
    }
    return store.get('nightLeads', []);
  });

  ipcMain.handle('add-night-lead', async (event, lead) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.addNightLead(baseUrl, lead);
      } catch (err) {
        console.warn('API add-night-lead fallback to store:', err.message);
      }
    }
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

  ipcMain.handle('update-night-lead', async (event, leadId, updates) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.updateNightLead(baseUrl, leadId, updates);
      } catch (err) {
        console.warn('API update-night-lead fallback to store:', err.message);
      }
    }
    const leads = store.get('nightLeads', []);
    const index = leads.findIndex(lead => lead.id === leadId);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updates };
      store.set('nightLeads', leads);
      return leads[index];
    }
    return null;
  });

  ipcMain.handle('delete-night-lead', async (event, leadId) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        await api.deleteNightLead(baseUrl, leadId);
        return true;
      } catch (err) {
        console.warn('API delete-night-lead fallback to store:', err.message);
      }
    }
    const leads = store.get('nightLeads', []);
    const filtered = leads.filter(lead => lead.id !== leadId);
    store.set('nightLeads', filtered);
    return true;
  });

  // Helper: get/add person names for a catalog (store key, returns { id, name }[])
  function getPersonNames(storeKey) {
    return store.get(storeKey, []);
  }

  function addPersonName(storeKey, name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const list = store.get(storeKey, []);
    const existing = list.find(item => item.name && item.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const newItem = { id: Date.now().toString(), name: trimmed };
    list.push(newItem);
    store.set(storeKey, list);
    return newItem;
  }

  function removePersonName(storeKey, name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    const list = store.get(storeKey, []);
    const keyLower = trimmed.toLowerCase();
    const filtered = list.filter(item => (item.name || '').trim().toLowerCase() !== keyLower);
    if (filtered.length === list.length) return false;
    store.set(storeKey, filtered);
    return true;
  }

  // Person name catalogs: Secu, Tech (Ton + Licht shared), Andere Mitarbeiter
  const personNameTypeMap = { secuPersonNames: 'secu', techPersonNames: 'tech', andereMitarbeiterNames: 'andere' };
  ipcMain.handle('get-secu-names', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.getPersonNames(baseUrl, 'secu');
      } catch (err) {
        console.warn('API get-secu-names fallback to store:', err.message);
      }
    }
    return getPersonNames('secuPersonNames');
  });
  ipcMain.handle('add-secu-name', async (event, name) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const result = await api.addPersonName(baseUrl, 'secu', name);
        return result || addPersonName('secuPersonNames', name);
      } catch (err) {
        console.warn('API add-secu-name fallback to store:', err.message);
      }
    }
    return addPersonName('secuPersonNames', name);
  });

  ipcMain.handle('get-tech-names', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.getPersonNames(baseUrl, 'tech');
      } catch (err) {
        console.warn('API get-tech-names fallback to store:', err.message);
      }
    }
    return getPersonNames('techPersonNames');
  });
  ipcMain.handle('add-tech-name', async (event, name) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const result = await api.addPersonName(baseUrl, 'tech', name);
        return result || addPersonName('techPersonNames', name);
      } catch (err) {
        console.warn('API add-tech-name fallback to store:', err.message);
      }
    }
    return addPersonName('techPersonNames', name);
  });

  ipcMain.handle('get-andere-mitarbeiter-names', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.getPersonNames(baseUrl, 'andere');
      } catch (err) {
        console.warn('API get-andere-mitarbeiter-names fallback to store:', err.message);
      }
    }
    return getPersonNames('andereMitarbeiterNames');
  });
  ipcMain.handle('add-andere-mitarbeiter-name', async (event, name) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const result = await api.addPersonName(baseUrl, 'andere', name);
        return result || addPersonName('andereMitarbeiterNames', name);
      } catch (err) {
        console.warn('API add-andere-mitarbeiter-name fallback to store:', err.message);
      }
    }
    return addPersonName('andereMitarbeiterNames', name);
  });

  // IPC Handlers for Bestückung Lists
  const BESTUECKUNG_KEYS = ['standard-konzert', 'standard-tranzit'];
  ipcMain.handle('get-bestueckung-lists', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const out = {};
        for (const key of BESTUECKUNG_KEYS) {
          const data = await api.getBestueckungList(baseUrl, key);
          out[key] = (data && data.items) ? data.items : [];
        }
        return out;
      } catch (err) {
        console.warn('API get-bestueckung-lists fallback to store:', err.message);
      }
    }
    return store.get('bestueckungLists', { 'standard-konzert': [], 'standard-tranzit': [] });
  });

  ipcMain.handle('get-bestueckung-list', async (event, bestueckungKey) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const data = await api.getBestueckungList(baseUrl, bestueckungKey);
        return (data && data.items) ? data.items : [];
      } catch (err) {
        console.warn('API get-bestueckung-list fallback to store:', err.message);
      }
    }
    const lists = store.get('bestueckungLists', { 'standard-konzert': [], 'standard-tranzit': [] });
    return lists[bestueckungKey] || [];
  });

  ipcMain.handle('save-bestueckung-list', async (event, bestueckungKey, items) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        await api.putBestueckungList(baseUrl, bestueckungKey, { items: items || [] });
        return true;
      } catch (err) {
        console.warn('API save-bestueckung-list fallback to store:', err.message);
      }
    }
    const lists = store.get('bestueckungLists', { 'standard-konzert': [], 'standard-tranzit': [] });
    lists[bestueckungKey] = items || [];
    store.set('bestueckungLists', lists);
    return true;
  });

  ipcMain.handle('add-bestueckung-item', async (event, bestueckungKey, riderItemId, amount) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const data = await api.getBestueckungList(baseUrl, bestueckungKey);
        const items = (data && data.items) ? [...data.items] : [];
        if (items.some(item => item.riderItemId === riderItemId)) return false;
        items.push({ riderItemId, amount: parseFloat(amount) || 1 });
        await api.putBestueckungList(baseUrl, bestueckungKey, { items });
        return true;
      } catch (err) {
        console.warn('API add-bestueckung-item fallback to store:', err.message);
      }
    }
    const lists = store.get('bestueckungLists', { 'standard-konzert': [], 'standard-tranzit': [] });
    if (!lists[bestueckungKey]) lists[bestueckungKey] = [];
    if (lists[bestueckungKey].some(item => item.riderItemId === riderItemId)) return false;
    lists[bestueckungKey].push({ riderItemId, amount: parseFloat(amount) || 1 });
    store.set('bestueckungLists', lists);
    return true;
  });

  ipcMain.handle('update-bestueckung-item', async (event, bestueckungKey, oldRiderItemId, updates) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const data = await api.getBestueckungList(baseUrl, bestueckungKey);
        const items = (data && data.items) ? [...data.items] : [];
        const idx = items.findIndex(item => item.riderItemId === oldRiderItemId);
        if (idx === -1) return false;
        items[idx] = { ...items[idx], ...updates };
        await api.putBestueckungList(baseUrl, bestueckungKey, { items });
        return true;
      } catch (err) {
        console.warn('API update-bestueckung-item fallback to store:', err.message);
      }
    }
    const lists = store.get('bestueckungLists', { 'standard-konzert': [], 'standard-tranzit': [] });
    if (!lists[bestueckungKey]) return false;
    const itemIndex = lists[bestueckungKey].findIndex(item => item.riderItemId === oldRiderItemId);
    if (itemIndex === -1) return false;
    lists[bestueckungKey][itemIndex] = { ...lists[bestueckungKey][itemIndex], ...updates };
    store.set('bestueckungLists', lists);
    return true;
  });

  ipcMain.handle('delete-bestueckung-item', async (event, bestueckungKey, riderItemId) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const data = await api.getBestueckungList(baseUrl, bestueckungKey);
        const items = (data && data.items) ? data.items.filter(item => item.riderItemId !== riderItemId) : [];
        await api.putBestueckungList(baseUrl, bestueckungKey, { items });
        return true;
      } catch (err) {
        console.warn('API delete-bestueckung-item fallback to store:', err.message);
      }
    }
    const lists = store.get('bestueckungLists', { 'standard-konzert': [], 'standard-tranzit': [] });
    if (!lists[bestueckungKey]) return false;
    lists[bestueckungKey] = lists[bestueckungKey].filter(item => item.riderItemId !== riderItemId);
    store.set('bestueckungLists', lists);
    return true;
  });

  // Bestückung Total Prices (stored in settings on backend)
  ipcMain.handle('get-bestueckung-total-prices', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const all = await api.getSettings(baseUrl);
        const prices = (all && all.bestueckungTotalPrices) ? all.bestueckungTotalPrices : {};
        return { 'standard-konzert': prices['standard-konzert'] ?? '', 'standard-tranzit': prices['standard-tranzit'] ?? '' };
      } catch (err) {
        console.warn('API get-bestueckung-total-prices fallback to store:', err.message);
      }
    }
    return store.get('bestueckungTotalPrices', { 'standard-konzert': '', 'standard-tranzit': '' });
  });

  ipcMain.handle('save-bestueckung-total-price', async (event, bestueckungKey, price) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const all = await api.getSettings(baseUrl);
        const prices = (all && all.bestueckungTotalPrices) ? { ...all.bestueckungTotalPrices } : {};
        prices[bestueckungKey] = price;
        await api.setSetting(baseUrl, 'bestueckungTotalPrices', prices);
        return true;
      } catch (err) {
        console.warn('API save-bestueckung-total-price fallback to store:', err.message);
      }
    }
    const prices = store.get('bestueckungTotalPrices', { 'standard-konzert': '', 'standard-tranzit': '' });
    prices[bestueckungKey] = price;
    store.set('bestueckungTotalPrices', prices);
    return true;
  });

  ipcMain.handle('get-bestueckung-pricing-types', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const all = await api.getSettings(baseUrl);
        const types = (all && all.bestueckungPricingTypes) ? all.bestueckungPricingTypes : {};
        return { 'standard-konzert': types['standard-konzert'] ?? 'pauschale', 'standard-tranzit': types['standard-tranzit'] ?? 'pauschale' };
      } catch (err) {
        console.warn('API get-bestueckung-pricing-types fallback to store:', err.message);
      }
    }
    return store.get('bestueckungPricingTypes', { 'standard-konzert': 'pauschale', 'standard-tranzit': 'pauschale' });
  });

  ipcMain.handle('save-bestueckung-pricing-type', async (event, bestueckungKey, pricingType) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const all = await api.getSettings(baseUrl);
        const types = (all && all.bestueckungPricingTypes) ? { ...all.bestueckungPricingTypes } : {};
        types[bestueckungKey] = pricingType;
        await api.setSetting(baseUrl, 'bestueckungPricingTypes', types);
        return true;
      } catch (err) {
        console.warn('API save-bestueckung-pricing-type fallback to store:', err.message);
      }
    }
    const types = store.get('bestueckungPricingTypes', { 'standard-konzert': 'pauschale', 'standard-tranzit': 'pauschale' });
    types[bestueckungKey] = pricingType;
    store.set('bestueckungPricingTypes', types);
    return true;
  });

  // Roles (user-defined; wage per role, numeric €/h) – API first, fallback to store
  ipcMain.handle('get-roles', async () => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        return await api.getRoles(baseUrl);
      } catch (err) {
        console.warn('API get-roles fallback to store:', err.message);
      }
    }
    return store.get('roles', []);
  });

  ipcMain.handle('create-role', async (event, body) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const role = await api.postRole(baseUrl, body);
        const roles = store.get('roles', []);
        roles.push(role);
        store.set('roles', roles);
        return role;
      } catch (err) {
        console.warn('API create-role fallback to store:', err.message);
      }
    }
    const roles = store.get('roles', []);
    const wage = body?.hourlyWage != null ? parseFloat(body.hourlyWage) : 0;
    const newRole = {
      id: `local-${Date.now()}`,
      name: (body?.name ?? '').toString().trim() || 'Rolle',
      hourlyWage: Number.isFinite(wage) ? wage : 0,
      sortOrder: typeof body?.sortOrder === 'number' ? body.sortOrder : roles.length
    };
    roles.push(newRole);
    store.set('roles', roles);
    return newRole;
  });

  ipcMain.handle('update-role', async (event, id, body) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        const role = await api.patchRole(baseUrl, id, body);
        const roles = store.get('roles', []);
        const idx = roles.findIndex((r) => r.id === id);
        if (idx !== -1) {
          roles[idx] = { ...roles[idx], ...role };
          store.set('roles', roles);
        }
        return role;
      } catch (err) {
        console.warn('API update-role fallback to store:', err.message);
      }
    }
    const roles = store.get('roles', []);
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    if (body?.name !== undefined) roles[idx].name = (body.name ?? '').toString().trim();
    if (body?.hourlyWage !== undefined) {
      const w = parseFloat(body.hourlyWage);
      roles[idx].hourlyWage = Number.isFinite(w) ? w : 0;
    }
    if (body?.sortOrder !== undefined) roles[idx].sortOrder = parseInt(body.sortOrder, 10) || 0;
    store.set('roles', roles);
    return roles[idx];
  });

  ipcMain.handle('delete-role', async (event, id) => {
    const baseUrl = getBaseUrl(store);
    if (baseUrl) {
      try {
        await api.deleteRole(baseUrl, id);
        const roles = store.get('roles', []).filter((r) => r.id !== id);
        store.set('roles', roles);
        return true;
      } catch (err) {
        console.warn('API delete-role fallback to store:', err.message);
      }
    }
    const roles = store.get('roles', []).filter((r) => r.id !== id);
    store.set('roles', roles);
    return true;
  });
}

module.exports = { registerCatalogHandlers };

