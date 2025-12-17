const { useState, useEffect } = React;

function VVAConfirmationDialog({ isOpen, onConfirm, onCancel, hasExtras, formData }) {
  const [checklistChecked, setChecklistChecked] = useState(false);
  const [extrasConfirmed, setExtrasConfirmed] = useState(false);
  const [note, setNote] = useState('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setChecklistChecked(false);
      setExtrasConfirmed(false); // Always start unchecked, needs manual confirmation if no extras
      setNote('');
    }
  }, [isOpen, hasExtras]);
  
  // Get field status summary
  const fieldStatus = formData ? window.AppValidation.getVVAFieldsStatus(formData) : [];
  
  // Group fields by section
  const fieldsBySection = {};
  fieldStatus.forEach(field => {
    if (!fieldsBySection[field.section]) {
      fieldsBySection[field.section] = [];
    }
    fieldsBySection[field.section].push(field);
  });

  const handleConfirm = () => {
    if (checklistChecked && (hasExtras || extrasConfirmed)) {
      onConfirm(note.trim() || null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="vva-confirmation-overlay">
      <div className="vva-confirmation-dialog">
        <h2 className="vva-confirmation-title">FINISH VVA</h2>
        
        <div className="vva-confirmation-content">
          {/* Field Status Summary */}
          {fieldStatus.length > 0 && (
            <div className="field-status-summary">
              <h3 className="field-status-summary-title">Feld-Status Übersicht</h3>
              <div className="field-status-summary-content">
                {Object.entries(fieldsBySection).map(([section, fields]) => (
                  <div key={section} className="field-status-section">
                    <div className="field-status-section-header">{section}</div>
                    <div className="field-status-fields">
                      {fields.map((field, index) => (
                        <div key={index} className="field-status-item">
                          <span className={`field-status-icon ${field.isFilled ? 'field-status-filled' : 'field-status-missing'}`}>
                            {field.isFilled ? '✓' : '✗'}
                          </span>
                          <span className="field-status-label">{field.field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="vva-confirmation-checkbox-group">
            <label className="vva-confirmation-checkbox-label">
              <input
                type="checkbox"
                checked={checklistChecked}
                onChange={(e) => setChecklistChecked(e.target.checked)}
                className="vva-confirmation-checkbox"
              />
              <span className="vva-confirmation-checkbox-custom"></span>
              <span className="vva-confirmation-checkbox-text">VVA Checkliste ausgefüllt</span>
            </label>
          </div>

          {!hasExtras && (
            <div className="vva-confirmation-checkbox-group">
              <label className="vva-confirmation-checkbox-label">
                <input
                  type="checkbox"
                  checked={extrasConfirmed}
                  onChange={(e) => setExtrasConfirmed(e.target.checked)}
                  className="vva-confirmation-checkbox"
                />
                <span className="vva-confirmation-checkbox-custom"></span>
                <span className="vva-confirmation-checkbox-text">
                  Keine Extras in Hospitality zu buchen
                </span>
              </label>
            </div>
          )}
          
          <div className="vva-confirmation-note">
            <label className="vva-confirmation-note-label">Notiz (optional):</label>
            <textarea
              className="vva-confirmation-note-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optionale Notiz hinzufügen..."
              rows={3}
            />
          </div>
        </div>

        <div className="vva-confirmation-actions">
          <button
            type="button"
            onClick={onCancel}
            className="vva-confirmation-button vva-confirmation-button-cancel"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!checklistChecked || (!hasExtras && !extrasConfirmed)}
            className="vva-confirmation-button vva-confirmation-button-confirm"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

