export default function TontechnikerSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  return (
    <div className="section-blocks">
      <div className="section-block">
        <h3 className="section-subtitle">Sound</h3>
        <table className="section-table">
          <tbody>
            <tr><th>Name</th><td>{safe.soundEngineerName ?? '–'}</td></tr>
            <tr><th>Lohn</th><td>{safe.soundEngineerWage ?? '–'}</td></tr>
            <tr><th>Von</th><td>{safe.soundEngineerStartTime ?? '–'}</td></tr>
            <tr><th>Bis</th><td>{safe.soundEngineerEndTime ?? '–'}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="section-block">
        <h3 className="section-subtitle">Licht</h3>
        <table className="section-table">
          <tbody>
            <tr><th>Name</th><td>{safe.lightingTechName ?? '–'}</td></tr>
            <tr><th>Lohn</th><td>{safe.lightingTechWage ?? '–'}</td></tr>
            <tr><th>Von</th><td>{safe.lightingTechStartTime ?? '–'}</td></tr>
            <tr><th>Bis</th><td>{safe.lightingTechEndTime ?? '–'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
