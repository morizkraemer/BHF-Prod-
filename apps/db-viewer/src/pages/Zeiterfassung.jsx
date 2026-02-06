import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { getZeiterfassung } from '../api';
import DateRangeDropdown from '../components/DateRangeDropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const euroFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

function formatEuro(value) {
  const n = Number(value);
  if (value == null || value === '' || Number.isNaN(n)) return '–';
  return euroFormatter.format(n);
}

function formatHours(value) {
  const n = Number(value);
  if (value == null || value === '' || Number.isNaN(n)) return '–';
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTimeframeLabel(fromDate, toDate) {
  if (!fromDate && !toDate) return 'nicht gewählt';
  const from = fromDate && isValid(parseISO(fromDate)) ? format(parseISO(fromDate), 'dd.MM.yyyy', { locale: de }) : null;
  const to = toDate && isValid(parseISO(toDate)) ? format(parseISO(toDate), 'dd.MM.yyyy', { locale: de }) : null;
  if (from && to) return `${from} – ${to}`;
  if (from) return `${from} – …`;
  if (to) return `… – ${to}`;
  return 'nicht gewählt';
}

export default function Zeiterfassung() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [eventSearch, setEventSearch] = useState('');

  const fetchEntries = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    getZeiterfassung(params)
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Backend nicht erreichbar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, [fromDate, toDate]);

  const uniqueRoles = useMemo(
    () => [...new Set(entries.map((e) => e.role).filter(Boolean))].sort(),
    [entries]
  );
  const uniquePersons = useMemo(
    () => [...new Set(entries.map((e) => e.personName).filter(Boolean))].sort(),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const eventQ = eventSearch.trim().toLowerCase();
    return entries.filter((e) => {
      if (selectedRoles.length > 0 && !selectedRoles.includes(e.role)) return false;
      if (selectedPersons.length > 0 && !selectedPersons.includes(e.personName)) return false;
      if (eventQ && !(e.eventName ?? '').toLowerCase().includes(eventQ)) return false;
      return true;
    });
  }, [entries, selectedRoles, selectedPersons, eventSearch]);

  const totalHours = useMemo(
    () => filteredEntries.reduce((s, e) => s + (Number(e.hours) || 0), 0),
    [filteredEntries]
  );
  const totalAmount = useMemo(
    () => filteredEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [filteredEntries]
  );

  if (loading && entries.length === 0) return <div className="loading">Laden…</div>;
  if (error && entries.length === 0) return <div className="error">Fehler: {error}</div>;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 48px)',
      }}
    >
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <h1 style={{ marginTop: 0 }}>Zeiterfassung</h1>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <DateRangeDropdown
            fromDate={fromDate}
            toDate={toDate}
            onChange={({ from, to }) => {
              setFromDate(from);
              setToDate(to);
            }}
            label="Zeitraum"
          />
          <MultiSelectDropdown
            label="Position"
            options={uniqueRoles}
            selected={selectedRoles}
            onChange={setSelectedRoles}
            searchPlaceholder="Position suchen…"
          />
          <MultiSelectDropdown
            label="Person"
            options={uniquePersons}
            selected={selectedPersons}
            onChange={setSelectedPersons}
            searchPlaceholder="Person suchen…"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Event:
            <input
              type="text"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              placeholder="Event suchen…"
              style={{
                padding: '6px 10px',
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
                minWidth: 180,
              }}
            />
          </label>
        </div>
        {error && entries.length > 0 && (
          <div className="error" style={{ marginBottom: 12 }}>
            Aktualisierung fehlgeschlagen: {error}
          </div>
        )}
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Datum</th>
                <th>Person</th>
                <th>Position</th>
                <th>Kategorie</th>
                <th>Von</th>
                <th>Bis</th>
                <th>Stunden</th>
                <th>Lohn</th>
                <th style={{ borderLeft: '1px solid #e0e0e0', textAlign: 'right' }}>Betrag</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.eventName ?? '–'}</td>
                  <td>{entry.entryDate ?? '–'}</td>
                  <td>{entry.personName ?? '–'}</td>
                  <td>{entry.role ?? '–'}</td>
                  <td>{entry.category ?? '–'}</td>
                  <td>{entry.startTime ?? '–'}</td>
                  <td>{entry.endTime ?? '–'}</td>
                  <td>{formatHours(entry.hours)}</td>
                  <td>{formatEuro(entry.wage)}</td>
                  <td style={{ borderLeft: '1px solid #e0e0e0', textAlign: 'right' }}>{formatEuro(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEntries.length === 0 && !loading && (
          <p style={{ color: '#666' }}>
            {entries.length === 0 ? 'Keine Einträge gefunden.' : 'Keine Treffer für Filter.'}
          </p>
        )}
      </div>

      <footer
        role="region"
        aria-label="Zusammenfassung Zeiterfassung"
        style={{
          flexShrink: 0,
          padding: '12px 16px',
          background: '#fff',
          border: '1px solid #e0e0e0',
          zIndex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <span>
            <strong>Zeitraum:</strong> {formatTimeframeLabel(fromDate, toDate)}
          </span>
          {selectedRoles.length > 0 && (
            <span>
              <strong>Positionen:</strong> {selectedRoles.join(', ')}
            </span>
          )}
          {selectedPersons.length > 0 && (
            <span>
              <strong>Personen:</strong> {selectedPersons.join(', ')}
            </span>
          )}
          {eventSearch.trim() && (
            <span>
              <strong>Event:</strong> {eventSearch.trim()}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <span>
            <strong>Anzahl:</strong> {filteredEntries.length}
          </span>
          <span>
            <strong>Summe Stunden:</strong> {formatHours(totalHours)}
          </span>
          <span>
            <strong>Summe Betrag:</strong> {formatEuro(totalAmount)}
          </span>
        </div>
      </footer>
    </div>
  );
}
