const { useState, useEffect } = React;

function GaesteForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted = null }) {
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [localData, setLocalData] = useState({
    paymentType: formData?.paymentType || 'selbstzahler',
    pauschaleOptions: formData?.pauschaleOptions || {
      standard: true,
      longdrinks: false,
      shots: false
    },
    anzahlAbendkasse: formData?.anzahlAbendkasse || '',
    betragAbendkasse: formData?.betragAbendkasse || '',
    useTimeBasedPricing: formData?.useTimeBasedPricing || false,
    abendkasseTimeSlots: formData?.abendkasseTimeSlots || (formData?.useTimeBasedPricing ? [{ time: '', price: '', count: '' }, { time: '', price: '', count: '' }] : []),
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

  const handleTimeBasedPricingToggle = (checked) => {
    setLocalData(prev => {
      if (checked && (!prev.abendkasseTimeSlots || prev.abendkasseTimeSlots.length === 0)) {
        // Add two default time slots when enabling time-based pricing
        return {
          ...prev,
          useTimeBasedPricing: true,
          abendkasseTimeSlots: [{ time: '', price: '', count: '' }, { time: '', price: '', count: '' }]
        };
      } else {
        return {
          ...prev,
          useTimeBasedPricing: checked
        };
      }
    });
  };

  // Calculate total
  const calculateTotal = () => {
    if (localData.useTimeBasedPricing && localData.abendkasseTimeSlots && localData.abendkasseTimeSlots.length > 0) {
      // Calculate from time slots
      const total = localData.abendkasseTimeSlots.reduce((sum, slot) => {
        const price = parseFloat(slot.price || 0);
        const count = parseFloat(slot.count || 0);
        return sum + (price * count);
      }, 0);
      return total.toFixed(2);
    } else {
      // Simple calculation
      const betrag = parseFloat(localData.betragAbendkasse || 0);
      const anzahl = parseFloat(localData.anzahlAbendkasse || 0);
      return (betrag * anzahl).toFixed(2);
    }
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setLocalData(prev => ({
      ...prev,
      scannedDocuments: updatedDocuments
    }));
  };

  const handleAddTimeSlot = () => {
    setLocalData(prev => ({
      ...prev,
      abendkasseTimeSlots: [...(prev.abendkasseTimeSlots || []), { time: '', price: '', count: '' }]
    }));
  };

  const handleRemoveTimeSlot = (index) => {
    setLocalData(prev => ({
      ...prev,
      abendkasseTimeSlots: prev.abendkasseTimeSlots.filter((_, i) => i !== index)
    }));
  };

  const handleTimeSlotChange = (index, field, value) => {
    setLocalData(prev => {
      const updatedSlots = [...(prev.abendkasseTimeSlots || [])];
      updatedSlots[index] = {
        ...updatedSlots[index],
        [field]: value
      };
      return {
        ...prev,
        abendkasseTimeSlots: updatedSlots
      };
    });
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
          {/* Checkbox for time-based pricing */}
          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localData.useTimeBasedPricing}
                onChange={(e) => handleTimeBasedPricingToggle(e.target.checked)}
                className="rider-extras-checkbox"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">Zeitbasierte AK</span>
            </label>
          </div>

          {/* Anzahl and Betrag Abendkasse - only show when NOT using time-based pricing */}
          {!localData.useTimeBasedPricing && (
            <div className="form-group-paired-container" style={{ gridColumn: '1 / -1' }}>
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
          )}

          {/* Time-based pricing section */}
          {localData.useTimeBasedPricing && (
            <div className="time-based-pricing-section" style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', fontSize: '16px', color: '#2c3e50' }}>Zeitbasierte AK</label>
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  className="settings-add-button"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Zeitfenster hinzufügen
                </button>
              </div>
              {localData.abendkasseTimeSlots && localData.abendkasseTimeSlots.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {localData.abendkasseTimeSlots.map((slot, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end', padding: '15px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #eee' }}>
                      <div className="form-group">
                        <label htmlFor={`time-slot-${index}-time`}>Zeit</label>
                        <input
                          type="time"
                          id={`time-slot-${index}-time`}
                          value={slot.time || ''}
                          onChange={(e) => handleTimeSlotChange(index, 'time', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`time-slot-${index}-price`}>Preis (€)</label>
                        <input
                          type="number"
                          id={`time-slot-${index}-price`}
                          value={slot.price || ''}
                          onChange={(e) => handleTimeSlotChange(index, 'price', e.target.value)}
                          className="form-input"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`time-slot-${index}-count`}>Anzahl</label>
                        <input
                          type="number"
                          id={`time-slot-${index}-count`}
                          value={slot.count || ''}
                          onChange={(e) => handleTimeSlotChange(index, 'count', e.target.value)}
                          className="form-input"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(index)}
                        style={{ 
                          padding: '10px 16px', 
                          backgroundColor: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Total */}
          <div className="form-group form-group-total">
            <label>Total</label>
            <div className="total-display">
              €{calculateTotal()}
            </div>
          </div>
        </div>

        {/* Gäste Gesamt - on its own line below prices */}
        <div className="form-row" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label htmlFor="gaesteGesamt">Gäste Gesamt (GL + VVK + AK) *</label>
            <input
              type="text"
              id="gaesteGesamt"
              value={localData.gaesteGesamt}
              onChange={(e) => handleChange('gaesteGesamt', e.target.value)}
              className={`form-input ${shouldHighlight('Gäste Gesamt') ? 'field-highlighted' : ''}`}
              placeholder="Gäste Gesamt"
              required
            />
          </div>
        </div>

        {/* Scanner Section */}
        <div className={`scanner-box ${shouldHighlight('Agenturzettel Scan') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={localData.scannedDocuments}
            onDocumentsChange={handleDocumentsChange}
            showScannedList={true}
            className="gaeste-scanner"
            defaultSource="glass"
            title="Agenturzettel scannen"
            scanName="Agenturzettel"
            templateKey="uebersichtzettel"
            printedTemplates={printedTemplates}
            onTemplatePrinted={onTemplatePrinted}
          />
        </div>
      </div>
    </div>
  );
}

