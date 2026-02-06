import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEvent, getEventDocuments, getDocumentUrl, updateEvent, finishEvent, uploadEventDocument, getRiderItems, postRiderItem } from '../api';
import { sections } from 'shared/eventFormSchema';
import UebersichtSection from '../components/eventDetail/UebersichtSection';
import RiderExtrasSection from '../components/eventDetail/RiderExtrasSection';
import TontechnikerSection from '../components/eventDetail/TontechnikerSection';
import SecuSection from '../components/eventDetail/SecuSection';
import AndereMitarbeiterSection from '../components/eventDetail/AndereMitarbeiterSection';
import GaesteSection from '../components/eventDetail/GaesteSection';
import KassenSection from '../components/eventDetail/KassenSection';

const STATUS_LABELS = { open: 'Offen', closed: 'Geschlossen', finished: 'Abgeschlossen' };

/** Section IDs that are shown in post prod (Zeiterfassung/Löhne + Rider Items) – hide their read-only blocks below. */
const SECTIONS_REPLICATED_IN_POST_PROD = new Set(['rider-extras', 'tontechniker', 'secu', 'andere-mitarbeiter']);

const SECTION_COMPONENTS = {
  'uebersicht': UebersichtSection,
  'rider-extras': RiderExtrasSection,
  'tontechniker': TontechnikerSection,
  'secu': SecuSection,
  'andere-mitarbeiter': AndereMitarbeiterSection,
  'gaeste': GaesteSection,
  'kassen': KassenSection,
};

function parseTimeToHours(timeStr) {
  if (!timeStr || String(timeStr).trim() === '') return null;
  const m = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = m[3] ? parseInt(m[3], 10) : 0;
  return h + min / 60 + sec / 3600;
}

function computeHours(von, bis) {
  const start = parseTimeToHours(von);
  const end = parseTimeToHours(bis);
  if (start == null || end == null) return null;
  let hours = end - start;
  if (hours < 0) hours += 24;
  return Math.round(hours * 100) / 100;
}

