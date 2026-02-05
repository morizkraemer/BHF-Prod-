import { gaesteFields, gaesteTimeSlotColumns } from 'shared/eventFormSchema';

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  return String(value);
}

export default function GaesteSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const slots = Array.isArray(safe.abendkasseTimeSlots) ? safe.abendkasseTimeSlots : [];
  return (
    <div className="section-blocks">
      <div className="section-block">
        <table className="section-table">
          <tbody>
            {gaesteFields.map(({ key, label }) => (
              <tr key={key}>
                <th>{label}</th>
                <td>{formatValue(safe[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-block">
        <h3 className="section-subtitle">Abendkasse Zeiträume</h3>
        <table className="section-table">
          <thead>
            <tr>
              {gaesteTimeSlotColumns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr><td colSpan={gaesteTimeSlotColumns.length} className="section-empty">Keine Einträge.</td></tr>
            ) : (
              slots.map((slot, i) => (
                <tr key={i}>
                  {gaesteTimeSlotColumns.map((c) => (
                    <td key={c.key}>{slot[c.key] ?? '–'}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
