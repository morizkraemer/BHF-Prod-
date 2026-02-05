import { secuColumns } from 'shared/eventFormSchema';

export default function SecuSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const list = Array.isArray(safe.securityPersonnel) ? safe.securityPersonnel : [];
  return (
    <table className="section-table">
      <thead>
        <tr>
          {secuColumns.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.length === 0 ? (
          <tr><td colSpan={secuColumns.length} className="section-empty">Keine Einträge.</td></tr>
        ) : (
          list.map((person, i) => (
            <tr key={i}>
              {secuColumns.map((c) => (
                <td key={c.key}>{person[c.key] ?? '–'}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
