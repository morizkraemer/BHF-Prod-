const { useState, useEffect } = React;

function App() {
  const [activeSection, setActiveSection] = useState('uebersicht');

  // Use custom hooks
  const shiftState = window.AppHooks.useShiftState();
  const { formData, setFormData, handleFormDataChange } = window.AppHooks.useFormData(shiftState.setShiftStarted);
  const { scannerName, scannerAvailable } = window.AppHooks.useScanner();

  // Create shift handlers
  const handlers = window.AppShiftHandlers.createShiftHandlers({
    formData,
    setFormData,
    currentPhase: shiftState.currentPhase,
    setCurrentPhase: shiftState.setCurrentPhase,
    shiftNotes: shiftState.shiftNotes,
    setShiftNotes: shiftState.setShiftNotes,
    shiftStarted: shiftState.shiftStarted,
    setShiftStarted: shiftState.setShiftStarted,
    setShowVVAConfirmation: shiftState.setShowVVAConfirmation,
    setShowVVAMissingFields: shiftState.setShowVVAMissingFields,
    setVvaMissingFields: shiftState.setVvaMissingFields,
    setShowSLMissingFields: shiftState.setShowSLMissingFields,
    setSlMissingFields: shiftState.setSlMissingFields,
    setShowCloseShiftConfirmation: shiftState.setShowCloseShiftConfirmation,
    setHighlightedFields: shiftState.setHighlightedFields,
    setActiveSection,
    setShowDateConfirmation: shiftState.setShowDateConfirmation,
    shiftStartTime: shiftState.shiftStartTime,
    setShiftStartTime: shiftState.setShiftStartTime
  });

  // Re-initialize icons when active section changes
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeSection]);

  // Function to check if a shift is currently active
  const isShiftActive = () => {
    // If a shift has been manually started, consider it active
    if (shiftState.shiftStarted) {
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

  // Wrapper for getRequiredFieldsCount that uses current formData
  const getRequiredFieldsCountForSection = (sectionId) => {
    return window.AppValidation.getRequiredFieldsCount(sectionId, formData);
  };

  // Check if shift is active to determine which UI to show
  if (!isShiftActive()) {
    return <StartShiftScreen onStartShift={handlers.handleStartShift} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentPhase={shiftState.currentPhase}
        scannerName={scannerName}
        scannerAvailable={scannerAvailable}
        getRequiredFieldsCount={getRequiredFieldsCountForSection}
        onCloseShift={handlers.handleCloseShift}
      />

      <MainContent
        activeSection={activeSection}
        formData={formData}
        highlightedFields={shiftState.highlightedFields}
        printedTemplates={shiftState.printedTemplates}
        handleFormDataChange={handleFormDataChange}
        setPrintedTemplates={shiftState.setPrintedTemplates}
      />

      {/* Date Confirmation Dialog - shown before missing fields if shift started between 00:00-08:00 */}
      <DateConfirmationDialog
        isOpen={shiftState.showDateConfirmation}
        onConfirm={handlers.handleDateConfirm}
        onCancel={handlers.handleDateCancel}
        onDateChange={handlers.handleDateChange}
        currentDate={formData.uebersicht?.date}
        shiftStartTime={shiftState.shiftStartTime}
      />

      {/* VVA Finish Dialog - combines missing fields flow + confirmation */}
      <VVAFinishDialog
        isOpen={shiftState.showVVAConfirmation}
        onConfirm={handlers.handleVVAConfirm}
        onCancel={handlers.handleVVACancel}
        missingFields={shiftState.vvaMissingFields}
        hasExtras={window.AppValidation.hasHospitalityExtras(formData)}
        formData={formData}
      />

      {/* SL Finish Dialog - combines missing fields flow + confirmation */}
      <SLFinishDialog
        isOpen={shiftState.showCloseShiftConfirmation}
        onConfirm={handlers.handleCloseShiftConfirm}
        onCancel={handlers.handleCloseShiftCancel}
        missingFields={shiftState.slMissingFields}
        formData={formData}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
