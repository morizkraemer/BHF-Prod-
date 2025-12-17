const { useState, useEffect } = React;

function CloseShiftConfirmationDialog({ isOpen, onConfirm, onCancel, formData }) {
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setNote('');
    }
  }, [isOpen]);
  
  // Get field status summary
  const fieldStatus = formData ? window.AppValidation.getAllFieldsStatus(formData) : [];
  
  // Group fields by section
  const fieldsBySection = {};
  fieldStatus.forEach(field => {
    if (!fieldsBySection[field.section]) {
      fieldsBySection[field.section] = [];
    }
    fieldsBySection[field.section].push(field);
  });

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm(note.trim() || null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="close-shift-confirmation-overlay">
      <div className="close-shift-confirmation-dialog">
        <h2 className="close-shift-confirmation-title">SHIFT BEENDEN</h2>
        
        <div className="close-shift-confirmation-content">
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
          
          <div className="close-shift-confirmation-checkbox-group">
            <label className="close-shift-confirmation-checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="close-shift-confirmation-checkbox"
              />
              <span className="close-shift-confirmation-checkbox-custom"></span>
              <span className="close-shift-confirmation-checkbox-text">
                Ich bestätige, dass alle Daten vollständig sind und der Shift beendet werden kann
              </span>
            </label>
          </div>
          
          <div className="close-shift-confirmation-note">
            <label className="close-shift-confirmation-note-label">Notiz (optional):</label>
            <textarea
              className="close-shift-confirmation-note-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optionale Notiz hinzufügen..."
              rows={3}
            />
          </div>
        </div>

        <div className="close-shift-confirmation-actions">
          <button
            type="button"
            onClick={onCancel}
            className="close-shift-confirmation-button close-shift-confirmation-button-cancel"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmed}
            className="close-shift-confirmation-button close-shift-confirmation-button-confirm"
          >
            Shift beenden
          </button>
        </div>
      </div>
    </div>
  );
}

