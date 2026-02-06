import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent } from '../api';

const STATUS_LABELS = { open: 'Offen', closed: 'Geschlossen', finished: 'Abgeschlossen' };

const ROW_BG = {
  open: '#e0f2fe',
  closed: '#fef3c7',
  finished: '#d1fae5',
};

const EVENT_TYPE_LABELS = { konzert: 'Konzert', club: 'Club', andere: 'Andere', einmietung: 'Einmietung' };

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
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

  const filtered = events.filter((e) => {
    if (statusFilter && (e.status || 'open') !== statusFilter) return false;
    if (fromDate && (e.eventDate || '') < fromDate) return false;
    if (toDate && (e.eventDate || '') > toDate) return false;
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

  const eventType = (e) => e.formData?.uebersicht?.eventType ?? null;
  const eventTypeLabel = (e) => EVENT_TYPE_LABELS[eventType(e)] ?? eventType(e) ?? '–';

  if (loading) return <div className="loading">Laden…</div>;
  if (error) return <div className="error">Fehler: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', minHeight: 0 }}>
      <h1 style={{ marginTop: 0, flexShrink: 0 }}>Events</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        <label>
          Status:{' '}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Alle</option>
            <option value="open">Offen</option>
            <option value="closed">Geschlossen</option>
            <option value="finished">Abgeschlossen</option>
          </select>
        </label>
        <label>
          Von:{' '}
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label>
          Bis:{' '}
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
      </div>
      {deleteError && (
        <p style={{ marginBottom: 16, color: '#b91c1c', flexShrink: 0 }}>{deleteError}</p>
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
                            minWidth: 120,
                          }}
                        >
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
