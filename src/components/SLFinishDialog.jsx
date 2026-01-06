const { useState, useEffect } = React;

function SLFinishDialog({ isOpen, onConfirm, onCancel, missingFields = [], formData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldNotes, setFieldNotes] = useState({});
  const [allFieldsNote, setAllFieldsNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationNote, setConfirmationNote] = useState('');
  const [einkaufsbelegPaid, setEinkaufsbelegPaid] = useState(null); // null = not answered, true = paid, false = unpaid
  const [einkaufsbelegPreviews, setEinkaufsbelegPreviews] = useState([]); // Store base64 previews for receipts

  const hasMissingFields = missingFields.length > 0;
  const hasEinkaufsbeleg = formData?.['rider-extras']?.purchaseReceipts && formData['rider-extras'].purchaseReceipts.length > 0;
  const purchaseReceipts = formData?.['rider-extras']?.purchaseReceipts || [];
  const einkaufsbelegStepIndex = hasMissingFields ? missingFields.length + 1 : 0; // After missing fields (or at start if no missing fields)
  const confirmationStepIndex = hasEinkaufsbeleg ? einkaufsbelegStepIndex + 1 : (hasMissingFields ? missingFields.length + 1 : 0);
  const isOnEinkaufsbelegStep = hasEinkaufsbeleg && currentStep === einkaufsbelegStepIndex;
  const isOnConfirmationStep = currentStep === confirmationStepIndex;
  const isOnSummaryStep = hasMissingFields && currentStep === missingFields.length;
  const isIndividualFieldStep = hasMissingFields && currentStep < missingFields.length;

  // Load PDF previews for purchase receipts when dialog opens or einkaufsbeleg step is reached
  useEffect(() => {
    if (hasEinkaufsbeleg && purchaseReceipts.length > 0) {
      const loadPreviews = async () => {
        const previews = await Promise.all(
          purchaseReceipts.map(async (receipt) => {
            // If preview is already a base64 data URL, use it
            if (receipt.preview && receipt.preview.startsWith('data:')) {
              return receipt.preview;
            }
            // If we have filePath, try to load it
            if (receipt.filePath && window.electronAPI && window.electronAPI.readFileAsBase64) {
              try {
                const base64 = await window.electronAPI.readFileAsBase64(receipt.filePath);
                return `data:application/pdf;base64,${base64}`;
              } catch (error) {
                console.error('Error loading receipt preview:', error);
                return null;
              }
            }
            return null;
          })
        );
        setEinkaufsbelegPreviews(previews.filter(p => p !== null));
      };
      loadPreviews();
    } else {
      setEinkaufsbelegPreviews([]);
    }
  }, [hasEinkaufsbeleg, purchaseReceipts, isOpen]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      const startStep = hasMissingFields ? 0 : (hasEinkaufsbeleg ? einkaufsbelegStepIndex : confirmationStepIndex);
      setCurrentStep(startStep);
      setFieldNotes({});
      setAllFieldsNote('');
      setConfirmed(false);
      setConfirmationNote('');
      setEinkaufsbelegPaid(null);
    }
  }, [isOpen, missingFields, hasMissingFields, hasEinkaufsbeleg, einkaufsbelegStepIndex, confirmationStepIndex]);

  if (!isOpen) return null;

  // Get current field (only if on individual field step)
  const currentField = isIndividualFieldStep ? missingFields[currentStep] : null;
  const fieldKey = currentField ? `${currentField.section}_${currentField.field}_${currentStep}` : '';
  const currentNote = fieldKey ? (fieldNotes[fieldKey] || '') : '';

  const isFirstStep = currentStep === 0;
  // Calculate total steps: missing fields + summary (if missing fields) + einkaufsbeleg step (if has einkaufsbeleg) + confirmation
  let totalSteps = 1; // At least confirmation step
  if (hasMissingFields) {
    totalSteps += missingFields.length + 1; // Individual fields + summary
  }
  if (hasEinkaufsbeleg) {
    totalSteps += 1; // Einkaufsbeleg payment step
  }

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
    } else if (isOnEinkaufsbelegStep) {
      // On einkaufsbeleg step, need to answer the question
      return einkaufsbelegPaid !== null;
    } else if (isOnConfirmationStep) {
      // On confirmation step, need confirmation checked
      return confirmed;
    } else {
      // On individual field step, note is optional
      return true;
    }
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (isOnSummaryStep) {
      // Move from summary to einkaufsbeleg step (if exists) or confirmation step
      if (hasEinkaufsbeleg) {
        setCurrentStep(einkaufsbelegStepIndex);
      } else {
        setCurrentStep(confirmationStepIndex);
      }
    } else if (isOnEinkaufsbelegStep) {
      // Move from einkaufsbeleg step to confirmation step
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

    // Call onConfirm with notes, individual field notes, and einkaufsbeleg payment status
    onConfirm(combinedMissingFieldsNote, confirmationNote.trim() || null, fieldNotes, einkaufsbelegPaid);
  };

  // Handle go back
  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Get field status summary
  const fieldStatus = formData ? window.AppValidation.getAllFieldsStatus(formData) : [];
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
          {isOnConfirmationStep ? 'SCHICHT BEENDEN' : (hasMissingFields ? 'Fehlende Felder' : 'SCHICHT BEENDEN')}
        </h2>
        
        {/* Step Indicator */}
        {(hasMissingFields || hasEinkaufsbeleg) && (
          <div className="vva-missing-fields-step-indicator">
            Schritt {currentStep + 1} von {totalSteps}
          </div>
        )}

        <div className="vva-missing-fields-content">
          {isOnEinkaufsbelegStep ? (
            /* Einkaufsbeleg Payment Step */
            <div className="vva-missing-fields-current-field">
              <div className="vva-missing-fields-field-description-text">
                Wurde der Einkaufsbeleg bereits bezahlt? (Geld aus der Ausgabenkasse rausgegeben)
              </div>
              
              {/* PDF Preview */}
              {einkaufsbelegPreviews.length > 0 && (
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                    Einkaufsbeleg Vorschau:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                    {einkaufsbelegPreviews.map((preview, index) => (
                      <div key={index} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', backgroundColor: '#f9f9f9' }}>
                        {window.pdfjsLib ? (
                          <PDFViewer 
                            base64Data={preview} 
                            style={{ width: '100%', maxHeight: '300px' }}
                          />
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            PDF.js wird geladen...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="vva-confirmation-checkbox-group" style={{ marginTop: '20px' }}>
                <label className="vva-confirmation-checkbox-label">
                  <input
                    type="radio"
                    name="einkaufsbeleg-paid"
                    checked={einkaufsbelegPaid === true}
                    onChange={() => setEinkaufsbelegPaid(true)}
                    className="vva-confirmation-checkbox"
                  />
                  <span className="vva-confirmation-checkbox-custom"></span>
                  <span className="vva-confirmation-checkbox-text">Ja, bereits bezahlt</span>
                </label>
              </div>
              
              <div className="vva-confirmation-checkbox-group">
                <label className="vva-confirmation-checkbox-label">
                  <input
                    type="radio"
                    name="einkaufsbeleg-paid"
                    checked={einkaufsbelegPaid === false}
                    onChange={() => setEinkaufsbelegPaid(false)}
                    className="vva-confirmation-checkbox"
                  />
                  <span className="vva-confirmation-checkbox-custom"></span>
                  <span className="vva-confirmation-checkbox-text">Nein, noch nicht bezahlt</span>
                </label>
              </div>
            </div>
          ) : isOnConfirmationStep ? (
            /* Confirmation Step */
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
                    Ich bestätige, dass alle Daten vollständig sind und die Schicht beendet werden kann
                  </span>
                </label>
              </div>
              
              <div className="close-shift-confirmation-note">
                <label className="close-shift-confirmation-note-label">Notiz (optional):</label>
                <textarea
                  className="close-shift-confirmation-note-textarea"
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
            className={isOnConfirmationStep ? "close-shift-confirmation-button close-shift-confirmation-button-confirm" : "vva-missing-fields-button vva-missing-fields-button-continue"}
          >
            {isOnConfirmationStep ? 'Schicht beenden' : (isOnEinkaufsbelegStep ? 'Weiter' : (isOnSummaryStep ? 'Weiter' : 'Weiter'))}
          </button>
        </div>
      </div>
    </div>
  );
}

