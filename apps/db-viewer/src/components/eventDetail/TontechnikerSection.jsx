import { calculateDuration } from '../../utils/durationUtil';

export default function TontechnikerSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const personnel = Array.isArray(safe.personnel) ? safe.personnel : [];
  const hasAny = personnel.some((p) => (p.name || '').trim() || (p.startTime || '').trim() || (p.endTime || '').trim());

  if (!hasAny) {
    return (
      <div className="section-blocks">
        <div className="section-block">
          <p className="section-empty">Keine Ton/Licht-Personen erfasst.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-blocks">
      <div className="section-block">
        <h3 className="section-subtitle">Ton/Lichttechnik</h3>
        <table className="section-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rolle</th>
              <th>Start</th>
              <th>Ende</th>
              <th>Dauer</th>
            </tr>
          </thead>
          <tbody>
            {personnel
              .filter((p) => (p.name || '').trim() || (p.startTime || '').trim() || (p.endTime || '').trim())
              .map((p, i) => (
                <tr key={i}>
                  <td>{p.name ?? '–'}</td>
                  <td>{p.role ?? '–'}</td>
                  <td>{p.startTime ?? '–'}</td>
                  <td>{p.endTime ?? '–'}</td>
                  <td>{calculateDuration(p.startTime, p.endTime)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
