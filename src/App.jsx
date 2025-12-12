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
    gaeste: {}
  });

  const sections = [
    { id: 'uebersicht', name: 'Übersicht' },
    { id: 'rider-extras', name: 'Hospitality' },
    { id: 'tontechniker', name: 'Ton/Lichttechnik' },
    { id: 'secu', name: 'Secu' },
    { id: 'gaeste', name: 'Gäste' },
    { id: 'orderbird', name: 'Orderbird' }
  ];

  const settingsSection = { id: 'settings', name: 'Settings' };
  const [scannerName, setScannerName] = useState(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [showVVAConfirmation, setShowVVAConfirmation] = useState(false);
  const [showVVAMissingFields, setShowVVAMissingFields] = useState(false);
  const [vvaMissingFields, setVvaMissingFields] = useState([]);
  
  // Global scanner availability state - can be accessed by child components
  window.scannerAvailability = {
    available: scannerAvailable,
    name: scannerName,
    setAvailable: setScannerAvailable,
    setName: setScannerName
  };

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
    
    // Get in Zeit
    if (!uebersichtData.getInTime || uebersichtData.getInTime === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Get In Zeit' });
    }
    
    // Doors Zeit
    if (!uebersichtData.doorsTime || uebersichtData.doorsTime === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Doors Zeit' });
    }
    
    // Travel Party Get In
    if (!uebersichtData.travelPartyGetIn || uebersichtData.travelPartyGetIn === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Travel Party Get In' });
    }
    
    // Catering options (getInCatering and dinner)
    if (!riderExtrasData.getInCatering || riderExtrasData.getInCatering === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Get In Catering' });
    }
    
    if (!riderExtrasData.dinner || riderExtrasData.dinner === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Dinner' });
    }
    
    // Handtuchzettel scan (scannedDocuments with scanName="Handtuchzettel")
    const scannedDocuments = riderExtrasData.scannedDocuments || [];
    const handtuchzettelScans = scannedDocuments.filter(doc => doc.scanName === 'Handtuchzettel');
    if (handtuchzettelScans.length === 0) {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Handtuchzettel Scan' });
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

  // Check if there are extras in hospitality
  const hasHospitalityExtras = () => {
    const riderExtrasData = formData['rider-extras'] || {};
    const items = riderExtrasData.items || [];
    // Check if there are any items with text/name filled
    return items.some(item => item.text && item.text.trim() !== '');
  };

  const handleVVAConfirm = () => {
    setCurrentPhase('SL');
    setShowVVAConfirmation(false);
    alert('VVA Phase abgeschlossen. Sie können nun mit der SL Phase fortfahren.');
  };

  const handleVVACancel = () => {
    setShowVVAConfirmation(false);
  };

  const handleVVAMissingFieldsFinishAnyway = (note) => {
    setShowVVAMissingFields(false);
    // Proceed to VVA confirmation dialog
    setShowVVAConfirmation(true);
  };

  const handleVVAMissingFieldsCancel = () => {
    setShowVVAMissingFields(false);
  };

  const handleCloseShift = () => {
    if (currentPhase === 'VVA') {
      // Validate VVA -> SL transition
      const vvaErrors = validateVVAtoSL();
      
      if (vvaErrors.length > 0) {
        // Show missing fields dialog instead of alert
        setVvaMissingFields(vvaErrors);
        setShowVVAMissingFields(true);
        
        // Highlight the first section with errors
        if (vvaErrors.length > 0) {
          setActiveSection(vvaErrors[0].sectionId);
        }
        
        return; // Stop execution if validation fails
      }
      
      // All VVA validations passed - show confirmation dialog
      setShowVVAConfirmation(true);
      
    } else {
      // SL phase - validate all required fields
      const validationErrors = validateAllSections();
      
      if (validationErrors.length > 0) {
        // Build error message
        const errorMessages = validationErrors.map(err => 
          `• ${err.section}: ${err.missing} von ${err.total} erforderlichen Feldern fehlen`
        ).join('\n');
        
        alert(`Bitte füllen Sie alle erforderlichen Felder aus:\n\n${errorMessages}\n\nBitte überprüfen Sie die markierten Abschnitte in der Sidebar.`);
        
        // Optionally highlight the first section with errors
        if (validationErrors.length > 0) {
          setActiveSection(validationErrors[0].sectionId);
        }
        
        return; // Stop execution if validation fails
      }
      
      // All validation passed - proceed with saving
      console.log('Close Shift clicked - All validations passed');
      console.log('Form Data:', formData);
      
      // TODO: Phase 4 - Generate PDFs and save files
      alert('Alle erforderlichen Felder sind ausgefüllt. Die Speicherfunktion wird in Phase 4 implementiert.');
    }
  };

  // Function to count filled required fields for each section
  const getRequiredFieldsCount = (sectionId) => {
    const data = formData[sectionId] || {};
    
    switch (sectionId) {
      case 'uebersicht':
        let uebersichtRequired = ['eventName', 'date', 'eventType', 'getInTime', 'doorsTime', 'travelPartyGetIn', 'nightLead', 'konzertende', 'backstageCurfew', 'nightlinerParkplatz'];
        
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
        
        // Scanned images are always required
        const scannedImages = data.scannedImages || [];
        tontechnikerRequired.push('scannedImages');
        if (scannedImages.length > 0) {
          tontechnikerFilled++;
        }
        
        return { filled: tontechnikerFilled, total: tontechnikerRequired.length };
      
      case 'rider-extras':
        const hospitalityRequired = ['getInCatering', 'dinner', 'standardbestueckung'];
        const hospitalityFilled = hospitalityRequired.filter(field => {
          const value = data[field];
          return value !== undefined && value !== null && value !== '';
        }).length;
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
      
      case 'orderbird':
        // Required: at least one scan, Z Bericht, Benutzerberichte
        const hasScans = formData.orderbird?.receipts && formData.orderbird.receipts.length > 0;
        const hasZBericht = formData.orderbird?.zBericht === true;
        const hasBenutzerberichte = formData.orderbird?.benutzerberichte === true;
        const orderbirdFilled = (hasScans ? 1 : 0) + (hasZBericht ? 1 : 0) + (hasBenutzerberichte ? 1 : 0);
        const orderbirdRequired = 3;
        return { filled: orderbirdFilled, total: orderbirdRequired };
      
      case 'gaeste':
        const gaesteRequired = ['gaesteGesamt'];
        const gaesteFilled = gaesteRequired.filter(field => {
          const value = formData.gaeste?.[field];
          return value !== undefined && value !== null && value !== '';
        }).length;
        return { filled: gaesteFilled, total: gaesteRequired.length };
      
      default:
        return { filled: 0, total: 0 };
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'uebersicht':
        return (
          <UebersichtForm
            formData={formData.uebersicht}
            onDataChange={(data) => handleFormDataChange('uebersicht', data)}
          />
        );
      case 'rider-extras':
        return (
          <RiderExtrasForm
            formData={formData['rider-extras']}
            onDataChange={(data) => handleFormDataChange('rider-extras', data)}
          />
        );
      case 'tontechniker':
        return (
          <TontechnikerForm
            formData={formData.tontechniker}
            onDataChange={(data) => handleFormDataChange('tontechniker', data)}
          />
        );
      case 'secu':
        return (
          <SecuForm
            formData={formData.secu}
            onDataChange={(data) => handleFormDataChange('secu', data)}
          />
        );
      case 'gaeste':
        return (
          <GaesteForm
            formData={formData.gaeste}
            onDataChange={(data) => handleFormDataChange('gaeste', data)}
          />
        );
      case 'orderbird':
        return (
          <OrderbirdForm
            formData={formData.orderbird}
            onDataChange={(data) => handleFormDataChange('orderbird', data)}
          />
        );
      case 'settings':
        return <SettingsForm />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">
          Sections
          <span className="sidebar-phase-badge">{currentPhase}</span>
        </h2>
        <nav className="sidebar-nav">
          {sections.map(section => {
            const count = getRequiredFieldsCount(section.id);
            const isComplete = count.total > 0 && count.filled === count.total;
            
            return (
              <button
                key={section.id}
                className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="sidebar-item-name">{section.name}</span>
                {count.total > 0 && (
                  <span className={`sidebar-item-counter ${isComplete ? 'sidebar-item-counter-complete' : ''}`}>
                    {count.filled}/{count.total}
                  </span>
                )}
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

      {/* VVA Confirmation Dialog */}
      <VVAConfirmationDialog
        isOpen={showVVAConfirmation}
        onConfirm={handleVVAConfirm}
        onCancel={handleVVACancel}
        hasExtras={hasHospitalityExtras()}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

