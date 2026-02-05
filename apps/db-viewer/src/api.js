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

// --- Catalogs: wage options, person wages, person names ---
export async function getWageOptions() {
  return request('/api/catalogs/wage-options');
}

export async function putWageOptions(labels) {
  return request('/api/catalogs/wage-options', {
    method: 'PUT',
    body: JSON.stringify(Array.isArray(labels) ? labels : []),
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
