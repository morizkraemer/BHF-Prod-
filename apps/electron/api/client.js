/**
 * API client for the Produktionstool backend.
 * Used from the Electron main process when serverUrl is set.
 * All methods throw on network error or non-2xx response (caller can fall back to store).
 */

const fs = require('fs');
const path = require('path');

function ensureBaseUrl(baseUrl) {
  const url = (baseUrl && typeof baseUrl === 'string') ? baseUrl.trim() : '';
  if (!url) throw new Error('No server URL');
  return url.replace(/\/$/, '');
}

async function request(baseUrl, method, pathSegments, body = null, options = {}) {
  const base = ensureBaseUrl(baseUrl);
  const pathStr = pathSegments.startsWith('/') ? pathSegments : `/${pathSegments}`;
  const url = `${base}${pathStr}`;
  const opts = {
    method,
    headers: options.headers || {}
  };
  if (body != null && typeof body === 'object' && !(body instanceof Buffer) && !(body instanceof fs.ReadStream)) {
    if (!opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (options.body !== undefined) {
    opts.body = options.body;
    if (options.headers) Object.assign(opts.headers, options.headers);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    throw new Error(`Netzwerkfehler: ${err.message || 'Server nicht erreichbar'}`);
  }
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  if (!res.ok) {
    let msg = res.statusText;
    if (isJson) {
      try {
        const data = await res.json();
        if (data && data.error) msg = data.error;
      } catch (_) {}
    }
    const err = new Error(msg || `Fehler ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  if (isJson) return res.json();
  return res.arrayBuffer();
}

// --- Health & current event ---
async function getHealth(baseUrl) {
  return request(baseUrl, 'GET', '/api/health');
}

async function getCurrentEvent(baseUrl) {
  return request(baseUrl, 'GET', '/api/current-event');
}

// --- Catalogs: rider items ---
async function getRiderItems(baseUrl) {
  return request(baseUrl, 'GET', '/api/catalogs/rider-items');
}

async function addRiderItem(baseUrl, item) {
  return request(baseUrl, 'POST', '/api/catalogs/rider-items', item);
}

async function updateRiderItem(baseUrl, itemId, updates) {
  return request(baseUrl, 'PATCH', `/api/catalogs/rider-items/${itemId}`, updates);
}

async function deleteRiderItem(baseUrl, itemId) {
  return request(baseUrl, 'DELETE', `/api/catalogs/rider-items/${itemId}`);
}

// --- Catalogs: night leads ---
async function getNightLeads(baseUrl) {
  return request(baseUrl, 'GET', '/api/catalogs/night-leads');
}

async function addNightLead(baseUrl, lead) {
  return request(baseUrl, 'POST', '/api/catalogs/night-leads', lead);
}

async function updateNightLead(baseUrl, leadId, updates) {
  return request(baseUrl, 'PATCH', `/api/catalogs/night-leads/${leadId}`, updates);
}

async function deleteNightLead(baseUrl, leadId) {
  return request(baseUrl, 'DELETE', `/api/catalogs/night-leads/${leadId}`);
}

// --- Catalogs: person names (type: secu | tech | andere) ---
async function getPersonNames(baseUrl, type) {
  return request(baseUrl, 'GET', `/api/catalogs/person-names/${type}`);
}

async function addPersonName(baseUrl, type, name) {
  return request(baseUrl, 'POST', `/api/catalogs/person-names/${type}`, { name: (name || '').trim() });
}

async function removePersonName(baseUrl, name) {
  return request(baseUrl, 'POST', '/api/catalogs/person-names/remove', { name: (name || '').trim() });
}

// --- Catalogs: bestueckung ---
async function getBestueckungLists(baseUrl) {
  return request(baseUrl, 'GET', '/api/catalogs/bestueckung-lists');
}

async function getBestueckungList(baseUrl, key) {
  return request(baseUrl, 'GET', `/api/catalogs/bestueckung-lists/${encodeURIComponent(key)}`);
}

async function putBestueckungList(baseUrl, key, body) {
  return request(baseUrl, 'PUT', `/api/catalogs/bestueckung-lists/${encodeURIComponent(key)}`, body);
}

async function patchBestueckungListMeta(baseUrl, key, body) {
  return request(baseUrl, 'PATCH', `/api/catalogs/bestueckung-lists/${encodeURIComponent(key)}/meta`, body);
}

// --- Settings ---
async function getSettings(baseUrl) {
  return request(baseUrl, 'GET', '/api/settings');
}

async function getSetting(baseUrl, key) {
  return request(baseUrl, 'GET', `/api/settings/${encodeURIComponent(key)}`);
}

async function setSetting(baseUrl, key, value) {
  return request(baseUrl, 'PUT', `/api/settings/${encodeURIComponent(key)}`, value);
}

// --- Events ---
async function getEvents(baseUrl) {
  return request(baseUrl, 'GET', '/api/events');
}

async function getEvent(baseUrl, id) {
  return request(baseUrl, 'GET', `/api/events/${id}`);
}

async function getCurrentEventFull(baseUrl) {
  const data = await request(baseUrl, 'GET', '/api/events/current');
  return data && data.currentEvent != null ? data.currentEvent : null;
}

async function createEvent(baseUrl, body) {
  return request(baseUrl, 'POST', '/api/events', body);
}

async function updateEvent(baseUrl, id, body) {
  return request(baseUrl, 'PATCH', `/api/events/${id}`, body);
}

async function closeEvent(baseUrl, id, formData) {
  return request(baseUrl, 'POST', `/api/events/${id}/close`, { formData });
}

// --- Documents ---
async function getEventDocuments(baseUrl, eventId) {
  return request(baseUrl, 'GET', `/api/events/${eventId}/documents`);
}

async function uploadEventDocument(baseUrl, eventId, filePath, options = {}) {
  ensureBaseUrl(baseUrl);
  const base = baseUrl.replace(/\/$/, '');
  const url = `${base}/api/events/${eventId}/documents`;
  const fileBuffer = await fs.promises.readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([fileBuffer], { type: options.contentType || 'application/pdf' }), path.basename(filePath));
  if (options.type) form.append('type', options.type);
  if (options.sectionOrName != null) form.append('sectionOrName', options.sectionOrName);
  if (options.metadata != null) form.append('metadata', JSON.stringify(options.metadata));
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (_) {}
    const err = new Error(msg || `Fehler ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Returns URL for streaming a document (renderer can use it with fetch or img src if same-origin). */
function getDocumentUrl(baseUrl, documentId) {
  const base = ensureBaseUrl(baseUrl);
  return `${base}/api/documents/${documentId}`;
}

module.exports = {
  ensureBaseUrl,
  getHealth,
  getCurrentEvent,
  getRiderItems,
  addRiderItem,
  updateRiderItem,
  deleteRiderItem,
  getNightLeads,
  addNightLead,
  updateNightLead,
  deleteNightLead,
  getPersonNames,
  addPersonName,
  removePersonName,
  getBestueckungLists,
  getBestueckungList,
  putBestueckungList,
  patchBestueckungListMeta,
  getSettings,
  getSetting,
  setSetting,
  getEvents,
  getEvent,
  getCurrentEventFull,
  createEvent,
  updateEvent,
  closeEvent,
  getEventDocuments,
  uploadEventDocument,
  getDocumentUrl
};
