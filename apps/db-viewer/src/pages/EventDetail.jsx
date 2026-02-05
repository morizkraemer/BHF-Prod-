import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEvent, getEventDocuments, getDocumentUrl } from '../api';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formDataOpen, setFormDataOpen] = useState(false);

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

  if (loading) return <div className="loading">Laden…</div>;
  if (error) return <div className="error">Fehler: {error}</div>;
  if (!event) return <div className="error">Event nicht gefunden.</div>;

  const docUrl = (docId) => getDocumentUrl(docId);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{event.eventName ?? 'Event'}</h1>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Details</h2>
        <table style={{ maxWidth: 480 }}>
          <tbody>
            <tr><th style={{ width: 120 }}>Datum</th><td>{event.eventDate ?? '–'}</td></tr>
            <tr><th>Phase</th><td>{event.phase ?? '–'}</td></tr>
            <tr><th>Doors</th><td>{event.doorsTime ?? '–'}</td></tr>
            <tr><th>Erstellt</th><td>{event.createdAt ? new Date(event.createdAt).toLocaleString() : '–'}</td></tr>
            <tr><th>Aktualisiert</th><td>{event.updatedAt ? new Date(event.updatedAt).toLocaleString() : '–'}</td></tr>
          </tbody>
        </table>
      </section>

      {event.formData && Object.keys(event.formData).length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <button type="button" onClick={() => setFormDataOpen(!formDataOpen)}>
            {formDataOpen ? 'Formular-Daten ausblenden' : 'Formular-Daten anzeigen'}
          </button>
          {formDataOpen && (
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
          <table>
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
