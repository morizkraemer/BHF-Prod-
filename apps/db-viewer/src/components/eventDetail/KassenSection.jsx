export default function KassenSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const receipts = Array.isArray(safe.receipts) ? safe.receipts : [];
  const abrechnungen = Array.isArray(safe.abrechnungen) ? safe.abrechnungen : [];
  return (
    <div className="section-blocks">
      <div className="section-block">
        <h3 className="section-subtitle">Belege</h3>
        <p>{receipts.length} Eintrag/Einträge.</p>
      </div>
      <div className="section-block">
        <h3 className="section-subtitle">Kassenabrechnungen</h3>
        <p>{abrechnungen.length} Eintrag/Einträge.</p>
      </div>
    </div>
  );
}
