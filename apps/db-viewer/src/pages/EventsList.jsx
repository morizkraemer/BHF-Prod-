import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent, exportEventZip } from '../api';
import DateRangeDropdown from '../components/DateRangeDropdown';

const STATUS_LABELS = {
  open: 'Offen',
  closed: 'Geschlossen',
  checked: 'Daten geprüft',
  finished: 'Abgeschlossen',
  archived: 'Archiviert',
};

const ROW_BG = {
  open: '#e0f2fe',
  closed: '#fef3c7',
  checked: '#d1fae5',
  finished: '#ffffff',
  archived: '#ffffff',
};

const EVENT_TYPE_LABELS = { konzert: 'Konzert', club: 'Club', andere: 'Andere', einmietung: 'Einmietung' };

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [exportError, setExportError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Backend nicht erreichbar');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const eventType = (e) => e.formData?.uebersicht?.eventType ?? null;
  const eventTypeLabel = (e) => EVENT_TYPE_LABELS[eventType(e)] ?? eventType(e) ?? '–';
  const filtered = events.filter((e) => {
    const status = e.status || 'open';
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) return false;
    if (fromDate && (e.eventDate || '') < fromDate) return false;
    if (toDate && (e.eventDate || '') > toDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const name = (e.eventName ?? '').toLowerCase();
      const type = eventTypeLabel(e).toLowerCase();
      const date = (e.eventDate ?? '').toLowerCase();
      if (!name.includes(q) && !type.includes(q) && !date.includes(q)) return false;
    }
    return true;
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setDeleteError(null);
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err) {
      if (err.status === 409) {
        setDeleteError('Nur offene Events können gelöscht werden.');
      } else {
        setDeleteError(err.message || 'Löschen fehlgeschlagen.');
      }
    }
  };

  const handleExportZip = async (e, eventId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setExportError(null);
    setExportingId(eventId);
    try {
      await exportEventZip(eventId);
    } catch (err) {
      setExportError(err.message || 'ZIP-Export fehlgeschlagen.');
    } finally {
      setExportingId(null);
    }
  };

  const canExportZip = (status) => ['checked', 'finished', 'archived'].includes(status || '');

  if (loading) return <div className="loading">Laden…</div>;
  if (error) return <div className="error">Fehler: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', minHeight: 0 }}>
      <h1 style={{ marginTop: 0, flexShrink: 0 }}>Events</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Events suchen"
          style={{ padding: '4px 8px', minWidth: 180 }}
        />
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen((open) => !open)}
            style={{
              padding: '4px 10px',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Status{selectedStatuses.length > 0 ? ` (${selectedStatuses.length})` : ''} ▾
          </button>
          {statusDropdownOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setStatusDropdownOpen(false)}
                aria-hidden
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: 4,
                  padding: 8,
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 11,
                  minWidth: 160,
                }}
              >
                {(Object.entries(STATUS_LABELS)).map(([value, label]) => (
                  <label
                    key={value}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(value)}
                      onChange={() => {
                        setSelectedStatuses((prev) =>
                          prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
                        );
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <DateRangeDropdown
          fromDate={fromDate}
          toDate={toDate}
          onChange={({ from, to }) => {
            setFromDate(from);
            setToDate(to);
          }}
        />
      </div>
      {(deleteError || exportError) && (
        <p style={{ marginBottom: 16, color: '#b91c1c', flexShrink: 0 }}>{deleteError || exportError}</p>
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Event Typ</th>
              <th>Event Name</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr
                key={e.id}
                onClick={() => navigate(`/events/${e.id}`)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: ROW_BG[e.status] ?? 'transparent',
                }}
              >
                <td>{e.eventDate ?? '–'}</td>
                <td>{eventTypeLabel(e)}</td>
                <td>{e.eventName ?? '–'}</td>
                <td>{STATUS_LABELS[e.status] ?? e.status ?? '–'}</td>
                <td onClick={(ev) => ev.stopPropagation()} style={{ width: 40, padding: 4 }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setOpenMenuId((id) => (id === e.id ? null : e.id));
                        setDeleteError(null);
                        setExportError(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                      aria-label="Menü öffnen"
                    >
                      ⋮
                    </button>
                    {openMenuId === e.id && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10,
                          }}
                          onClick={() => setOpenMenuId(null)}
                          aria-hidden
                        />
                        <ul
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            margin: 0,
                            padding: 4,
                            listStyle: 'none',
                            background: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: 6,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 11,
                            minWidth: 160,
                          }}
                        >
                          {canExportZip(e.status) && (
                            <li>
                              <button
                                type="button"
                                onClick={(ev) => handleExportZip(ev, e.id)}
                                disabled={exportingId === e.id}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px 12px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: exportingId === e.id ? 'wait' : 'pointer',
                                }}
                              >
                                {exportingId === e.id ? 'Wird erstellt…' : 'Als ZIP herunterladen'}
                              </button>
                            </li>
                          )}
                          <li>
                            <button
                              type="button"
                              onClick={(ev) => handleDelete(ev, e.id)}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                textAlign: 'left',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#b91c1c',
                              }}
                            >
                              Löschen
                            </button>
                          </li>
                        </ul>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p style={{ color: '#666', flexShrink: 0 }}>Keine Events gefunden.</p>}
    </div>
  );
}
