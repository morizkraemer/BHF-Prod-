import { riderExtrasItemColumns, riderExtrasSingleFields } from 'shared/eventFormSchema';

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  return String(value);
}

export default function RiderExtrasSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const items = Array.isArray(safe.items) ? safe.items : [];
  const buyoutGroups = Array.isArray(safe.buyoutGroups) ? safe.buyoutGroups : [];

  return (
    <div className="section-blocks">
      <div className="section-block">
        <h3 className="section-subtitle">Positionen</h3>
        <table className="section-table">
          <thead>
            <tr>
              {riderExtrasItemColumns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={riderExtrasItemColumns.length} className="section-empty">Keine Einträge.</td></tr>
            ) : (
              items.map((item, i) => (
                <tr key={i}>
                  {riderExtrasItemColumns.map((c) => (
                    <td key={c.key}>{formatValue(c.key === 'checked' ? (item[c.key] ? 'Ja' : 'Nein') : item[c.key])}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="section-block">
        <table className="section-table">
          <tbody>
            {riderExtrasSingleFields.map(({ key, label }) => (
              <tr key={key}>
                <th>{label}</th>
                <td>{formatValue(safe[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-block">
        <h3 className="section-subtitle">Buyout Gruppen</h3>
        <table className="section-table">
          <thead>
            <tr>
              <th>Personen</th>
              <th>Pro Person</th>
            </tr>
          </thead>
          <tbody>
            {buyoutGroups.length === 0 ? (
              <tr><td colSpan={2} className="section-empty">Keine Einträge.</td></tr>
            ) : (
              buyoutGroups.map((g, i) => (
                <tr key={i}>
                  <td>{formatValue(g.people)}</td>
                  <td>{formatValue(g.perPerson)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
