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
              <th>Von</th>
              <th>Bis</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map((p, i) => (
              (p.name || p.startTime || p.endTime) ? (
                <tr key={i}>
                  <td>{p.name ?? '–'}</td>
                  <td>{p.role ?? '–'}</td>
                  <td>{p.startTime ?? '–'}</td>
                  <td>{p.endTime ?? '–'}</td>
                </tr>
              ) : null
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
