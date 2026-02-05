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
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  
  // Track shift start time
  const [shiftStartTime, setShiftStartTime] = useState(null);

  // Load current phase and shift start time on mount
  useEffect(() => {
    const loadPhase = async () => {
      if (window.electronAPI && window.electronAPI.loadData) {
        try {
          const phaseResult = await window.electronAPI.loadData('currentPhase');
          if (phaseResult.success && phaseResult.data) {
            setCurrentPhase(phaseResult.data);
          }
          
          // Load shift start time
          const startTimeResult = await window.electronAPI.loadData('shiftStartTime');
          if (startTimeResult.success && startTimeResult.data) {
            setShiftStartTime(startTimeResult.data);
          }
        } catch (error) {
          console.error('Error loading shift state:', error);
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

  // Auto-save shift start time when it changes
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.saveData && shiftStartTime) {
      window.electronAPI.saveData('shiftStartTime', shiftStartTime).catch(error => {
        console.error('Error saving shift start time:', error);
      });
    }
  }, [shiftStartTime]);

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
    setShowCloseShiftConfirmation,
    showDateConfirmation,
    setShowDateConfirmation,
    shiftStartTime,
    setShiftStartTime
  };
}

// Make available globally
window.AppHooks = window.AppHooks || {};
window.AppHooks.useShiftState = useShiftState;

