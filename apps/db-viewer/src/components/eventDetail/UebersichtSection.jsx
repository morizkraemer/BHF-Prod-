import { uebersichtFields } from 'shared/eventFormSchema';

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  return String(value);
}

export default function UebersichtSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const positionen = Array.isArray(safe.positionen) ? safe.positionen : [];
  const showPositionen = positionen.length > 0 && positionen.some((p) => (p.name || '').trim());

  return (
    <div className="section-blocks">
      <div className="section-block">
        <table className="section-table">
          <tbody>
            {uebersichtFields.map(({ key, label }) => (
              <tr key={key}>
                <th>{label}</th>
                <td>{formatValue(safe[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPositionen && (
        <div className="section-block" style={{ marginTop: 16 }}>
          <h3 className="section-subtitle">Positionen</h3>
          <table className="section-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Funkgerät</th>
                <th style={{ textAlign: 'center' }}>Zurückgegeben</th>
              </tr>
            </thead>
            <tbody>
              {positionen.filter((p) => (p.name || '').trim()).map((position, i) => (
                <tr key={i}>
                  <td>{formatValue(position.name)}</td>
                  <td>{formatValue(position.position)}</td>
                  <td>{formatValue(position.funkgerat)}</td>
                  <td style={{ textAlign: 'center' }}>{position.returned ? 'Ja' : 'Nein'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
