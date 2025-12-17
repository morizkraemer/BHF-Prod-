const { useState, useEffect } = React;

function VVAMissingFieldsDialog({ isOpen, onFinishAnyway, onCancel, missingFields, title = 'Fehlende VVA Felder', formData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldNotes, setFieldNotes] = useState({});
  const [allFieldsNote, setAllFieldsNote] = useState('');
  const [showFieldStatusSummary, setShowFieldStatusSummary] = useState(false);

  // Determine if this is VVA or SL phase based on title
  const isVVA = title === 'Fehlende VVA Felder';

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setFieldNotes({});
      setAllFieldsNote('');
      setShowFieldStatusSummary(false);
    }
  }, [isOpen, missingFields]);

  if (!isOpen || missingFields.length === 0) return null;

  // Check if we're on the summary step (one step after all individual fields)
  const isSummaryStep = currentStep === missingFields.length;
  const isIndividualFieldStep = currentStep < missingFields.length;
  
  // Get current field (only if not on summary step)
  const currentField = isIndividualFieldStep ? missingFields[currentStep] : null;
  const fieldKey = currentField ? `${currentField.section}_${currentField.field}_${currentStep}` : '';
  const currentNote = fieldKey ? (fieldNotes[fieldKey] || '') : '';
  
  const isLastStep = currentStep === missingFields.length; // Summary step is the last step
  const isFirstStep = currentStep === 0;
  const totalSteps = missingFields.length + 1; // Individual fields + summary step
  
  // Check if this is a scan field (only if currentField exists)
  const isScanField = currentField ? (currentField.field.includes('Scan') || 
                      currentField.field.includes('Gescannte') ||
                      currentField.field.includes('gescannt')) : false;
  
  // Extract scan name from field name
  const getScanName = (fieldName) => {
    // Handle specific cases first
    if (fieldName === 'Gescannte Bilder') {
      return 'Technikzettel';
    }
    if (fieldName === 'Gescannte Dokumente') {
      return 'Secu-Dokumente';
    }
    // Remove "Scan" or "Scans" from the end
    let name = fieldName.replace(/\s+Scan(s)?$/i, '');
    return name;
  };
  
  // Determine article (der/die) for scan name
  const getScanArticle = (scanName) => {
    // "Belege" is plural, so use "die"
    if (scanName === 'Belege') {
      return 'die';
    }
    // Default to "den" for singular masculine/neuter
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
    if (isSummaryStep) {
      // On summary step, need either all-fields note OR all individual notes
      if (allFieldsNote.trim() !== '') {
        return true; // All-fields note is filled
      }
      // Check if all individual notes are filled
      return missingFields.every((field, index) => {
        const key = `${field.section}_${field.field}_${index}`;
        return fieldNotes[key] && fieldNotes[key].trim() !== '';
      });
    } else {
      // On individual field step, note is optional (can skip to next)
      return true; // Always allow proceeding (note is optional)
    }
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (isSummaryStep) {
      // On summary step, show field status summary dialog instead of finishing immediately
      setShowFieldStatusSummary(true);
    } else if (currentStep === missingFields.length - 1) {
      // Last individual field, move to summary
      setCurrentStep(prev => prev + 1);
    } else {
      // Move to next individual field
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Handle confirm from field status summary
  const handleFieldStatusConfirm = () => {
    setShowFieldStatusSummary(false);
    onFinishAnyway(fieldNotes, {}, allFieldsNote);
  };
  
  // Handle cancel from field status summary
  const handleFieldStatusCancel = () => {
    setShowFieldStatusSummary(false);
  };

  // Handle go back
  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="vva-missing-fields-overlay">
      <div className="vva-missing-fields-dialog">
        <h2 className="vva-missing-fields-title">{title}</h2>
        
        {/* Step Indicator */}
        <div className="vva-missing-fields-step-indicator">
          Schritt {currentStep + 1} von {totalSteps}
        </div>

        <div className="vva-missing-fields-content">
          {isSummaryStep ? (
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
            className="vva-missing-fields-button vva-missing-fields-button-continue"
          >
            {isLastStep ? 'Trotzdem Beenden' : (isSummaryStep ? 'Trotzdem Beenden' : 'Weiter')}
          </button>
        </div>
      </div>
      
      {/* Field Status Summary Dialog */}
      <FieldStatusSummaryDialog
        isOpen={showFieldStatusSummary}
        onConfirm={handleFieldStatusConfirm}
        onCancel={handleFieldStatusCancel}
        formData={formData}
        isVVA={isVVA}
      />
    </div>
  );
}
