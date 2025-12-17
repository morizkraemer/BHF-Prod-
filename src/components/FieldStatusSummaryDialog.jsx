const { useState, useEffect } = React;

function FieldStatusSummaryDialog({ isOpen, onConfirm, onCancel, formData, isVVA = false }) {
  // Get field status summary
  const fieldStatus = formData ? (isVVA 
    ? window.AppValidation.getVVAFieldsStatus(formData)
    : window.AppValidation.getAllFieldsStatus(formData)
  ) : [];
  
  // Separate fields into missing and filled
  const missingFields = fieldStatus.filter(field => !field.isFilled);
  const filledFields = fieldStatus.filter(field => field.isFilled);
  
  // Group missing fields by section
  const missingFieldsBySection = {};
  missingFields.forEach(field => {
    if (!missingFieldsBySection[field.section]) {
      missingFieldsBySection[field.section] = [];
    }
    missingFieldsBySection[field.section].push(field);
  });
  
  // Group filled fields by section
  const filledFieldsBySection = {};
  filledFields.forEach(field => {
    if (!filledFieldsBySection[field.section]) {
      filledFieldsBySection[field.section] = [];
    }
    filledFieldsBySection[field.section].push(field);
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="field-status-summary-overlay">
      <div className="field-status-summary-dialog">
        <h2 className="field-status-summary-dialog-title">Feld-Status Übersicht</h2>
        
        <div className="field-status-summary-dialog-content">
          {fieldStatus.length > 0 ? (
            <div className="field-status-summary-content">
              {/* Missing Fields Section */}
              {Object.keys(missingFieldsBySection).length > 0 && (
                <div className="field-status-missing-section">
                  <div className="field-status-missing-header">Fehlende Felder</div>
                  {Object.entries(missingFieldsBySection).map(([section, fields]) => (
                    <div key={section} className="field-status-section">
                      <div className="field-status-section-header">{section}</div>
                      <div className="field-status-fields">
                        {fields.map((field, index) => (
                          <div key={index} className="field-status-item">
                            <span className="field-status-icon field-status-missing">
                              ✗
                            </span>
                            <span className="field-status-label">{field.field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Filled Fields Section */}
              {Object.keys(filledFieldsBySection).length > 0 && (
                <div className="field-status-filled-section">
                  <div className="field-status-filled-header">Ausgefüllte Felder</div>
                  {Object.entries(filledFieldsBySection).map(([section, fields]) => (
                    <div key={section} className="field-status-section">
                      <div className="field-status-section-header">{section}</div>
                      <div className="field-status-fields">
                        {fields.map((field, index) => (
                          <div key={index} className="field-status-item">
                            <span className="field-status-icon field-status-filled">
                              ✓
                            </span>
                            <span className="field-status-label">{field.field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="field-status-summary-empty">Keine Felder gefunden.</div>
          )}
        </div>
        
        <div className="field-status-summary-dialog-actions">
          <button
            type="button"
            onClick={onCancel}
            className="field-status-summary-button field-status-summary-button-cancel"
          >
            Zurück
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="field-status-summary-button field-status-summary-button-confirm"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

