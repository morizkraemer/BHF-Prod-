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
  const handleVVAConfirm = (note) => {
    setShiftNotes(prev => ({ ...prev, vvaConfirmationNote: note }));
    setCurrentPhase('SL');
    setShowVVAConfirmation(false);
    alert('VVA Phase abgeschlossen. Sie können nun mit der SL Phase fortfahren.');
  };

  const handleVVACancel = () => {
    setShowVVAConfirmation(false);
  };

  const handleCloseShiftConfirm = (note) => {
    setShiftNotes(prev => ({ ...prev, closeShiftConfirmationNote: note }));
    setShowCloseShiftConfirmation(false);
    handleCloseShiftSave();
  };

  const handleCloseShiftCancel = () => {
    setShowCloseShiftConfirmation(false);
  };

  const handleVVAMissingFieldsFinishAnyway = (fieldNotes, fieldConfirmations, allFieldsNote, vvaMissingFields) => {
    // Use all-fields note if provided, otherwise combine individual field notes
    let combinedNote = '';
    if (allFieldsNote && allFieldsNote.trim() !== '') {
      combinedNote = allFieldsNote.trim();
    } else {
      // Combine all field notes into a single note string
      combinedNote = Object.entries(fieldNotes)
        .map(([key, note]) => {
          // Extract field info from key (section_field_index)
          const parts = key.split('_');
          const section = parts[0];
          const field = parts.slice(1, -1).join('_');
          return `${section} - ${field}: ${note}`;
        })
        .join('\n\n');
    }
    
    setShiftNotes(prev => ({ 
      ...prev, 
      vvaMissingFieldsNote: combinedNote,
      vvaMissingFields: vvaMissingFields,
      vvaFieldConfirmations: fieldConfirmations,
      vvaFieldNotes: fieldNotes // Store individual notes too
    }));
    setShowVVAMissingFields(false);
    // Clear highlights
    setHighlightedFields({});
    
    // Since note is required, if we get here there's always a note - switch directly to SL phase
    setCurrentPhase('SL');
    alert('VVA Phase abgeschlossen. Sie können nun mit der SL Phase fortfahren.');
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

  const handleSLMissingFieldsFinishAnyway = async (fieldNotes, fieldConfirmations, allFieldsNote, slMissingFields) => {
    // Use all-fields note if provided, otherwise combine individual field notes
    let combinedNote = '';
    if (allFieldsNote && allFieldsNote.trim() !== '') {
      combinedNote = allFieldsNote.trim();
    } else {
      // Combine all field notes into a single note string
      combinedNote = Object.entries(fieldNotes)
        .map(([key, note]) => {
          // Extract field info from key (section_field_index)
          const parts = key.split('_');
          const section = parts[0];
          const field = parts.slice(1, -1).join('_');
          return `${section} - ${field}: ${note}`;
        })
        .join('\n\n');
    }
    
    setShiftNotes(prev => ({ 
      ...prev, 
      slMissingFieldsNote: combinedNote,
      slMissingFields: slMissingFields,
      slFieldConfirmations: fieldConfirmations,
      slFieldNotes: fieldNotes // Store individual notes too
    }));
    setShowSLMissingFields(false);
    // Clear highlights
    setHighlightedFields({});
    
    // Since note is required, proceed with saving
    try {
      if (window.electronAPI && window.electronAPI.closeShift) {
        // Add shift notes to formData before closing
        const formDataWithNotes = {
          ...formData,
          shiftNotes: {
            ...shiftNotes,
            slMissingFieldsNote: combinedNote,
            slMissingFields: slMissingFields,
            slFieldConfirmations: fieldConfirmations
          }
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
      
      if (vvaErrors.length > 0) {
        // Show missing fields dialog instead of alert
        setVvaMissingFields(vvaErrors);
        setShowVVAMissingFields(true);
        // Clear previous highlights when opening dialog
        setHighlightedFields({});
        
        // Highlight the first section with errors
        if (vvaErrors.length > 0) {
          setActiveSection(vvaErrors[0].sectionId);
        }
        
        return; // Stop execution if validation fails
      }
      
      // All VVA validations passed - clear highlights and show confirmation dialog
      setHighlightedFields({});
      setShowVVAConfirmation(true);
      
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
      
      if (filteredSlErrors.length > 0) {
        // Show missing fields dialog instead of alert
        setSlMissingFields(filteredSlErrors);
        setShowSLMissingFields(true);
        // Clear previous highlights when opening dialog
        setHighlightedFields({});
        
        // Highlight the first section with errors
        if (filteredSlErrors.length > 0) {
          setActiveSection(filteredSlErrors[0].sectionId);
        }
        
        return; // Stop execution if validation fails
      }
      
      // All validation passed - show confirmation dialog
      setHighlightedFields({});
      setShowCloseShiftConfirmation(true);
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

