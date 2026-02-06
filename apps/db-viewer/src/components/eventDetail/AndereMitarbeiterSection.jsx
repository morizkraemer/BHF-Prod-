import { calculateDuration } from '../../utils/durationUtil';

export default function AndereMitarbeiterSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const list = Array.isArray(safe.mitarbeiter) ? safe.mitarbeiter : [];
  return (
    <table className="section-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Start</th>
          <th>Ende</th>
          <th>Dauer</th>
          <th>Kategorie</th>
          <th>Lohn</th>
        </tr>
      </thead>
      <tbody>
        {list.length === 0 ? (
          <tr><td colSpan={6} className="section-empty">Keine Einträge.</td></tr>
        ) : (
          list.map((person, i) => (
            <tr key={i}>
              <td>{person.name ?? '–'}</td>
              <td>{person.startTime ?? '–'}</td>
              <td>{person.endTime ?? '–'}</td>
              <td>{calculateDuration(person.startTime, person.endTime)}</td>
              <td>{person.category ?? '–'}</td>
              <td>{person.wage != null && person.wage !== '' ? person.wage : '–'}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
