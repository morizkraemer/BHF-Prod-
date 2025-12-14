const { useState, useEffect } = React;

function VVAMissingFieldsDialog({ isOpen, onFinishAnyway, onCancel, missingFields, title = 'Fehlende VVA Felder' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldNotes, setFieldNotes] = useState({});

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setFieldNotes({});
    }
  }, [isOpen, missingFields]);

  if (!isOpen || missingFields.length === 0) return null;

  // Get current field
  const currentField = missingFields[currentStep];
  const fieldKey = `${currentField.section}_${currentField.field}_${currentStep}`;
  const currentNote = fieldNotes[fieldKey] || '';
  const isLastStep = currentStep === missingFields.length - 1;
  const isFirstStep = currentStep === 0;

  // Handle note change for current field
  const handleNoteChange = (value) => {
    setFieldNotes(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  // Check if current step can proceed
  const canProceed = () => {
    return currentNote.trim() !== '';
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (isLastStep) {
      // All steps done, finish
      onFinishAnyway(fieldNotes, {});
    } else {
      // Move to next step
      setCurrentStep(prev => prev + 1);
    }
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
          Schritt {currentStep + 1} von {missingFields.length}
        </div>

        <div className="vva-missing-fields-content">
          {/* Current Field Display */}
          <div className="vva-missing-fields-current-field">
            <div className="vva-missing-fields-field-description-text">
              Das Feld <strong>{currentField.field}</strong> im Bereich <strong>{currentField.section}</strong> fehlt noch.
            </div>

            {/* Note Field */}
            <div className="vva-missing-fields-note">
              <label className="vva-missing-fields-note-label">
                Warum möchtest du ohne diese Information fortfahren? *
              </label>
              <textarea
                className="vva-missing-fields-note-textarea"
                value={currentNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Bitte gib eine Notiz ein, warum du ohne diese Information fortfahren willst..."
                rows={4}
                required
              />
            </div>
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
            {isLastStep ? 'Trotzdem Beenden' : 'Weiter ohne diese Information'}
          </button>
        </div>
      </div>
    </div>
  );
}
