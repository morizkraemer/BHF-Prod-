const { useState, useEffect } = React;

function VVAFinishDialog({ isOpen, onConfirm, onCancel, missingFields = [], hasExtras, formData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldNotes, setFieldNotes] = useState({});
  const [allFieldsNote, setAllFieldsNote] = useState('');
  const [checklistChecked, setChecklistChecked] = useState(false);
  const [extrasConfirmed, setExtrasConfirmed] = useState(false);
  const [confirmationNote, setConfirmationNote] = useState('');

  const hasMissingFields = missingFields.length > 0;
  const confirmationStepIndex = hasMissingFields ? missingFields.length + 1 : 0; // +1 for summary step, +1 for confirmation
  const isOnConfirmationStep = currentStep === confirmationStepIndex;
  const isOnSummaryStep = hasMissingFields && currentStep === missingFields.length;
  const isIndividualFieldStep = hasMissingFields && currentStep < missingFields.length;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(hasMissingFields ? 0 : confirmationStepIndex);
      setFieldNotes({});
      setAllFieldsNote('');
      setChecklistChecked(false);
      setExtrasConfirmed(false);
      setConfirmationNote('');
    }
  }, [isOpen, missingFields, hasMissingFields, confirmationStepIndex]);

  if (!isOpen) return null;

  // Get current field (only if on individual field step)
  const currentField = isIndividualFieldStep ? missingFields[currentStep] : null;
  const fieldKey = currentField ? `${currentField.section}_${currentField.field}_${currentStep}` : '';
  const currentNote = fieldKey ? (fieldNotes[fieldKey] || '') : '';

  const isFirstStep = currentStep === 0;
  const totalSteps = hasMissingFields ? missingFields.length + 2 : 1; // Individual fields + summary + confirmation, or just confirmation

  // Check if this is a scan field
  const isScanField = currentField ? (currentField.field.includes('Scan') || 
                      currentField.field.includes('Gescannte') ||
                      currentField.field.includes('gescannt')) : false;

  // Extract scan name from field name
  const getScanName = (fieldName) => {
    if (fieldName === 'Gescannte Bilder') {
      return 'Technikzettel';
    }
    if (fieldName === 'Gescannte Dokumente') {
      return 'Secu-Dokumente';
    }
    let name = fieldName.replace(/\s+Scan(s)?$/i, '');
    return name;
  };

  // Determine article (der/die) for scan name
  const getScanArticle = (scanName) => {
    if (scanName === 'Belege') {
      return 'die';
    }
    return 'den';
  };

  // Handle note change for current field
  const handleNoteChange = (value) => {
    setFieldNotes(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  // Check if current step can proceed
  const canProceed = () => {
    if (isOnSummaryStep) {
      // On summary step, need either all-fields note OR all individual notes
      if (allFieldsNote.trim() !== '') {
        return true;
      }
      return missingFields.every((field, index) => {
        const key = `${field.section}_${field.field}_${index}`;
        return fieldNotes[key] && fieldNotes[key].trim() !== '';
      });
    } else if (isOnConfirmationStep) {
      // On confirmation step, need checklist checked and extras confirmed (if no extras)
      return checklistChecked && (hasExtras || extrasConfirmed);
    } else {
      // On individual field step, note is optional
      return true;
    }
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (isOnSummaryStep) {
      // Move from summary to confirmation step
      setCurrentStep(confirmationStepIndex);
    } else if (isOnConfirmationStep) {
      // On confirmation step, finish
      handleFinish();
    } else if (currentStep === missingFields.length - 1) {
      // Last individual field, move to summary
      setCurrentStep(prev => prev + 1);
    } else {
      // Move to next individual field
      setCurrentStep(prev => prev + 1);
    }
  };

  // Handle finish - combine missing fields notes and confirmation note
  const handleFinish = () => {
    // Combine missing fields notes if any
    let combinedMissingFieldsNote = '';
    if (hasMissingFields) {
      if (allFieldsNote && allFieldsNote.trim() !== '') {
        combinedMissingFieldsNote = allFieldsNote.trim();
      } else {
        combinedMissingFieldsNote = Object.entries(fieldNotes)
          .map(([key, note]) => {
            const parts = key.split('_');
            const section = parts[0];
            const field = parts.slice(1, -1).join('_');
            return `${section} - ${field}: ${note}`;
          })
          .join('\n\n');
      }
    }

    // Call onConfirm with notes and individual field notes
    onConfirm(combinedMissingFieldsNote, confirmationNote.trim() || null, fieldNotes);
  };

  // Handle go back
  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Get field status summary
  const fieldStatus = formData ? window.AppValidation.getVVAFieldsStatus(formData) : [];
  const fieldsBySection = {};
  fieldStatus.forEach(field => {
    if (!fieldsBySection[field.section]) {
      fieldsBySection[field.section] = [];
    }
    fieldsBySection[field.section].push(field);
  });

  return (
    <div className="vva-missing-fields-overlay">
      <div className="vva-missing-fields-dialog">
        <h2 className="vva-missing-fields-title">
          {isOnConfirmationStep ? 'FINISH VVA' : (hasMissingFields ? 'Fehlende VVA Felder' : 'FINISH VVA')}
        </h2>
        
        {/* Step Indicator */}
        {hasMissingFields && (
          <div className="vva-missing-fields-step-indicator">
            Schritt {currentStep + 1} von {totalSteps}
          </div>
        )}

        <div className="vva-missing-fields-content">
          {isOnConfirmationStep ? (
            /* Confirmation Step */
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
                  value={confirmationNote}
                  onChange={(e) => setConfirmationNote(e.target.value)}
                  placeholder="Optionale Notiz hinzufügen..."
                  rows={3}
                />
              </div>
            </div>
          ) : isOnSummaryStep ? (
            /* Summary Step - Show all missing fields and single note */
            <div className="vva-missing-fields-summary">
              <div className="vva-missing-fields-summary-title">
                Zusammenfassung der fehlenden Felder
              </div>
              <div className="vva-missing-fields-list">
                {missingFields.map((field, index) => {
                  const isFieldScan = field.field.includes('Scan') || 
                                      field.field.includes('Gescannte') ||
                                      field.field.includes('gescannt');
                  const scanName = isFieldScan ? getScanName(field.field) : null;
                  const scanArticle = scanName ? getScanArticle(scanName) : null;
                  const fieldKey = `${field.section}_${field.field}_${index}`;
                  const hasIndividualNote = fieldNotes[fieldKey] && fieldNotes[fieldKey].trim() !== '';
                  
                  return (
                    <div key={index} className="vva-missing-fields-summary-item">
                      {isFieldScan ? (
                        <span>Du hast {scanArticle} <strong>{scanName}</strong> noch nicht gescannt.</span>
                      ) : (
                        <span>Du hast das Feld <strong>{field.field}</strong> im Bereich <strong>{field.section}</strong> noch nicht ausgefüllt.</span>
                      )}
                      {hasIndividualNote && (
                        <span className="vva-missing-fields-note-indicator">✓ Notiz vorhanden</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="vva-missing-fields-note">
                <label className="vva-missing-fields-note-label">
                  Notiz für alle fehlenden Felder (optional, wenn bereits einzelne Notizen vorhanden):
                </label>
                <textarea
                  className="vva-missing-fields-note-textarea"
                  value={allFieldsNote}
                  onChange={(e) => setAllFieldsNote(e.target.value)}
                  placeholder="Bitte gib eine Notiz ein, warum du ohne diese Informationen fortfahren willst..."
                  rows={4}
                />
              </div>
            </div>
          ) : (
            /* Individual Field Step */
            <div className="vva-missing-fields-current-field">
              <div className="vva-missing-fields-field-description-text">
                {isScanField ? (
                  <>Du hast {getScanArticle(getScanName(currentField.field))} <strong>{getScanName(currentField.field)}</strong> noch nicht gescannt.</>
                ) : (
                  <>Du hast das Feld <strong>{currentField.field}</strong> im Bereich <strong>{currentField.section}</strong> noch nicht ausgefüllt.</>
                )}
              </div>

              {/* Note Field */}
              <div className="vva-missing-fields-note">
                <label className="vva-missing-fields-note-label">
                  Warum möchtest du ohne diese Information fortfahren? (optional)
                </label>
                <textarea
                  className="vva-missing-fields-note-textarea"
                  value={currentNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Bitte gib eine Notiz ein, warum du ohne diese Information fortfahren willst (optional)..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <div className="vva-missing-fields-actions">
          <button
            type="button"
            onClick={onCancel}
            className="vva-missing-fields-button vva-missing-fields-button-cancel"
          >
            Abbrechen
          </button>
          {!isFirstStep && (
            <button
              type="button"
              onClick={handleBack}
              className="vva-missing-fields-button vva-missing-fields-button-back"
            >
              Zurück
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canProceed()}
            className={isOnConfirmationStep ? "vva-confirmation-button vva-confirmation-button-confirm" : "vva-missing-fields-button vva-missing-fields-button-continue"}
          >
            {isOnConfirmationStep ? 'Bestätigen' : (isOnSummaryStep ? 'Weiter' : 'Weiter')}
          </button>
        </div>
      </div>
    </div>
  );
}

