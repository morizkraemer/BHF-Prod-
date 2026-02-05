import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../api';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phaseFilter, setPhaseFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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
    if (phaseFilter && e.phase !== phaseFilter) return false;
    if (fromDate && (e.eventDate || '') < fromDate) return false;
    if (toDate && (e.eventDate || '') > toDate) return false;
    return true;
  });

  if (loading) return <div className="loading">Laden…</div>;
  if (error) return <div className="error">Fehler: {error}</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Events</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Phase:{' '}
          <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
            <option value="">Alle</option>
            <option value="VVA">VVA</option>
            <option value="SL">SL</option>
            <option value="closed">Geschlossen</option>
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
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Event</th>
              <th>Phase</th>
              <th>Doors</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr
                key={e.id}
                onClick={() => navigate(`/events/${e.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td>{e.eventDate ?? '–'}</td>
                <td>{e.eventName ?? '–'}</td>
                <td>{e.phase ?? '–'}</td>
                <td>{e.doorsTime ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p style={{ color: '#666' }}>Keine Events gefunden.</p>}
    </div>
  );
}
