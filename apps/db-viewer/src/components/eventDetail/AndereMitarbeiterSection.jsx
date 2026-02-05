import { andereMitarbeiterColumns } from 'shared/eventFormSchema';

export default function AndereMitarbeiterSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const list = Array.isArray(safe.mitarbeiter) ? safe.mitarbeiter : [];
  return (
    <table className="section-table">
      <thead>
        <tr>
          {andereMitarbeiterColumns.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.length === 0 ? (
          <tr><td colSpan={andereMitarbeiterColumns.length} className="section-empty">Keine Einträge.</td></tr>
        ) : (
          list.map((person, i) => (
            <tr key={i}>
              {andereMitarbeiterColumns.map((c) => (
                <td key={c.key}>{person[c.key] ?? '–'}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
