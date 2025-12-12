const { useState, useEffect } = React;

function OrderbirdForm({ formData, onDataChange, highlightedFields = [] }) {
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [receipts, setReceipts] = useState(formData?.receipts || []);
  const [zBericht, setZBericht] = useState(formData?.zBericht || false);
  const [benutzerberichte, setBenutzerberichte] = useState(formData?.benutzerberichte || false);
  const [veranstalter1, setVeranstalter1] = useState(formData?.veranstalter1 || false);
  const [veranstalter2, setVeranstalter2] = useState(formData?.veranstalter2 || false);
  const [veranstalter3, setVeranstalter3] = useState(formData?.veranstalter3 || false);
  const [agentur, setAgentur] = useState(formData?.agentur || false);
  const [persoBeleg, setPersoBeleg] = useState(formData?.persoBeleg || false);
  const [sonstige, setSonstige] = useState(formData?.sonstige || false);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ 
        receipts,
        zBericht,
        benutzerberichte,
        veranstalter1,
        veranstalter2,
        veranstalter3,
        agentur,
        persoBeleg,
        sonstige
      });
    }
  }, [receipts, zBericht, benutzerberichte, veranstalter1, veranstalter2, veranstalter3, agentur, persoBeleg, sonstige]);

  const handleDocumentsChange = (updatedDocuments) => {
    setReceipts(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="orderbird-form">
        {/* Scanner Section in Box */}
        <div className={`scanner-box ${shouldHighlight('Belege Scans') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={receipts}
            onDocumentsChange={handleDocumentsChange}
            showFileSelect={false}
            showScannedList={true}
            className="orderbird-scanner"
            defaultSource="glass"
            title="Belege scannen"
            scanName="Orderbird-Belege"
          />
        </div>

        {/* Checkboxes Section */}
        <div className="orderbird-checkboxes">
          <h3>Belegarten</h3>
          <div className="checkbox-grid">
            <label className={`checkbox-label ${shouldHighlight('Z Bericht') ? 'field-highlighted-group' : ''}`}>
              <input
                type="checkbox"
                checked={zBericht}
                onChange={(e) => setZBericht(e.target.checked)}
                className="orderbird-checkbox"
                required
              />
              <span className="checkbox-text">Z Bericht *</span>
            </label>
            <label className={`checkbox-label ${shouldHighlight('Benutzerberichte') ? 'field-highlighted-group' : ''}`}>
              <input
                type="checkbox"
                checked={benutzerberichte}
                onChange={(e) => setBenutzerberichte(e.target.checked)}
                className="orderbird-checkbox"
                required
              />
              <span className="checkbox-text">Benutzerberichte *</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={veranstalter1}
                onChange={(e) => setVeranstalter1(e.target.checked)}
                className="orderbird-checkbox"
              />
              <span className="checkbox-text">Veranstalter 1</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={veranstalter2}
                onChange={(e) => setVeranstalter2(e.target.checked)}
                className="orderbird-checkbox"
              />
              <span className="checkbox-text">Veranstalter 2</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={veranstalter3}
                onChange={(e) => setVeranstalter3(e.target.checked)}
                className="orderbird-checkbox"
              />
              <span className="checkbox-text">Veranstalter 3</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agentur}
                onChange={(e) => setAgentur(e.target.checked)}
                className="orderbird-checkbox"
              />
              <span className="checkbox-text">Agentur</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={persoBeleg}
                onChange={(e) => setPersoBeleg(e.target.checked)}
                className="orderbird-checkbox"
              />
              <span className="checkbox-text">Perso Beleg</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={sonstige}
                onChange={(e) => setSonstige(e.target.checked)}
                className="orderbird-checkbox"
              />
              <span className="checkbox-text">Sonstige</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

