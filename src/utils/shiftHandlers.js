// Create handler functions that receive state setters and formData
const createShiftHandlers = ({
  formData,
  setFormData,
  currentPhase,
  setCurrentPhase,
  shiftNotes,
  setShiftNotes,
  shiftStarted,
  setShiftStarted,
  setShowVVAConfirmation,
  setShowVVAMissingFields,
  setVvaMissingFields,
  setShowSLMissingFields,
  setSlMissingFields,
  setShowCloseShiftConfirmation,
  setHighlightedFields,
  setActiveSection
}) => {
  const handleVVAConfirm = (missingFieldsNote, confirmationNote, fieldNotes = {}) => {
    setShiftNotes(prev => ({ 
      ...prev, 
      vvaConfirmationNote: confirmationNote,
      vvaMissingFieldsNote: missingFieldsNote || prev.vvaMissingFieldsNote,
      vvaFieldNotes: Object.keys(fieldNotes).length > 0 ? fieldNotes : (prev.vvaFieldNotes || {})
    }));
    setCurrentPhase('SL');
    setShowVVAConfirmation(false);
    alert('VVA Phase abgeschlossen. Sie können nun mit der SL Phase fortfahren.');
  };

  const handleVVACancel = () => {
    setShowVVAConfirmation(false);
  };

  const handleCloseShiftConfirm = (missingFieldsNote, confirmationNote, fieldNotes = {}) => {
    setShiftNotes(prev => ({ 
      ...prev, 
      closeShiftConfirmationNote: confirmationNote,
      slMissingFieldsNote: missingFieldsNote || prev.slMissingFieldsNote,
      slFieldNotes: Object.keys(fieldNotes).length > 0 ? fieldNotes : (prev.slFieldNotes || {})
    }));
    setShowCloseShiftConfirmation(false);
    handleCloseShiftSave();
  };

  const handleCloseShiftCancel = () => {
    setShowCloseShiftConfirmation(false);
  };

  // This handler is no longer needed - VVAFinishDialog handles everything internally
  // Keeping for backwards compatibility but it should not be called
  const handleVVAMissingFieldsFinishAnyway = (fieldNotes, fieldConfirmations, allFieldsNote, vvaMissingFields) => {
    // This should not be called anymore - VVAFinishDialog handles the flow internally
    console.warn('handleVVAMissingFieldsFinishAnyway should not be called - use VVAFinishDialog instead');
  };

  const handleVVAMissingFieldsCancel = (vvaMissingFields) => {
    setShowVVAMissingFields(false);
    // Create a map of highlighted fields by section
    const highlightMap = {};
    vvaMissingFields.forEach(err => {
      if (!highlightMap[err.sectionId]) {
        highlightMap[err.sectionId] = new Set();
      }
      highlightMap[err.sectionId].add(err.field);
    });
    // Convert Sets to Arrays for state
    const highlightMapArrays = {};
    Object.keys(highlightMap).forEach(sectionId => {
      highlightMapArrays[sectionId] = Array.from(highlightMap[sectionId]);
    });
    setHighlightedFields(highlightMapArrays);
  };

  // This handler is no longer needed - SLFinishDialog handles everything internally
  // Keeping for backwards compatibility but it should not be called
  const handleSLMissingFieldsFinishAnyway = (fieldNotes, fieldConfirmations, allFieldsNote, slMissingFields) => {
    // This should not be called anymore - SLFinishDialog handles the flow internally
    console.warn('handleSLMissingFieldsFinishAnyway should not be called - use SLFinishDialog instead');
  };

  const handleSLMissingFieldsCancel = (slMissingFields) => {
    setShowSLMissingFields(false);
    // Create a map of highlighted fields by section
    const highlightMap = {};
    slMissingFields.forEach(err => {
      if (!highlightMap[err.sectionId]) {
        highlightMap[err.sectionId] = new Set();
      }
      highlightMap[err.sectionId].add(err.field);
    });
    // Convert Sets to Arrays for state
    const highlightMapArrays = {};
    Object.keys(highlightMap).forEach(sectionId => {
      highlightMapArrays[sectionId] = Array.from(highlightMap[sectionId]);
    });
    setHighlightedFields(highlightMapArrays);
  };

  const handleCloseShiftSave = async () => {
    try {
      if (window.electronAPI && window.electronAPI.closeShift) {
        // Add shift notes to formData before closing
        const formDataWithNotes = {
          ...formData,
          shiftNotes: shiftNotes
        };
        const result = await window.electronAPI.closeShift(formDataWithNotes);
        if (result.success) {
          // Clear shift data after successful close
          if (window.electronAPI && window.electronAPI.clearShiftData) {
            await window.electronAPI.clearShiftData();
          }
          
          // Reset form data and phase
          setFormData(window.AppConstants.getInitialFormData());
          setShiftNotes(window.AppConstants.getInitialShiftNotes());
          setCurrentPhase('VVA');
          setShiftStarted(false);
          
          alert(`Shift erfolgreich beendet!\n\nReport gespeichert in:\n${result.eventFolder}\n\nPDF: ${result.pdfPath.split('/').pop()}\nGescannte PDFs: ${result.scannedPDFsCount}`);
        } else {
          alert('Fehler beim Speichern des Shifts.');
        }
      } else {
        alert('Fehler: Electron API nicht verfügbar.');
      }
    } catch (error) {
      console.error('Error closing shift:', error);
      alert('Fehler beim Schließen des Shifts: ' + error.message);
    }
  };

  const handleCloseShift = () => {
    if (currentPhase === 'VVA') {
      // Validate VVA -> SL transition
      const vvaErrors = window.AppValidation.validateVVAtoSL(formData);
      
      // Show unified VVA finish dialog (handles both missing fields and confirmation)
      setVvaMissingFields(vvaErrors);
      setShowVVAConfirmation(true);
      // Clear previous highlights when opening dialog
      setHighlightedFields({});
      
      // Highlight the first section with errors if any
      if (vvaErrors.length > 0) {
        setActiveSection(vvaErrors[0].sectionId);
      }
      
    } else {
      // SL phase - validate all required fields with detailed errors
      const slErrors = window.AppValidation.validateAllSectionsDetailed(formData);
      
      // Filter out fields that were already confirmed in VVA
      const vvaFieldNotes = shiftNotes.vvaFieldNotes || {};
      const filteredSlErrors = slErrors.filter(error => {
        // Check if this field was already confirmed in VVA
        // Look for a matching field in vvaFieldNotes by section and field name
        // Key format: section_field_index (field may contain spaces, so we match by checking if key starts with section_field)
        const matchingKey = Object.keys(vvaFieldNotes).find(key => {
          // Check if key starts with the section and field name
          // Since field names may contain spaces, we need to match more flexibly
          const expectedPrefix = `${error.section}_${error.field}_`;
          return key.startsWith(expectedPrefix);
        });
        // If a matching key exists, this field was already confirmed in VVA
        return !matchingKey;
      });
      
      // Show unified SL finish dialog (handles both missing fields and confirmation)
      setSlMissingFields(filteredSlErrors);
      setShowCloseShiftConfirmation(true);
      // Clear previous highlights when opening dialog
      setHighlightedFields({});
      
      // Highlight the first section with errors if any
      if (filteredSlErrors.length > 0) {
        setActiveSection(filteredSlErrors[0].sectionId);
      }
    }
  };


  const handleStartShift = () => {
    // Mark shift as started
    setShiftStarted(true);
    
    // Reset all form data to defaults
    setFormData(window.AppConstants.getInitialFormData());
    
    // Reset shift notes
    setShiftNotes(window.AppConstants.getInitialShiftNotes());
    
    // Reset phase to VVA
    setCurrentPhase('VVA');
    
    // Set active section to overview
    setActiveSection('uebersicht');
    
    // Clear any highlighted fields
    setHighlightedFields({});
  };

  return {
    handleVVAConfirm,
    handleVVACancel,
    handleCloseShiftConfirm,
    handleCloseShiftCancel,
    handleVVAMissingFieldsFinishAnyway,
    handleVVAMissingFieldsCancel,
    handleSLMissingFieldsFinishAnyway,
    handleSLMissingFieldsCancel,
    handleCloseShiftSave,
    handleCloseShift,
    handleStartShift
  };
};

// Make available globally
window.AppShiftHandlers = {
  createShiftHandlers
};

