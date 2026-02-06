/**
 * API client for DB viewer. Base URL: VITE_API_URL or '' (relative for Docker proxy).
 */

const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Fehler ${res.status}`);
    err.status = res.status;
    let msg;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (_) {}
    err.message = msg || err.message;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getEvents() {
  return request('/api/events');
}

export async function getEvent(id) {
  return request(`/api/events/${id}`);
}

export async function updateEvent(id, body) {
  return request(`/api/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function getEventDocuments(eventId) {
  return request(`/api/events/${eventId}/documents`);
}

/** Finish event (post prod): run PDF/Zeiterfassung generation, set status = finished. */
export async function finishEvent(id) {
  return request(`/api/events/${id}/finish`, { method: 'POST' });
}

/** Upload a document (PDF) for an event. Optional sectionOrName (e.g. "Belege", "Zusätzlich"). */
export async function uploadEventDocument(eventId, file, sectionOrName = null) {
  const url = `${baseUrl}/api/events/${eventId}/documents`;
  const formData = new FormData();
  formData.append('file', file);
  if (sectionOrName) formData.append('sectionOrName', sectionOrName);
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Fehler ${res.status}`);
    err.status = res.status;
    let msg;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (_) {}
    err.message = msg || err.message;
    throw err;
  }
  return res.json();
}

export async function getZeiterfassung(params = {}) {
  const sp = new URLSearchParams();
  if (params.eventId) sp.set('eventId', params.eventId);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.role) sp.set('role', params.role);
  const q = sp.toString();
  return request(`/api/zeiterfassung${q ? `?${q}` : ''}`);
}

export async function getEventZeiterfassung(eventId) {
  return request(`/api/events/${eventId}/zeiterfassung`);
}

/** URL for opening a document (e.g. in new tab). */
export function getDocumentUrl(documentId) {
  const b = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${b}/api/documents/${documentId}`;
}

// --- Catalogs: roles, person wages (numeric €/h), person names ---
export async function getRoles() {
  return request('/api/catalogs/roles');
}

export async function postRole(body) {
  return request('/api/catalogs/roles', {
    method: 'POST',
    body: JSON.stringify(body || {}),
  });
}

export async function patchRole(id, body) {
  return request(`/api/catalogs/roles/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body || {}),
  });
}

export async function deleteRole(id) {
  return request(`/api/catalogs/roles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function getPersonWages() {
  return request('/api/catalogs/person-wages');
}

export async function putPersonWages(wages) {
  return request('/api/catalogs/person-wages', {
    method: 'PUT',
    body: JSON.stringify(wages && typeof wages === 'object' ? wages : {}),
  });
}

export async function getPersonNamesByType(type) {
  return request(`/api/catalogs/person-names/${encodeURIComponent(type)}`);
}

export async function removePersonName(name) {
  return request('/api/catalogs/person-names/remove', {
    method: 'POST',
    body: JSON.stringify({ name: String(name || '').trim() }),
  });
}

// --- Catalogs: rider items ---
export async function getRiderItems() {
  return request('/api/catalogs/rider-items');
}

export async function postRiderItem(body) {
  return request('/api/catalogs/rider-items', {
    method: 'POST',
    body: JSON.stringify(body || {}),
  });
}

export async function patchRiderItem(id, body) {
  return request(`/api/catalogs/rider-items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body || {}),
  });
}

export async function deleteRiderItem(id) {
  return request(`/api/catalogs/rider-items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
