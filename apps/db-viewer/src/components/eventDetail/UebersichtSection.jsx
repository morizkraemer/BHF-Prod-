import { uebersichtFields } from 'shared/eventFormSchema';

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  return String(value);
}

export default function UebersichtSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  return (
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
  );
}
