const { useState, useEffect } = React;

function VVAMissingFieldsDialog({ isOpen, onFinishAnyway, onCancel, missingFields, title = 'Fehlende VVA Felder' }) {
  const [note, setNote] = useState('');

  // Reset note when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Group errors by section
  const errorsBySection = {};
  missingFields.forEach(err => {
    if (!errorsBySection[err.section]) {
      errorsBySection[err.section] = [];
    }
    errorsBySection[err.section].push(err.field);
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
                  {fields.map((field, index) => (
                    <div key={index} className="vva-missing-fields-item">
                      • {field}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="vva-missing-fields-note">
            <label className="vva-missing-fields-note-label">Notiz *:</label>
            <textarea
              className="vva-missing-fields-note-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bitte geben Sie eine Notiz ein..."
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
            onClick={() => onFinishAnyway(note)}
            disabled={!note || note.trim() === ''}
            className="vva-missing-fields-button vva-missing-fields-button-finish"
          >
            Trotzdem Beenden
          </button>
        </div>
      </div>
    </div>
  );
}

