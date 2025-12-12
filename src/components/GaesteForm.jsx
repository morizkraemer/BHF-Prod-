const { useState, useEffect } = React;

function GaesteForm({ formData, onDataChange }) {
  const [localData, setLocalData] = useState({
    paymentType: formData?.paymentType || 'selbstzahler',
    pauschaleOptions: formData?.pauschaleOptions || {
      standard: true,
      longdrinks: false,
      sektCocktails: false,
      shots: false
    },
    anzahlAbendkasse: formData?.anzahlAbendkasse || '',
    betragAbendkasse: formData?.betragAbendkasse || '',
    gaesteGesamt: formData?.gaesteGesamt || '',
    scannedDocuments: formData?.scannedDocuments || []
  });

  useEffect(() => {
    if (onDataChange) {
      onDataChange(localData);
    }
  }, [localData]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  const handleChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate total
  const calculateTotal = () => {
    const betrag = parseFloat(localData.betragAbendkasse || 0);
    const anzahl = parseFloat(localData.anzahlAbendkasse || 0);
    return (betrag * anzahl).toFixed(2);
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setLocalData(prev => ({
      ...prev,
      scannedDocuments: updatedDocuments
    }));
  };

  return (
    <div className="form-container">
      <div className="gaeste-form">
        {/* Payment Type Section */}
        <div className="payment-type-section">
          <div className="form-group form-group-catering-radio">
            <label className="catering-radio-label">Zahlungsart</label>
            <div className="catering-radio-buttons">
              <label className="radio-option-label">
                <input
                  type="radio"
                  name="paymentType"
                  value="selbstzahler"
                  checked={localData.paymentType === 'selbstzahler'}
                  onChange={(e) => handleChange('paymentType', e.target.value)}
                  className="catering-radio"
                />
                <span className="radio-custom"></span>
                <span className="radio-text">Selbstzahler</span>
              </label>
              <label className="radio-option-label">
                <input
                  type="radio"
                  name="paymentType"
                  value="pauschale"
                  checked={localData.paymentType === 'pauschale'}
                  onChange={(e) => handleChange('paymentType', e.target.value)}
                  className="catering-radio"
                />
                <span className="radio-custom"></span>
                <span className="radio-text">Pauschale</span>
              </label>
            </div>
          </div>

          {localData.paymentType === 'pauschale' && (
            <div className="pauschale-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localData.pauschaleOptions.standard}
                  onChange={(e) => handleChange('pauschaleOptions', { ...localData.pauschaleOptions, standard: e.target.checked })}
                  className="rider-extras-checkbox"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Standard</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localData.pauschaleOptions.longdrinks}
                  onChange={(e) => handleChange('pauschaleOptions', { ...localData.pauschaleOptions, longdrinks: e.target.checked })}
                  className="rider-extras-checkbox"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Longdrinks</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localData.pauschaleOptions.sektCocktails}
                  onChange={(e) => handleChange('pauschaleOptions', { ...localData.pauschaleOptions, sektCocktails: e.target.checked })}
                  className="rider-extras-checkbox"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Sekt-Cocktails</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localData.pauschaleOptions.shots}
                  onChange={(e) => handleChange('pauschaleOptions', { ...localData.pauschaleOptions, shots: e.target.checked })}
                  className="rider-extras-checkbox"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Shots</span>
              </label>
            </div>
          )}
        </div>

        {/* Guest Count Fields */}
        <div className="form-row form-row-abendkasse">
          {/* Anzahl and Betrag Abendkasse paired together */}
          <div className="form-group-paired-container">
            <div className="form-group form-group-paired-left">
              <label htmlFor="anzahlAbendkasse">Anzahl Abendkasse</label>
              <input
                type="number"
                id="anzahlAbendkasse"
                value={localData.anzahlAbendkasse}
                onChange={(e) => handleChange('anzahlAbendkasse', e.target.value)}
                className="form-input"
                min="0"
                placeholder="0"
              />
            </div>
            <div className="form-group form-group-paired-right">
              <label htmlFor="betragAbendkasse">Betrag Abendkasse</label>
              <input
                type="number"
                id="betragAbendkasse"
                value={localData.betragAbendkasse}
                onChange={(e) => handleChange('betragAbendkasse', e.target.value)}
                className="form-input"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Total */}
          <div className="form-group form-group-total">
            <label>Total</label>
            <div className="total-display">
              €{calculateTotal()}
            </div>
          </div>

          {/* Gäste Gesamt */}
          <div className="form-group">
            <label htmlFor="gaesteGesamt">Gäste Gesamt (GL + VVK + AK) *</label>
            <input
              type="text"
              id="gaesteGesamt"
              value={localData.gaesteGesamt}
              onChange={(e) => handleChange('gaesteGesamt', e.target.value)}
              className="form-input"
              placeholder="Gäste Gesamt"
              required
            />
          </div>
        </div>

        {/* Scanner Section */}
        <div className="scanner-box">
          <DocumentScanner
            scannedDocuments={localData.scannedDocuments}
            onDocumentsChange={handleDocumentsChange}
            showScannedList={true}
            className="gaeste-scanner"
            defaultSource="glass"
            title="Agenturzettel scannen"
            scanName="Agenturzettel"
          />
        </div>
      </div>
    </div>
  );
}

