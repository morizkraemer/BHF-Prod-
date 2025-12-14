const { useState, useEffect } = React;

function App() {
  const [activeSection, setActiveSection] = useState('uebersicht');
  const [currentPhase, setCurrentPhase] = useState('VVA'); // 'VVA' or 'SL'
  const [formData, setFormData] = useState({
    uebersicht: {},
    'rider-extras': {},
    tontechniker: {},
    orderbird: {},
    secu: {
      securityPersonnel: [{ name: '', startTime: '', endTime: '' }],
      scannedDocuments: []
    },
    'andere-mitarbeiter': {
      mitarbeiter: []
    },
    gaeste: {}
  });

  const sections = [
    { id: 'uebersicht', name: 'Übersicht' },
    { id: 'rider-extras', name: 'Hospitality' },
    { id: 'tontechniker', name: 'Ton/Lichttechnik' },
    { id: 'secu', name: 'Secu' },
    { id: 'andere-mitarbeiter', name: 'Andere Mitarbeiter' },
    { id: 'gaeste', name: 'Gäste' },
    { id: 'orderbird', name: 'Orderbird' }
  ];

  const settingsSection = { id: 'settings', name: 'Settings' };
  const [scannerName, setScannerName] = useState(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [showVVAConfirmation, setShowVVAConfirmation] = useState(false);
  const [showVVAMissingFields, setShowVVAMissingFields] = useState(false);
  const [vvaMissingFields, setVvaMissingFields] = useState([]);
  const [showSLMissingFields, setShowSLMissingFields] = useState(false);
  const [slMissingFields, setSlMissingFields] = useState([]);
  const [showCloseShiftConfirmation, setShowCloseShiftConfirmation] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState({});
  const [shiftNotes, setShiftNotes] = useState({
    vvaConfirmationNote: null,
    closeShiftConfirmationNote: null,
    vvaMissingFieldsNote: null,
    slMissingFieldsNote: null,
    vvaMissingFields: null,
    slMissingFields: null,
    vvaFieldConfirmations: null,
    slFieldConfirmations: null
  });
  const [shiftStarted, setShiftStarted] = useState(false);
  
  // Global scanner availability state - can be accessed by child components
  window.scannerAvailability = {
    available: scannerAvailable,
    name: scannerName,
    setAvailable: setScannerAvailable,
    setName: setScannerName
  };

  // Load saved shift data on mount
  useEffect(() => {
    const loadShiftData = async () => {
      if (window.electronAPI && window.electronAPI.loadData) {
        try {
          // Load form data
          const formDataResult = await window.electronAPI.loadData('currentShiftData');
          if (formDataResult.success && formDataResult.data) {
            setFormData(formDataResult.data);
            // If there's saved shift data, consider the shift as started
            setShiftStarted(true);
          }
          
          // Load current phase
          const phaseResult = await window.electronAPI.loadData('currentPhase');
          if (phaseResult.success && phaseResult.data) {
            setCurrentPhase(phaseResult.data);
          }
        } catch (error) {
          console.error('Error loading shift data:', error);
        }
      }
    };
    
    loadShiftData();
  }, []);

  useEffect(() => {
    // Check scanner availability
    const checkScannerAvailability = async () => {
      if (window.electronAPI && window.electronAPI.checkScannerAvailability) {
        try {
          const result = await window.electronAPI.checkScannerAvailability();
          if (result && result.name) {
            setScannerName(result.name);
            setScannerAvailable(result.available);
            // Update global state
            if (window.scannerAvailability) {
              window.scannerAvailability.available = result.available;
              window.scannerAvailability.name = result.name;
            }
          } else {
            setScannerName('Kein Scanner ausgewählt');
            setScannerAvailable(false);
            if (window.scannerAvailability) {
              window.scannerAvailability.available = false;
              window.scannerAvailability.name = 'Kein Scanner ausgewählt';
            }
          }
        } catch (error) {
          setScannerName('Kein Scanner ausgewählt');
          setScannerAvailable(false);
          if (window.scannerAvailability) {
            window.scannerAvailability.available = false;
            window.scannerAvailability.name = 'Kein Scanner ausgewählt';
          }
        }
      }
    };

    checkScannerAvailability();
    // Refresh scanner availability every 5 seconds
    const interval = setInterval(checkScannerAvailability, 5000);
    
    // Initialize Lucide icons
    const initIcons = () => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    };
    initIcons();
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    // Re-initialize icons when active section changes
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeSection]);

  // Auto-save form data when it changes (debounced)
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.saveData) {
      const timeoutId = setTimeout(() => {
        window.electronAPI.saveData('currentShiftData', formData).catch(error => {
          console.error('Error saving form data:', error);
        });
      }, 1000); // Debounce by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  // Auto-save current phase when it changes
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.saveData) {
      window.electronAPI.saveData('currentPhase', currentPhase).catch(error => {
        console.error('Error saving current phase:', error);
      });
    }
  }, [currentPhase]);

  const handleFormDataChange = (sectionId, data) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: data
    }));
  };

  // Validate VVA -> SL transition (specific fields required)
  const validateVVAtoSL = () => {
    const errors = [];
    const uebersichtData = formData.uebersicht || {};
    const riderExtrasData = formData['rider-extras'] || {};
    
    // Event Name
    if (!uebersichtData.eventName || uebersichtData.eventName === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Event Name' });
    }
    
    // Event Type
    if (!uebersichtData.eventType || uebersichtData.eventType === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Event Typ' });
    }
    
    // Nightliner Parkplatz (now in Hospitality section)
    if (!uebersichtData.nightlinerParkplatz || uebersichtData.nightlinerParkplatz === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Nightliner Parkplatz' });
    }
    
    // Get in Zeit
    if (!uebersichtData.getInTime || uebersichtData.getInTime === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Get In Zeit' });
    }
    
    // Doors Zeit
    if (!uebersichtData.doorsTime || uebersichtData.doorsTime === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Doors Zeit' });
    }
    
    // Travel Party Get In (now in Hospitality section)
    if (!uebersichtData.travelPartyGetIn || uebersichtData.travelPartyGetIn === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Travel Party Get In' });
    }

    // Catering options (getInCatering and dinner)
    if (!riderExtrasData.getInCatering || riderExtrasData.getInCatering === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Get In Catering' });
    }
    
    if (!riderExtrasData.dinner || riderExtrasData.dinner === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Dinner' });
    }
    
    // Handtuchzettel scan (scannedDocuments with scanName="Handtuchzettel") - only required for Konzert events
    if (uebersichtData.eventType === 'konzert') {
      const scannedDocuments = riderExtrasData.scannedDocuments || [];
      const handtuchzettelScans = scannedDocuments.filter(doc => doc.scanName === 'Handtuchzettel');
      if (handtuchzettelScans.length === 0) {
        errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Handtuchzettel Scan' });
      }
    }
    
    // Backstage Kühlschrank (standardbestueckung)
    if (!riderExtrasData.standardbestueckung || riderExtrasData.standardbestueckung === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Backstage Kühlschrank' });
    }
    
    return errors;
  };

  // Validate all required fields across all sections (for SL phase)
  const validateAllSections = () => {
    const errors = [];
    const sectionsToValidate = ['uebersicht', 'rider-extras', 'tontechniker', 'secu', 'orderbird'];
    
    sectionsToValidate.forEach(sectionId => {
      const count = getRequiredFieldsCount(sectionId);
      if (count.total > 0 && count.filled < count.total) {
        const sectionName = sections.find(s => s.id === sectionId)?.name || sectionId;
        errors.push({
          section: sectionName,
          sectionId: sectionId,
          missing: count.total - count.filled,
          total: count.total,
          filled: count.filled
        });
      }
    });
    
    return errors;
  };

  // Validate all required fields with detailed field-level errors (for SL phase)
  const validateAllSectionsDetailed = () => {
    const errors = [];
    const uebersichtData = formData.uebersicht || {};
    const riderExtrasData = formData['rider-extras'] || {};
    const tontechnikerData = formData.tontechniker || {};
    const secuData = formData.secu || {};
    const orderbirdData = formData.orderbird || {};
    
    // Übersicht section
    const uebersichtRequired = ['eventName', 'date', 'eventType', 'getInTime', 'doorsTime', 'nightLead', 'konzertende', 'backstageCurfew'];
    if (uebersichtData.eventType === 'konzert') {
      uebersichtRequired.push('agentur');
    } else if (uebersichtData.eventType === 'club' || uebersichtData.eventType === 'andere') {
      uebersichtRequired.push('veranstalterName');
    }
    
    const fieldNameMap = {
      'eventName': 'Event Name',
      'date': 'Datum',
      'eventType': 'Event Typ',
      'getInTime': 'Get In Zeit',
      'doorsTime': 'Doors Zeit',
      'nightLead': 'Night Lead',
      'konzertende': 'Konzertende',
      'backstageCurfew': 'Backstage Curfew',
      'agentur': 'Agentur',
      'veranstalterName': 'Veranstalter Name'
    };
    
    uebersichtRequired.forEach(field => {
      const value = uebersichtData[field];
      if (value === undefined || value === null || value === '') {
        errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: fieldNameMap[field] || field });
      }
    });
    
    // Hospitality section
    // Travel Party Get In (stored in uebersicht but required in hospitality)
    if (!uebersichtData.travelPartyGetIn || uebersichtData.travelPartyGetIn === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Travel Party Get In' });
    }
    // Nightliner Parkplatz (stored in uebersicht but required in hospitality)
    if (!uebersichtData.nightlinerParkplatz || uebersichtData.nightlinerParkplatz === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Nightliner Parkplatz' });
    }
    if (!riderExtrasData.getInCatering || riderExtrasData.getInCatering === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Get In Catering' });
    }
    if (!riderExtrasData.dinner || riderExtrasData.dinner === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Dinner' });
    }
    if (!riderExtrasData.standardbestueckung || riderExtrasData.standardbestueckung === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Backstage Kühlschrank' });
    }
    
    // Handtuchzettel scan - only required for Konzert events
    if (uebersichtData.eventType === 'konzert') {
      const scannedDocuments = riderExtrasData.scannedDocuments || [];
      const handtuchzettelScans = scannedDocuments.filter(doc => doc.scanName === 'Handtuchzettel');
      if (handtuchzettelScans.length === 0) {
        errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Handtuchzettel Scan' });
      }
    }
    
    // Ton/Lichttechnik section
    if (tontechnikerData.soundEngineerEnabled !== false) {
      if (!tontechnikerData.soundEngineerName || tontechnikerData.soundEngineerName === '') {
        errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Sound Engineer Name' });
      }
      if (!tontechnikerData.soundEngineerStartTime || tontechnikerData.soundEngineerStartTime === '') {
        errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Sound Engineer Start Zeit' });
      }
      if (!tontechnikerData.soundEngineerEndTime || tontechnikerData.soundEngineerEndTime === '') {
        errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Sound Engineer End Zeit' });
      }
    }
    if (tontechnikerData.lightingTechEnabled === true) {
      if (!tontechnikerData.lightingTechName || tontechnikerData.lightingTechName === '') {
        errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Lighting Tech Name' });
      }
      if (!tontechnikerData.lightingTechStartTime || tontechnikerData.lightingTechStartTime === '') {
        errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Lighting Tech Start Zeit' });
      }
      if (!tontechnikerData.lightingTechEndTime || tontechnikerData.lightingTechEndTime === '') {
        errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Lighting Tech End Zeit' });
      }
    }
    // Only require scanning if at least one tech is enabled
    const soundEngineerEnabled = tontechnikerData.soundEngineerEnabled !== false;
    const lightingTechEnabled = tontechnikerData.lightingTechEnabled === true;
    if (soundEngineerEnabled || lightingTechEnabled) {
      const scannedImages = tontechnikerData.scannedImages || [];
      if (scannedImages.length === 0) {
        errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Gescannte Bilder' });
      }
    }
    
    // Secu section
    const securityPersonnel = secuData.securityPersonnel || [];
    if (securityPersonnel.length > 0) {
      securityPersonnel.forEach((person, index) => {
        if (!person.name || person.name.trim() === '') {
          errors.push({ section: 'Secu', sectionId: 'secu', field: `Secu Person ${index + 1} Name` });
        }
        if (!person.startTime || person.startTime === '') {
          errors.push({ section: 'Secu', sectionId: 'secu', field: `Secu Person ${index + 1} Start Zeit` });
        }
        if (!person.endTime || person.endTime === '') {
          errors.push({ section: 'Secu', sectionId: 'secu', field: `Secu Person ${index + 1} End Zeit` });
        }
      });
      const secuScannedDocuments = secuData.scannedDocuments || [];
      if (secuScannedDocuments.length === 0) {
        errors.push({ section: 'Secu', sectionId: 'secu', field: 'Gescannte Dokumente' });
      }
    }
    
    // Andere Mitarbeiter section
    const andereMitarbeiterData = formData['andere-mitarbeiter'] || {};
    const mitarbeiter = andereMitarbeiterData.mitarbeiter || [];
    if (mitarbeiter.length > 0) {
      mitarbeiter.forEach((person, index) => {
        if (!person.name || person.name.trim() === '') {
          errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} Name` });
        }
        if (!person.startTime || person.startTime === '') {
          errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} Start Zeit` });
        }
        if (!person.endTime || person.endTime === '') {
          errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} End Zeit` });
        }
        if (!person.category || person.category === '') {
          errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} Kategorie` });
        }
      });
    }
    
    // Orderbird section
    const hasScans = orderbirdData.receipts && orderbirdData.receipts.length > 0;
    if (!hasScans) {
      errors.push({ section: 'Orderbird', sectionId: 'orderbird', field: 'Belege Scans' });
    }
    if (orderbirdData.zBericht !== true) {
      errors.push({ section: 'Orderbird', sectionId: 'orderbird', field: 'Z Bericht' });
    }
    if (orderbirdData.benutzerberichte !== true) {
      errors.push({ section: 'Orderbird', sectionId: 'orderbird', field: 'Benutzerberichte' });
    }
    
    // Gäste section - Agenturzettel required for Konzert events
    const gaesteData = formData.gaeste || {};
    if (uebersichtData.eventType === 'konzert') {
      const agenturzettelScans = gaesteData.scannedDocuments || [];
      const hasAgenturzettel = agenturzettelScans.some(doc => doc.scanName === 'Agenturzettel');
      if (!hasAgenturzettel) {
        errors.push({ section: 'Gäste', sectionId: 'gaeste', field: 'Agenturzettel Scan' });
      }
    }
    if (!gaesteData.gaesteGesamt || gaesteData.gaesteGesamt === '') {
      errors.push({ section: 'Gäste', sectionId: 'gaeste', field: 'Gäste Gesamt' });
    }
    
    return errors;
  };

  // Check if there are extras in hospitality
  const hasHospitalityExtras = () => {
    const riderExtrasData = formData['rider-extras'] || {};
    const items = riderExtrasData.items || [];
    // Check if there are any items with text/name filled
    return items.some(item => item.text && item.text.trim() !== '');
  };

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

  const handleVVAMissingFieldsFinishAnyway = (fieldNotes, fieldConfirmations) => {
    // Combine all field notes into a single note string
    const combinedNote = Object.entries(fieldNotes)
      .map(([key, note]) => {
        // Extract field info from key (section_field_index)
        const parts = key.split('_');
        const section = parts[0];
        const field = parts.slice(1, -1).join('_');
        return `${section} - ${field}: ${note}`;
      })
      .join('\n\n');
    
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

  const handleVVAMissingFieldsCancel = () => {
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

  const handleSLMissingFieldsFinishAnyway = async (fieldNotes, fieldConfirmations) => {
    // Combine all field notes into a single note string
    const combinedNote = Object.entries(fieldNotes)
      .map(([key, note]) => {
        // Extract field info from key (section_field_index)
        const parts = key.split('_');
        const section = parts[0];
        const field = parts.slice(1, -1).join('_');
        return `${section} - ${field}: ${note}`;
      })
      .join('\n\n');
    
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
              setFormData({
                uebersicht: {},
                'rider-extras': {},
                tontechniker: {},
                orderbird: {},
                secu: {
                  securityPersonnel: [{ name: '', startTime: '', endTime: '' }],
                  scannedDocuments: []
                },
                'andere-mitarbeiter': {
                  mitarbeiter: [{ name: '', startTime: '', endTime: '', category: '' }]
                },
                gaeste: {}
              });
              setShiftNotes({
                vvaConfirmationNote: null,
                closeShiftConfirmationNote: null,
                vvaMissingFieldsNote: null,
                slMissingFieldsNote: null,
                vvaMissingFields: null,
                slMissingFields: null,
                vvaFieldConfirmations: null,
                slFieldConfirmations: null
              });
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

  const handleSLMissingFieldsCancel = () => {
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

  const handleCloseShift = () => {
    if (currentPhase === 'VVA') {
      // Validate VVA -> SL transition
      const vvaErrors = validateVVAtoSL();
      
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
      const slErrors = validateAllSectionsDetailed();
      
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
          setFormData({
            uebersicht: {},
            'rider-extras': {},
            tontechniker: {},
            orderbird: {},
            secu: {
              securityPersonnel: [{ name: '', startTime: '', endTime: '' }],
              scannedDocuments: []
            },
            gaeste: {}
          });
          setShiftNotes({
            vvaConfirmationNote: null,
            closeShiftConfirmationNote: null,
            vvaMissingFieldsNote: null,
            slMissingFieldsNote: null,
            vvaMissingFields: null,
            slMissingFields: null
          });
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

  const handleFillTestData = () => {
    const today = new Date().toISOString().split('T')[0];
    const testData = {
      uebersicht: {
        eventName: 'Test Event 2025',
        date: today,
        eventType: 'konzert',
        getInTime: '14:00',
        getInTatsachlich: '14:15',
        doorsTime: '19:00',
        doorsTatsachlich: '19:05',
        travelPartyGetIn: '25',
        travelPartyTatsachlich: '27',
        konzertende: '23:30',
        konzertendeTatsachlich: '23:45',
        backstageCurfew: '01:00',
        backstageCurfewTatsachlich: '01:15',
        nightLead: 'Max Mustermann',
        nightlinerParkplatz: 'yes',
        agentur: 'Test Agentur GmbH',
        agenturAPName: 'Test Agentur AP',
        vva: 'VVA-12345'
      },
      'rider-extras': {
        getInCatering: 'kalt',
        dinner: 'warm',
        standardbestueckung: 'standard-konzert',
        buyoutProvider: '',
        buyoutGroups: [],
        items: [
          {
            amount: '2',
            text: 'Test Extra Item 1',
            price: '15.50',
            discount: '50',
            originalPrice: '31.00',
            ekPrice: null,
            checked: true
          },
          {
            amount: '1',
            text: 'Test Extra Item 2',
            price: '25.00',
            discount: '',
            originalPrice: '25.00',
            ekPrice: null,
            checked: false
          }
        ],
        customizedFridgeItems: [
          { name: 'Cola', amount: 12, price: 2.50 },
          { name: 'Wasser', amount: 24, price: 1.50 },
          { name: 'Bier', amount: 20, price: 3.00 }
        ],
        scannedDocuments: [],
        purchaseReceipts: [],
        notes: 'Test Notizen für Hospitality'
      },
      tontechniker: {
        soundEngineerEnabled: true,
        soundEngineerName: 'Hans Sound',
        soundEngineerStartTime: '14:00',
        soundEngineerEndTime: '00:00',
        lightingTechEnabled: true,
        lightingTechName: 'Lisa Light',
        lightingTechStartTime: '15:00',
        lightingTechEndTime: '23:30',
        scannedImages: []
      },
      secu: {
        securityPersonnel: [
          { name: 'Security Person 1', startTime: '18:00', endTime: '02:00' },
          { name: 'Security Person 2', startTime: '19:00', endTime: '01:00' }
        ],
        scannedDocuments: []
      },
      'andere-mitarbeiter': {
        mitarbeiter: [
          { name: 'Max Mustermann', startTime: '17:00', endTime: '01:00', category: 'Kasse' },
          { name: 'Anna Schmidt', startTime: '18:00', endTime: '02:00', category: 'WC' }
        ]
      },
      orderbird: {
        receipts: [],
        zBericht: true,
        benutzerberichte: true,
        veranstalter1: true,
        veranstalter2: false,
        veranstalter3: false,
        agentur: true,
        persoBeleg: false,
        sonstige: false
      },
      gaeste: {
        paymentType: 'selbstzahler',
        pauschaleOptions: {
          standard: false,
          longdrinks: false,
          sektCocktails: false,
          shots: false
        },
        anzahlAbendkasse: '150',
        betragAbendkasse: '15.00',
        gaesteGesamt: '500',
        scannedDocuments: []
      }
    };
    
    setFormData(testData);
    alert('Test-Daten wurden eingefügt!');
  };

  // Function to check if a shift is currently active
  const isShiftActive = () => {
    // If a shift has been manually started, consider it active
    if (shiftStarted) {
      return true;
    }
    
    const uebersichtData = formData.uebersicht || {};
    
    // Check if any key fields are filled in the overview section
    const keyFields = ['eventName', 'date', 'eventType'];
    const hasKeyData = keyFields.some(field => {
      const value = uebersichtData[field];
      return value !== undefined && value !== null && value !== '';
    });
    
    // Also check if any other sections have meaningful data
    const hasOtherData = Object.keys(formData).some(sectionId => {
      if (sectionId === 'uebersicht') return false;
      
      const sectionData = formData[sectionId] || {};
      
      // For secu section, check if there are filled personnel entries
      if (sectionId === 'secu') {
        const personnel = sectionData.securityPersonnel || [];
        return personnel.some(person => person.name && person.name.trim() !== '');
      }
      
      // For andere-mitarbeiter section, check if there are filled entries
      if (sectionId === 'andere-mitarbeiter') {
        const mitarbeiter = sectionData.mitarbeiter || [];
        return mitarbeiter.some(person => person.name && person.name.trim() !== '');
      }
      
      // For other sections, check if any string fields are filled
      return Object.values(sectionData).some(value => {
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === 'boolean') {
          return value === true;
        }
        return false;
      });
    });
    
    return hasKeyData || hasOtherData;
  };

  // Function to handle starting a new shift
  const handleStartShift = () => {
    // Mark shift as started
    setShiftStarted(true);
    
    // Reset all form data to defaults
    setFormData({
      uebersicht: {},
      'rider-extras': {},
      tontechniker: {},
      orderbird: {},
      secu: {
        securityPersonnel: [{ name: '', startTime: '', endTime: '' }],
        scannedDocuments: []
      },
      gaeste: {}
    });
    
    // Reset shift notes
    setShiftNotes({
      vvaConfirmationNote: null,
      closeShiftConfirmationNote: null,
      vvaMissingFieldsNote: null,
      slMissingFieldsNote: null,
      vvaMissingFields: null,
      slMissingFields: null
    });
    
    // Reset phase to VVA
    setCurrentPhase('VVA');
    
    // Set active section to overview
    setActiveSection('uebersicht');
    
    // Clear any highlighted fields
    setHighlightedFields({});
  };

  // Function to count filled required fields for each section
  const getRequiredFieldsCount = (sectionId) => {
    const data = formData[sectionId] || {};
    const uebersichtData = formData.uebersicht || {}; // Used in multiple cases
    
    switch (sectionId) {
      case 'uebersicht':
        let uebersichtRequired = ['eventName', 'date', 'eventType', 'getInTime', 'doorsTime', 'nightLead', 'konzertende', 'backstageCurfew'];

        // Add conditional required fields based on event type
        if (data.eventType === 'konzert') {
          uebersichtRequired.push('agentur');
        } else if (data.eventType === 'club' || data.eventType === 'andere') {
          uebersichtRequired.push('veranstalterName');
        }

        const uebersichtFilled = uebersichtRequired.filter(field => {
          const value = data[field];
          return value !== undefined && value !== null && value !== '';
        }).length;
        return { filled: uebersichtFilled, total: uebersichtRequired.length };
      
      case 'tontechniker':
        // Count required fields based on enabled checkboxes
        let tontechnikerRequired = [];
        let tontechnikerFilled = 0;
        
        // Sound engineer fields are required if enabled (default true)
        if (data.soundEngineerEnabled !== false) {
          const soundFields = ['soundEngineerName', 'soundEngineerStartTime', 'soundEngineerEndTime'];
          tontechnikerRequired = tontechnikerRequired.concat(soundFields);
          soundFields.forEach(field => {
            const value = data[field];
            if (value !== undefined && value !== null && value !== '') {
              tontechnikerFilled++;
            }
          });
        }
        
        // Lighting tech fields are required if enabled
        if (data.lightingTechEnabled === true) {
          const lightingFields = ['lightingTechName', 'lightingTechStartTime', 'lightingTechEndTime'];
          tontechnikerRequired = tontechnikerRequired.concat(lightingFields);
          lightingFields.forEach(field => {
            const value = data[field];
            if (value !== undefined && value !== null && value !== '') {
              tontechnikerFilled++;
            }
          });
        }
        
        // Scanned images are only required if at least one tech is enabled
        const soundEngineerEnabled = data.soundEngineerEnabled !== false;
        const lightingTechEnabled = data.lightingTechEnabled === true;
        if (soundEngineerEnabled || lightingTechEnabled) {
          const scannedImages = data.scannedImages || [];
          tontechnikerRequired.push('scannedImages');
          if (scannedImages.length > 0) {
            tontechnikerFilled++;
          }
        }
        
        return { filled: tontechnikerFilled, total: tontechnikerRequired.length };
      
      case 'rider-extras':
        const hospitalityRequired = ['getInCatering', 'dinner', 'standardbestueckung', 'travelPartyGetIn', 'nightlinerParkplatz'];
        let hospitalityFilled = hospitalityRequired.filter(field => {
          // Travel Party Get In and Nightliner Parkplatz are stored in uebersicht data
          if (field === 'travelPartyGetIn' || field === 'nightlinerParkplatz') {
            const value = uebersichtData[field];
            return value !== undefined && value !== null && value !== '';
          }
          const value = data[field];
          return value !== undefined && value !== null && value !== '';
        }).length;
        
        // Handtuchzettel scan - only required for Konzert events
        if (uebersichtData.eventType === 'konzert') {
          hospitalityRequired.push('handtuchzettelScan');
          const scannedDocuments = data.scannedDocuments || [];
          const hasHandtuchzettel = scannedDocuments.some(doc => doc.scanName === 'Handtuchzettel');
          if (hasHandtuchzettel) {
            hospitalityFilled++;
          }
        }
        
        return { filled: hospitalityFilled, total: hospitalityRequired.length };
      
      case 'secu':
        // Each security person's fields are required if there are any personnel entries
        const securityPersonnel = data.securityPersonnel || [];
        if (securityPersonnel.length === 0) {
          // No personnel = no required fields
          return { filled: 0, total: 0 };
        }
        
        // For each person, name, startTime, and endTime are required
        let secuRequired = securityPersonnel.length * 3; // 3 fields per person
        let secuFilled = 0;
        
        securityPersonnel.forEach(person => {
          if (person.name && person.name.trim() !== '') secuFilled++;
          if (person.startTime && person.startTime !== '') secuFilled++;
          if (person.endTime && person.endTime !== '') secuFilled++;
        });
        
        // Scanned documents are also required if there are personnel
        const scannedDocuments = data.scannedDocuments || [];
        secuRequired += 1; // Add 1 for scanned documents
        if (scannedDocuments.length > 0) {
          secuFilled++;
        }
        
        return { filled: secuFilled, total: secuRequired };
      
      case 'andere-mitarbeiter':
        // Each person's fields are required if there are any entries
        const mitarbeiter = data.mitarbeiter || [];
        if (mitarbeiter.length === 0) {
          // No personnel = no required fields
          return { filled: 0, total: 0 };
        }
        
        // For each person, name, startTime, endTime, and category are required
        let andereMitarbeiterRequired = mitarbeiter.length * 4; // 4 fields per person
        let andereMitarbeiterFilled = 0;
        
        mitarbeiter.forEach(person => {
          if (person.name && person.name.trim() !== '') andereMitarbeiterFilled++;
          if (person.startTime && person.startTime !== '') andereMitarbeiterFilled++;
          if (person.endTime && person.endTime !== '') andereMitarbeiterFilled++;
          if (person.category && person.category !== '') andereMitarbeiterFilled++;
        });
        
        return { filled: andereMitarbeiterFilled, total: andereMitarbeiterRequired };
      
      case 'orderbird':
        // Required: at least one scan, Z Bericht, Benutzerberichte
        const hasScans = formData.orderbird?.receipts && formData.orderbird.receipts.length > 0;
        const hasZBericht = formData.orderbird?.zBericht === true;
        const hasBenutzerberichte = formData.orderbird?.benutzerberichte === true;
        const orderbirdFilled = (hasScans ? 1 : 0) + (hasZBericht ? 1 : 0) + (hasBenutzerberichte ? 1 : 0);
        const orderbirdRequired = 3;
        return { filled: orderbirdFilled, total: orderbirdRequired };
      
      case 'gaeste':
        const gaesteData = formData.gaeste || {};
        let gaesteRequired = ['gaesteGesamt'];
        let gaesteFilled = gaesteRequired.filter(field => {
          const value = gaesteData[field];
          return value !== undefined && value !== null && value !== '';
        }).length;
        
        // Agenturzettel scan required for Konzert events
        if (uebersichtData.eventType === 'konzert') {
          gaesteRequired.push('agenturzettelScan');
          const agenturzettelScans = gaesteData.scannedDocuments || [];
          const hasAgenturzettel = agenturzettelScans.some(doc => doc.scanName === 'Agenturzettel');
          if (hasAgenturzettel) {
            gaesteFilled++;
          }
        }
        
        return { filled: gaesteFilled, total: gaesteRequired.length };
      
      default:
        return { filled: 0, total: 0 };
    }
  };

  // StartShiftScreen component
  const StartShiftScreen = () => {
    return (
      <div className="start-shift-screen">
        <div className="start-shift-container">
          <h1 className="start-shift-title">Produktionsübersicht</h1>
          <p className="start-shift-subtitle">Kein aktiver Shift</p>
          <button 
            className="start-shift-button"
            onClick={handleStartShift}
          >
            <i data-lucide="play"></i>
            <span>Shift starten</span>
          </button>
        </div>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'uebersicht':
        return (
          <UebersichtForm
            formData={formData.uebersicht}
            onDataChange={(data) => handleFormDataChange('uebersicht', data)}
            highlightedFields={highlightedFields.uebersicht || []}
          />
        );
      case 'rider-extras':
        return (
          <RiderExtrasForm
            formData={formData['rider-extras']}
            onDataChange={(data) => handleFormDataChange('rider-extras', data)}
            highlightedFields={highlightedFields['rider-extras'] || []}
          />
        );
      case 'tontechniker':
        return (
          <TontechnikerForm
            formData={formData.tontechniker}
            onDataChange={(data) => handleFormDataChange('tontechniker', data)}
            highlightedFields={highlightedFields.tontechniker || []}
          />
        );
      case 'secu':
        return (
          <SecuForm
            formData={formData.secu}
            onDataChange={(data) => handleFormDataChange('secu', data)}
            highlightedFields={highlightedFields.secu || []}
          />
        );
      case 'andere-mitarbeiter':
        return (
          <AndereMitarbeiterForm
            formData={formData['andere-mitarbeiter']}
            onDataChange={(data) => handleFormDataChange('andere-mitarbeiter', data)}
            highlightedFields={highlightedFields['andere-mitarbeiter'] || []}
          />
        );
      case 'gaeste':
        return (
          <GaesteForm
            formData={formData.gaeste}
            onDataChange={(data) => handleFormDataChange('gaeste', data)}
            highlightedFields={highlightedFields.gaeste || []}
          />
        );
      case 'orderbird':
        return (
          <OrderbirdForm
            formData={formData.orderbird}
            onDataChange={(data) => handleFormDataChange('orderbird', data)}
            highlightedFields={highlightedFields.orderbird || []}
          />
        );
      case 'settings':
        return <SettingsForm />;
      default:
        return null;
    }
  };

  // Check if shift is active to determine which UI to show
  if (!isShiftActive()) {
    return <StartShiftScreen />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">
          ProdÜ
          <span className="sidebar-phase-badge">{currentPhase}</span>
        </h2>
        <nav className="sidebar-nav">
          {sections.map(section => {
            const count = getRequiredFieldsCount(section.id);
            const isComplete = (count.total > 0 && count.filled === count.total) || count.total === 0;
            
            return (
              <button
                key={section.id}
                className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="sidebar-item-name">{section.name}</span>
                <span className={`sidebar-item-counter ${isComplete ? 'sidebar-item-counter-complete' : ''}`}>
                  {count.total > 0 ? `${count.filled}/${count.total}` : '—'}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom-section">
          {/* Printer Status */}
          <div className="sidebar-printer-section">
            <div className="sidebar-printer-label">Printer</div>
            <div className="sidebar-scanner-status">
              <span className={`sidebar-scanner-status-name ${scannerAvailable ? 'sidebar-scanner-connected' : 'sidebar-scanner-disconnected'}`}>
                {scannerName || 'Kein Scanner ausgewählt'}
              </span>
            </div>
          </div>
          <div className="sidebar-divider"></div>
          {/* Test Data Button */}
          <div className="sidebar-test-button-container">
            <button 
              className="test-data-button-sidebar"
              onClick={handleFillTestData}
              title="Füllt alle Felder mit Test-Daten"
            >
              <i data-lucide="flask"></i>
              <span>Test-Daten</span>
            </button>
          </div>
          <div className="sidebar-divider"></div>
          {/* Close Shift and Settings Buttons */}
          <div className="sidebar-bottom-buttons">
            <button 
              className={`settings-button-sidebar ${activeSection === settingsSection.id ? 'active' : ''}`}
              onClick={() => setActiveSection(settingsSection.id)}
              title="Settings"
            >
              <i data-lucide="settings"></i>
            </button>
            <button className="close-shift-button-sidebar" onClick={handleCloseShift}>
              {currentPhase === 'VVA' ? 'FINISH VVA' : 'Close Shift'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-area">
          <div className={`content-title-row ${activeSection === 'uebersicht' ? 'content-title-row-with-button' : ''}`}>
            <h1>{sections.find(s => s.id === activeSection)?.name || settingsSection.name}</h1>
            {activeSection === 'uebersicht' && (
              <div id="uebersicht-print-button-container"></div>
            )}
          </div>
          {activeSection === 'rider-extras' && (
            <div className="travel-party-section">
              <div className="travel-party-nightliner-row">
                <div className="form-group-paired-container">
                  <div className="form-group form-group-paired-left">
                    <label htmlFor="travelPartyGetInTitle">Travel Party Get In *</label>
                    <input
                      type="number"
                      id="travelPartyGetInTitle"
                      value={formData.uebersicht?.travelPartyGetIn || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleFormDataChange('uebersicht', {
                          ...formData.uebersicht,
                          travelPartyGetIn: value,
                          travelPartyTatsachlich: value || formData.uebersicht?.travelPartyTatsachlich || ''
                        });
                      }}
                      className={`form-input ${highlightedFields['rider-extras']?.includes('Travel Party Get In') ? 'field-highlighted' : ''}`}
                      min="0"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="form-group form-group-paired-right">
                    <label htmlFor="travelPartyTatsachlichTitle">Tatsächlich</label>
                    <input
                      type="number"
                      id="travelPartyTatsachlichTitle"
                      value={formData.uebersicht?.travelPartyTatsachlich || ''}
                      onChange={(e) => {
                        handleFormDataChange('uebersicht', {
                          ...formData.uebersicht,
                          travelPartyTatsachlich: e.target.value
                        });
                      }}
                      className="form-input"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="nightliner-parkplatz-box">
                  <div className={`form-group form-group-nightliner-radio ${highlightedFields['rider-extras']?.includes('Nightliner Parkplatz') ? 'field-highlighted-group' : ''}`}>
                    <label className="nightliner-radio-label">Nightliner Parkplatz *</label>
                    <div className="nightliner-radio-buttons">
                      <label className="radio-option-label">
                        <input
                          type="radio"
                          name="nightlinerParkplatz"
                          value="yes"
                          checked={formData.uebersicht?.nightlinerParkplatz === 'yes'}
                          onChange={(e) => {
                            handleFormDataChange('uebersicht', {
                              ...formData.uebersicht,
                              nightlinerParkplatz: e.target.value
                            });
                          }}
                          className="nightliner-radio"
                          required
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-text">Ja</span>
                      </label>
                      <label className="radio-option-label">
                        <input
                          type="radio"
                          name="nightlinerParkplatz"
                          value="no"
                          checked={formData.uebersicht?.nightlinerParkplatz === 'no'}
                          onChange={(e) => {
                            handleFormDataChange('uebersicht', {
                              ...formData.uebersicht,
                              nightlinerParkplatz: e.target.value
                            });
                          }}
                          className="nightliner-radio"
                          required
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-text">Nein</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {renderActiveSection()}
        </div>
      </main>

      {/* VVA Missing Fields Dialog */}
      <VVAMissingFieldsDialog
        isOpen={showVVAMissingFields}
        onFinishAnyway={handleVVAMissingFieldsFinishAnyway}
        onCancel={handleVVAMissingFieldsCancel}
        missingFields={vvaMissingFields}
      />

      {/* SL Missing Fields Dialog */}
      <VVAMissingFieldsDialog
        isOpen={showSLMissingFields}
        onFinishAnyway={handleSLMissingFieldsFinishAnyway}
        onCancel={handleSLMissingFieldsCancel}
        missingFields={slMissingFields}
        title="Fehlende Felder"
      />

      {/* VVA Confirmation Dialog */}
      <VVAConfirmationDialog
        isOpen={showVVAConfirmation}
        onConfirm={handleVVAConfirm}
        onCancel={handleVVACancel}
        hasExtras={hasHospitalityExtras()}
      />

      {/* Close Shift Confirmation Dialog */}
      <CloseShiftConfirmationDialog
        isOpen={showCloseShiftConfirmation}
        onConfirm={handleCloseShiftConfirm}
        onCancel={handleCloseShiftCancel}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