/** Build flat wage rows from formData for post-prod table (sectionKey, index, name, role, startTime, endTime, hours, wage, amount). */
function buildWageRows(formData) {
  const rows = [];
  const eventDate = formData.uebersicht?.date || '';
  (formData.secu?.securityPersonnel || []).forEach((p, i) => {
    const name = (p.name || '').trim();
    if (!name) return;
    const start = p.startTime || '';
    const end = p.endTime || '';
    const hours = computeHours(start, end);
    const wage = typeof p.wage === 'number' ? p.wage : (p.wage != null && p.wage !== '' ? Number(p.wage) : null);
    const amount = hours != null && wage != null && Number.isFinite(wage) ? Math.round(hours * wage * 100) / 100 : null;
    rows.push({ sectionKey: 'secu', index: i, name, role: 'Secu', startTime: start, endTime: end, hours, wage: wage ?? '', amount, category: '' });
  });
  (formData.tontechniker?.personnel || []).forEach((p, i) => {
    const name = (p.name || '').trim();
    if (!name) return;
    const start = p.startTime || '';
    const end = p.endTime || '';
    const hours = computeHours(start, end);
    const role = (p.role || '').trim() || 'Ton/Licht';
    const wage = typeof p.wage === 'number' ? p.wage : (p.wage != null && p.wage !== '' ? Number(p.wage) : null);
    const amount = hours != null && wage != null && Number.isFinite(wage) ? Math.round(hours * wage * 100) / 100 : null;
    rows.push({ sectionKey: 'tontechniker', index: i, name, role, startTime: start, endTime: end, hours, wage: wage ?? '', amount, category: '' });
  });
  (formData['andere-mitarbeiter']?.mitarbeiter || []).forEach((p, i) => {
    const name = (p.name || '').trim();
    if (!name) return;
    const start = p.startTime || '';
    const end = p.endTime || '';
    const hours = computeHours(start, end);
    const wage = typeof p.wage === 'number' ? p.wage : (p.wage != null && p.wage !== '' ? Number(p.wage) : null);
    const amount = hours != null && wage != null && Number.isFinite(wage) ? Math.round(hours * wage * 100) / 100 : null;
    rows.push({ sectionKey: 'andere-mitarbeiter', index: i, name, role: 'Andere Mitarbeiter', startTime: start, endTime: end, hours, wage: wage ?? '', amount, category: (p.category || '').trim() });
  });
  return rows;
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postProdError, setPostProdError] = useState(null);
  const [riderItemsCatalog, setRiderItemsCatalog] = useState([]);
  const [riderAddAmount, setRiderAddAmount] = useState(1);
  const [riderSearchQuery, setRiderSearchQuery] = useState('');
  const [riderSearchOpen, setRiderSearchOpen] = useState(false);
  const [savingNewRider, setSavingNewRider] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getEvent(id), getEventDocuments(id)])
      .then(([ev, docs]) => {
        if (!cancelled) {
          setEvent(ev);
          setDocuments(Array.isArray(docs) ? docs : []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Fehler beim Laden');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (event?.status === 'closed') {
      getRiderItems()
        .then((list) => setRiderItemsCatalog(Array.isArray(list) ? list : []))
        .catch(() => setRiderItemsCatalog([]));
    }
  }, [event?.status]);

  if (loading) return <div className="loading">Laden…</div>;
  if (error) return <div className="error">Fehler: {error}</div>;
  if (!event) return <div className="error">Event nicht gefunden.</div>;

  const docUrl = (docId) => getDocumentUrl(docId);
  const formData = event.formData || {};
  const wageRows = buildWageRows(formData);
  const status = event.status || 'open';

  const refetchDocuments = () => id && getEventDocuments(id).then(setDocuments).catch(() => {});

  const handleSaveEdit = async (payload) => {
    if (!editRow || !id) return;
    setPostProdError(null);
    const fd = JSON.parse(JSON.stringify(formData));
    const sectionKey = editRow.sectionKey;
    const idx = editRow.index;
    if (sectionKey === 'secu' && fd.secu?.securityPersonnel?.[idx]) {
      Object.assign(fd.secu.securityPersonnel[idx], payload);
    } else if (sectionKey === 'tontechniker' && fd.tontechniker?.personnel?.[idx]) {
      Object.assign(fd.tontechniker.personnel[idx], payload);
    } else if (sectionKey === 'andere-mitarbeiter' && fd['andere-mitarbeiter']?.mitarbeiter?.[idx]) {
      Object.assign(fd['andere-mitarbeiter'].mitarbeiter[idx], payload);
    }
    try {
      const updated = await updateEvent(id, { formData: fd });
      setEvent(updated);
      setEditRow(null);
    } catch (err) {
      setPostProdError(err.message || 'Fehler beim Speichern');
    }
  };

  const handleFinish = async () => {
    if (!id || finishing) return;
    setPostProdError(null);
    setFinishing(true);
    try {
      await finishEvent(id);
      const updated = await getEvent(id);
      setEvent(updated);
    } catch (err) {
      setPostProdError(err.message || 'Fehler beim Abschließen');
    } finally {
      setFinishing(false);
    }
  };

  const handleUploadPdf = async (file, sectionOrName) => {
    if (!id || !file || uploading) return;
    setPostProdError(null);
    setUploading(true);
    try {
      await uploadEventDocument(id, file, sectionOrName || null);
      await refetchDocuments();
    } catch (err) {
      setPostProdError(err.message || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const riderExtrasItems = Array.isArray(formData['rider-extras']?.items) ? formData['rider-extras'].items : [];
  const riderItemIdsInEvent = new Set(riderExtrasItems.map((i) => i.riderItemId).filter(Boolean));
  const riderCatalogAvailable = riderItemsCatalog.filter((c) => !riderItemIdsInEvent.has(c.id));
  const riderSearchLower = (riderSearchQuery || '').trim().toLowerCase();
  const riderSearchSuggestions = riderSearchLower
    ? riderCatalogAvailable.filter((c) => (c.name || '').toLowerCase().includes(riderSearchLower))
    : riderCatalogAvailable;
  const showCreateNew = riderSearchLower.length > 0 && !riderSearchSuggestions.some((c) => (c.name || '').toLowerCase() === riderSearchLower);

  const handleAddRiderItem = async (riderItemId, amount) => {
    const idToAdd = riderItemId ?? null;
    const amt = amount != null ? Number(amount) : Number(riderAddAmount) || 1;
    if (!id || !idToAdd) return;
    setPostProdError(null);
    const fd = JSON.parse(JSON.stringify(formData));
    if (!fd['rider-extras']) fd['rider-extras'] = {};
    if (!Array.isArray(fd['rider-extras'].items)) fd['rider-extras'].items = [];
    fd['rider-extras'].items.push({
      riderItemId: idToAdd,
      amount: amt,
      discount: '',
      checked: false
    });
    try {
      const updated = await updateEvent(id, { formData: fd });
      setEvent(updated);
      setRiderSearchQuery('');
      setRiderSearchOpen(false);
    } catch (err) {
      setPostProdError(err.message || 'Fehler beim Hinzufügen');
    }
  };

  const handleCreateAndAddRiderItem = async () => {
    const name = (riderSearchQuery || '').trim();
    if (!name || !id || savingNewRider) return;
    setPostProdError(null);
    setSavingNewRider(true);
    try {
      const item = await postRiderItem({
        name,
        price: 0,
        ekPrice: null,
        category: 'Extra',
      });
      const updatedCatalog = await getRiderItems();
      setRiderItemsCatalog(Array.isArray(updatedCatalog) ? updatedCatalog : []);
      const amt = Number(riderAddAmount) || 1;
      await handleAddRiderItem(item.id, amt);
      setRiderSearchQuery('');
      setRiderSearchOpen(false);
    } catch (err) {
      setPostProdError(err.message || 'Fehler beim Anlegen');
    } finally {
      setSavingNewRider(false);
    }
  };

  const handleRemoveRiderItem = async (index) => {
    if (!id) return;
    setPostProdError(null);
    const fd = JSON.parse(JSON.stringify(formData));
    if (!Array.isArray(fd['rider-extras']?.items)) return;
    fd['rider-extras'].items = fd['rider-extras'].items.filter((_, i) => i !== index);
    try {
      const updated = await updateEvent(id, { formData: fd });
      setEvent(updated);
    } catch (err) {
      setPostProdError(err.message || 'Fehler beim Entfernen');
    }
  };

  const resolveRiderItemName = (riderItemId) => {
    const cat = riderItemsCatalog.find((c) => c.id === riderItemId);
    return cat ? cat.name : (riderItemId || '–');
  };

  const resolveRiderItemPrice = (item) => {
    const cat = riderItemsCatalog.find((c) => c.id === item.riderItemId);
    if (!cat) return null;
    if (item.discount === 'EK' && cat.ekPrice != null) return cat.ekPrice;
    if (item.discount && typeof item.discount === 'string') {
      const pct = parseFloat(item.discount);
      if (!isNaN(pct)) return (cat.price ?? 0) * (1 - pct / 100);
    }
    return cat.price ?? 0;
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{event.eventName ?? 'Event'}</h1>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Details</h2>
        <table style={{ maxWidth: 480 }} className="section-table">
          <tbody>
            <tr><th style={{ width: 120 }}>Datum</th><td>{event.eventDate ?? '–'}</td></tr>
            <tr><th>Status</th><td>{STATUS_LABELS[status] ?? status ?? '–'}</td></tr>
            <tr><th>Phase</th><td>{event.phase ?? '–'}</td></tr>
            <tr><th>Doors</th><td>{event.doorsTime ?? '–'}</td></tr>
            <tr><th>Erstellt</th><td>{event.createdAt ? new Date(event.createdAt).toLocaleString() : '–'}</td></tr>
            <tr><th>Aktualisiert</th><td>{event.updatedAt ? new Date(event.updatedAt).toLocaleString() : '–'}</td></tr>
          </tbody>
        </table>
      </section>

      {status === 'finished' && (
        <section style={{ marginBottom: 24, padding: 12, background: '#e8f5e9', borderRadius: 8 }}>
          <strong>Abgeschlossen</strong> – Event wurde abgeschlossen (PDFs und Zeiterfassung wurden erstellt).
        </section>
      )}

      {status === 'closed' && (
        <section style={{ marginBottom: 24 }} className="post-prod-section">
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Post prod</h2>
          {postProdError && <p style={{ color: '#c62828', marginBottom: 8 }}>{postProdError}</p>}

          <h3 style={{ fontSize: 14, marginBottom: 6 }}>Zeiterfassung / Löhne</h3>
          {wageRows.length === 0 ? (
            <p style={{ color: '#666' }}>Keine Zeiterfassungs-Einträge.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table className="section-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rolle</th>
                    <th>Von</th>
                    <th>Bis</th>
                    <th>Stunden</th>
                    <th>Lohn (€/h)</th>
                    <th>Betrag</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {wageRows.map((row, i) => (
                    <tr key={`${row.sectionKey}-${row.index}`}>
                      <td>{row.name}</td>
                      <td>{row.role}</td>
                      <td>{row.startTime || '–'}</td>
                      <td>{row.endTime || '–'}</td>
                      <td>{row.hours != null ? row.hours : '–'}</td>
                      <td>{row.wage !== '' ? row.wage : '–'}</td>
                      <td>{row.amount != null ? row.amount : '–'}</td>
                      <td>
                        <button type="button" onClick={() => setEditRow({ ...row })}>Bearbeiten</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ fontSize: 14, marginBottom: 6 }}>Rider Items</h3>
          <div style={{ marginBottom: 16 }}>
            {riderExtrasItems.length === 0 ? (
              <p style={{ color: '#666' }}>Keine Rider-Items.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                <table className="section-table">
                  <thead>
                    <tr>
                      <th>Menge</th>
                      <th>Bezeichnung</th>
                      <th>Preis (€)</th>
                      <th>Summe (€)</th>
                      <th>Rabatt</th>
                      <th>Eingebongt</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {riderExtrasItems.map((item, i) => {
                      const unitPrice = resolveRiderItemPrice(item);
                      const amount = Number(item.amount) || 1;
                      const sum = unitPrice != null ? Math.round(amount * unitPrice * 100) / 100 : null;
                      return (
                        <tr key={`${item.riderItemId}-${i}`}>
                          <td>{item.amount ?? 1}</td>
                          <td>{resolveRiderItemName(item.riderItemId)}</td>
                          <td>{unitPrice != null ? unitPrice.toFixed(2) : '–'}</td>
                          <td>{sum != null ? sum.toFixed(2) : '–'}</td>
                          <td>{item.discount ?? '–'}</td>
                          <td>{item.checked ? '✓ Eingebongt' : '–'}</td>
                          <td>
                            <button type="button" onClick={() => handleRemoveRiderItem(i)}>Entfernen</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={riderSearchQuery}
                  onChange={(e) => { setRiderSearchQuery(e.target.value); setRiderSearchOpen(true); }}
                  onFocus={() => setRiderSearchOpen(true)}
                  onBlur={() => setTimeout(() => setRiderSearchOpen(false), 200)}
                  placeholder="Suchen oder neues Item anlegen…"
                  style={{ minWidth: 220 }}
                />
                {riderSearchOpen && (riderSearchSuggestions.length > 0 || showCreateNew) && (
                  <div style={{ position: 'absolute', left: 0, top: '100%', marginTop: 2, background: '#fff', border: '1px solid #ccc', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 240, overflowY: 'auto' }}>
                    {riderSearchSuggestions.map((c) => (
                      <div
                        key={c.id}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                        onMouseDown={(e) => { e.preventDefault(); handleAddRiderItem(c.id, riderAddAmount); }}
                      >
                        <span>{c.name}</span>
                        <span style={{ color: '#666', marginLeft: 8 }}>€{(c.price ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                    {showCreateNew && (
                      <div
                        style={{ padding: '8px 12px', cursor: 'pointer', background: '#f5f5f5', fontWeight: 500 }}
                        onMouseDown={(e) => { e.preventDefault(); handleCreateAndAddRiderItem(); }}
                      >
                        + &quot;{(riderSearchQuery || '').trim()}&quot; anlegen und hinzufügen
                      </div>
                    )}
                  </div>
                )}
              </div>
              <input
                type="number"
                min={0.01}
                step={1}
                value={riderAddAmount}
                onChange={(e) => setRiderAddAmount(Number(e.target.value) || 1)}
                style={{ width: 64 }}
                title="Menge"
              />
            </div>
            {riderCatalogAvailable.length === 0 && riderExtrasItems.length > 0 && riderSearchSuggestions.length === 0 && !riderSearchLower && (
              <p style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Alle Katalog-Items sind bereits hinzugefügt. Neues Item über die Suche anlegen.</p>
            )}
          </div>

          <h3 style={{ fontSize: 14, marginBottom: 6 }}>Weitere PDFs hochladen</h3>
          <div style={{ marginBottom: 16 }}>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadPdf(file);
                e.target.value = '';
              }}
              disabled={uploading}
            />
            {uploading && <span style={{ marginLeft: 8 }}>Wird hochgeladen…</span>}
          </div>

          <button type="button" onClick={handleFinish} disabled={finishing} style={{ padding: '8px 16px', fontWeight: 'bold' }}>
            {finishing ? 'Wird abgeschlossen…' : 'Event abschließen'}
          </button>
        </section>
      )}

      {editRow != null && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditRow(null)}>
          <div className="modal" style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Zeile bearbeiten</h3>
            <form onSubmit={(e) => { e.preventDefault(); const f = e.target; handleSaveEdit({ name: f.name.value.trim(), role: f.role?.value?.trim() || editRow.role, startTime: f.startTime.value.trim(), endTime: f.endTime.value.trim(), wage: f.wage.value === '' ? undefined : Number(f.wage.value), category: f.category?.value?.trim() || '' }); }}>
              <table className="section-table">
                <tbody>
                  <tr><th>Name</th><td><input name="name" defaultValue={editRow.name} required /></td></tr>
                  <tr><th>Rolle</th><td><input name="role" defaultValue={editRow.role} /></td></tr>
                  <tr><th>Von</th><td><input name="startTime" defaultValue={editRow.startTime} placeholder="HH:MM" /></td></tr>
                  <tr><th>Bis</th><td><input name="endTime" defaultValue={editRow.endTime} placeholder="HH:MM" /></td></tr>
                  <tr><th>Lohn (€/h)</th><td><input name="wage" type="number" step="0.01" defaultValue={editRow.wage !== '' ? editRow.wage : ''} /></td></tr>
                  {editRow.sectionKey === 'andere-mitarbeiter' && <tr><th>Kategorie</th><td><input name="category" defaultValue={editRow.category} /></td></tr>}
                </tbody>
              </table>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button type="submit">Speichern</button>
                <button type="button" onClick={() => setEditRow(null)}>Abbrechen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sections.filter((s) => !SECTIONS_REPLICATED_IN_POST_PROD.has(s.id)).map(({ id: sectionId, name: sectionName }) => {
        const data = formData[sectionId] ?? {};
        const SectionComponent = SECTION_COMPONENTS[sectionId];
        if (!SectionComponent) return null;
        return (
          <section key={sectionId} className="event-detail-section" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 8 }}>{sectionName}</h2>
            <SectionComponent data={data} />
          </section>
        );
      })}

      {event.formData && Object.keys(event.formData).length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <button type="button" onClick={() => setRawJsonOpen(!rawJsonOpen)}>
            {rawJsonOpen ? 'Rohdaten (JSON) ausblenden' : 'Rohdaten (JSON) anzeigen'}
          </button>
          {rawJsonOpen && (
            <pre style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
              {JSON.stringify(event.formData, null, 2)}
            </pre>
          )}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Dokumente</h2>
        {documents.length === 0 ? (
          <p style={{ color: '#666' }}>Keine Dokumente.</p>
        ) : (
          <table className="section-table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Abschnitt / Name</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.type ?? '–'}</td>
                  <td>{doc.sectionOrName ?? '–'}</td>
                  <td>
                    <a href={docUrl(doc.id)} target="_blank" rel="noopener noreferrer">
                      Öffnen
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
