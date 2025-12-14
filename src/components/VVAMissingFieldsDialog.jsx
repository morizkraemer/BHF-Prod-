const { useState, useEffect } = React;

function VVAMissingFieldsDialog({ isOpen, onFinishAnyway, onCancel, missingFields, title = 'Fehlende VVA Felder' }) {
  const [note, setNote] = useState('');
  const [fieldConfirmations, setFieldConfirmations] = useState({});

  // Reset note and confirmations when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNote('');
      // Initialize confirmations only for Handtuchzettel Scan
      const confirmations = {};
      missingFields.forEach((field, index) => {
        if (field.field === 'Handtuchzettel Scan') {
          const fieldKey = `${field.section}_${field.field}_${index}`;
          confirmations[fieldKey] = false;
        }
      });
      setFieldConfirmations(confirmations);
    }
  }, [isOpen, missingFields]);

  if (!isOpen) return null;

  // Handle toggle switch changes (only for Handtuchzettel Scan)
  const handleToggleChange = (fieldKey) => {
    setFieldConfirmations(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  // Check if Handtuchzettel Scan is confirmed (if it's in the missing fields)
  const handtuchzettelConfirmed = () => {
    const handtuchzettelField = missingFields.find(
      field => field.field === 'Handtuchzettel Scan'
    );
    if (!handtuchzettelField) {
      return true; // Not required, so considered confirmed
    }
    const fieldIndex = missingFields.findIndex(
      field => field.field === 'Handtuchzettel Scan'
    );
    const fieldKey = `${handtuchzettelField.section}_${handtuchzettelField.field}_${fieldIndex}`;
    return fieldConfirmations[fieldKey] || false;
  };

  // Group errors by section for display
  const errorsBySection = {};
  missingFields.forEach((err, index) => {
    if (!errorsBySection[err.section]) {
      errorsBySection[err.section] = [];
    }
    const fieldKey = `${err.section}_${err.field}_${index}`;
    const isHandtuchzettel = err.field === 'Handtuchzettel Scan';
    errorsBySection[err.section].push({
      field: err.field,
      key: fieldKey,
      confirmed: fieldConfirmations[fieldKey] || false,
      needsToggle: isHandtuchzettel
    });
  });

  return (
    <div className="vva-missing-fields-overlay">
      <div className="vva-missing-fields-dialog">
        <h2 className="vva-missing-fields-title">{title}</h2>
        
        <div className="vva-missing-fields-content">
          <p className="vva-missing-fields-description">
            Die folgenden Felder müssen noch ausgefüllt werden:
          </p>
          
          <div className="vva-missing-fields-list">
            {Object.entries(errorsBySection).map(([section, fields]) => (
              <div key={section} className="vva-missing-fields-section">
                <div className="vva-missing-fields-section-name">{section}:</div>
                <div className="vva-missing-fields-section-fields">
                  {fields.map((fieldData) => (
                    fieldData.needsToggle ? (
                      <div key={fieldData.key} className="vva-missing-fields-toggle-item">
                        <div className="vva-missing-fields-field-info">
                          <span className="vva-missing-fields-field-name">{fieldData.field}</span>
                          <span className="vva-missing-fields-field-description">
                            Ich bestätige, dass dieses Feld fehlt
                          </span>
                        </div>
                        <label className="vva-missing-fields-toggle-switch">
                          <input
                            type="checkbox"
                            checked={fieldData.confirmed}
                            onChange={() => handleToggleChange(fieldData.key)}
                          />
                          <span className="vva-missing-fields-toggle-slider"></span>
                        </label>
                      </div>
                    ) : (
                      <div key={fieldData.key} className="vva-missing-fields-item">
                        • {fieldData.field}
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="vva-missing-fields-note">
            <label className="vva-missing-fields-note-label">
              Bitte gib eine Notiz ein, warum du die VVA ohne diese Informationen beenden willst *
            </label>
            <textarea
              className="vva-missing-fields-note-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bitte gib eine Notiz ein, warum du die VVA ohne diese Informationen beenden willst..."
              rows={4}
              required
            />
          </div>
        </div>

        <div className="vva-missing-fields-actions">
          <button
            type="button"
            onClick={onCancel}
            className="vva-missing-fields-button vva-missing-fields-button-cancel"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => onFinishAnyway(note, fieldConfirmations)}
            disabled={!note || note.trim() === '' || !handtuchzettelConfirmed()}
            className="vva-missing-fields-button vva-missing-fields-button-finish"
          >
            Trotzdem Beenden
          </button>
        </div>
      </div>
    </div>
  );
}

