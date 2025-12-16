const { useState, useEffect } = React;

function useShiftState() {
  const [shiftStarted, setShiftStarted] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('VVA'); // 'VVA' or 'SL'
  const [shiftNotes, setShiftNotes] = useState(window.AppConstants.getInitialShiftNotes());
  const [highlightedFields, setHighlightedFields] = useState({});
  const [printedTemplates, setPrintedTemplates] = useState(window.AppConstants.getInitialPrintedTemplates());
  
  // Dialog states
  const [showVVAConfirmation, setShowVVAConfirmation] = useState(false);
  const [showVVAMissingFields, setShowVVAMissingFields] = useState(false);
  const [vvaMissingFields, setVvaMissingFields] = useState([]);
  const [showSLMissingFields, setShowSLMissingFields] = useState(false);
  const [slMissingFields, setSlMissingFields] = useState([]);
  const [showCloseShiftConfirmation, setShowCloseShiftConfirmation] = useState(false);

  // Load current phase on mount
  useEffect(() => {
    const loadPhase = async () => {
      if (window.electronAPI && window.electronAPI.loadData) {
        try {
          const phaseResult = await window.electronAPI.loadData('currentPhase');
          if (phaseResult.success && phaseResult.data) {
            setCurrentPhase(phaseResult.data);
          }
        } catch (error) {
          console.error('Error loading current phase:', error);
        }
      }
    };
    
    loadPhase();
  }, []);

  // Auto-save current phase when it changes
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.saveData) {
      window.electronAPI.saveData('currentPhase', currentPhase).catch(error => {
        console.error('Error saving current phase:', error);
      });
    }
  }, [currentPhase]);

  return {
    shiftStarted,
    setShiftStarted,
    currentPhase,
    setCurrentPhase,
    shiftNotes,
    setShiftNotes,
    highlightedFields,
    setHighlightedFields,
    printedTemplates,
    setPrintedTemplates,
    showVVAConfirmation,
    setShowVVAConfirmation,
    showVVAMissingFields,
    setShowVVAMissingFields,
    vvaMissingFields,
    setVvaMissingFields,
    showSLMissingFields,
    setShowSLMissingFields,
    slMissingFields,
    setSlMissingFields,
    showCloseShiftConfirmation,
    setShowCloseShiftConfirmation
  };
}

// Make available globally
window.AppHooks = window.AppHooks || {};
window.AppHooks.useShiftState = useShiftState;

