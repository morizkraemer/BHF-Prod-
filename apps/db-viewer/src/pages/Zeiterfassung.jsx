import { useState, useEffect } from 'react';
import { getZeiterfassung, getEvents } from '../api';

export default function Zeiterfassung() {
  const [entries, setEntries] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventId, setEventId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [role, setRole] = useState('');

  const fetchEntries = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (eventId) params.eventId = eventId;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (role) params.role = role;
    getZeiterfassung(params)
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Backend nicht erreichbar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [eventId, fromDate, toDate, role]);

  if (loading && entries.length === 0) return <div className="loading">Laden…</div>;
  if (error && entries.length === 0) return <div className="error">Fehler: {error}</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Zeiterfassung</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Event:{' '}
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Alle</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.eventDate ?? '?'} – {e.eventName ?? e.id}
              </option>
            ))}
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
        <label>
          Rolle:{' '}
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Alle</option>
            <option value="secu">Secu</option>
            <option value="ton_licht">Ton/Licht</option>
            <option value="andere">Andere</option>
          </select>
        </label>
      </div>
      {error && entries.length > 0 && <div className="error" style={{ marginBottom: 12 }}>Aktualisierung fehlgeschlagen: {error}</div>}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Datum</th>
              <th>Rolle</th>
              <th>Person</th>
              <th>Lohn</th>
              <th>Von</th>
              <th>Bis</th>
              <th>Stunden</th>
              <th>Betrag</th>
              <th>Kategorie</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.eventName ?? '–'}</td>
                <td>{entry.entryDate ?? '–'}</td>
                <td>{entry.role ?? '–'}</td>
                <td>{entry.personName ?? '–'}</td>
                <td>{entry.wage != null ? entry.wage : '–'}</td>
                <td>{entry.startTime ?? '–'}</td>
                <td>{entry.endTime ?? '–'}</td>
                <td>{entry.hours != null ? entry.hours : '–'}</td>
                <td>{entry.amount != null ? entry.amount : '–'}</td>
                <td>{entry.category ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 && !loading && <p style={{ color: '#666' }}>Keine Einträge gefunden.</p>}
    </div>
  );
}
