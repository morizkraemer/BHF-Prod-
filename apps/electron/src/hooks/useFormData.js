const { useState, useEffect } = React;

// Helper function to check if formData represents an active shift
function isFormDataActive(formData) {
  if (!formData) return false;
  
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
}

function useFormData(setShiftStarted) {
  const [formData, setFormData] = useState(window.AppConstants.getInitialFormData());

  // Load saved shift data on mount
  useEffect(() => {
    const loadShiftData = async () => {
      if (window.electronAPI && window.electronAPI.loadData) {
        try {
          // Load form data
          const formDataResult = await window.electronAPI.loadData('currentShiftData');
          if (formDataResult.success && formDataResult.data) {
            const loadedData = formDataResult.data;
            setFormData(loadedData);
            // Only set shift as started if the loaded data actually represents an active shift
            if (isFormDataActive(loadedData)) {
              setShiftStarted(true);
            }
          }
        } catch (error) {
          console.error('Error loading shift data:', error);
        }
      }
    };
    
    loadShiftData();
  }, [setShiftStarted]);

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

  const handleFormDataChange = (sectionId, data) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: data
    }));
  };

  return {
    formData,
    setFormData,
    handleFormDataChange
  };
}

// Make available globally
window.AppHooks = window.AppHooks || {};
window.AppHooks.useFormData = useFormData;

