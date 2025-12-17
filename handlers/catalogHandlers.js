/**
 * IPC Handlers for Catalog Management
 * Handles rider items, night leads, and bestückung lists
 */

function registerCatalogHandlers(ipcMain, store) {
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
      ekPrice: item.ekPrice ? parseFloat(item.ekPrice) : null,
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

  // IPC Handlers for Bestückung Lists
  ipcMain.handle('get-bestueckung-lists', () => {
    return store.get('bestueckungLists', {
      'standard-konzert': [],
      'standard-tranzit': []
    });
  });

  ipcMain.handle('get-bestueckung-list', (event, bestueckungKey) => {
    const lists = store.get('bestueckungLists', {
      'standard-konzert': [],
      'standard-tranzit': []
    });
    return lists[bestueckungKey] || [];
  });

  ipcMain.handle('save-bestueckung-list', (event, bestueckungKey, items) => {
    const lists = store.get('bestueckungLists', {
      'standard-konzert': [],
      'standard-tranzit': []
    });
    lists[bestueckungKey] = items;
    store.set('bestueckungLists', lists);
    return true;
  });

  ipcMain.handle('add-bestueckung-item', (event, bestueckungKey, riderItemId, amount) => {
    const lists = store.get('bestueckungLists', {
      'standard-konzert': [],
      'standard-tranzit': []
    });
    if (!lists[bestueckungKey]) {
      lists[bestueckungKey] = [];
    }
    // Check if item already exists
    if (lists[bestueckungKey].some(item => item.riderItemId === riderItemId)) {
      return false; // Item already in list
    }
    lists[bestueckungKey].push({ riderItemId, amount: parseFloat(amount) || 1 });
    store.set('bestueckungLists', lists);
    return true;
  });

  ipcMain.handle('update-bestueckung-item', (event, bestueckungKey, oldRiderItemId, updates) => {
    const lists = store.get('bestueckungLists', {
      'standard-konzert': [],
      'standard-tranzit': []
    });
    if (!lists[bestueckungKey]) {
      return false;
    }
    const itemIndex = lists[bestueckungKey].findIndex(item => item.riderItemId === oldRiderItemId);
    if (itemIndex === -1) {
      return false;
    }
    lists[bestueckungKey][itemIndex] = { ...lists[bestueckungKey][itemIndex], ...updates };
    store.set('bestueckungLists', lists);
    return true;
  });

  ipcMain.handle('delete-bestueckung-item', (event, bestueckungKey, riderItemId) => {
    const lists = store.get('bestueckungLists', {
      'standard-konzert': [],
      'standard-tranzit': []
    });
    if (!lists[bestueckungKey]) {
      return false;
    }
    lists[bestueckungKey] = lists[bestueckungKey].filter(item => item.riderItemId !== riderItemId);
    store.set('bestueckungLists', lists);
    return true;
  });

  // IPC Handlers for Bestückung Total Prices
  ipcMain.handle('get-bestueckung-total-prices', () => {
    return store.get('bestueckungTotalPrices', {
      'standard-konzert': '',
      'standard-tranzit': ''
    });
  });

  ipcMain.handle('save-bestueckung-total-price', (event, bestueckungKey, price) => {
    const prices = store.get('bestueckungTotalPrices', {
      'standard-konzert': '',
      'standard-tranzit': ''
    });
    prices[bestueckungKey] = price;
    store.set('bestueckungTotalPrices', prices);
    return true;
  });

  // IPC Handlers for Bestückung Pricing Types
  ipcMain.handle('get-bestueckung-pricing-types', () => {
    return store.get('bestueckungPricingTypes', {
      'standard-konzert': 'pauschale',
      'standard-tranzit': 'pauschale'
    });
  });

  ipcMain.handle('save-bestueckung-pricing-type', (event, bestueckungKey, pricingType) => {
    const types = store.get('bestueckungPricingTypes', {
      'standard-konzert': 'pauschale',
      'standard-tranzit': 'pauschale'
    });
    types[bestueckungKey] = pricingType;
    store.set('bestueckungPricingTypes', types);
    return true;
  });
}

module.exports = { registerCatalogHandlers };

