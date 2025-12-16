const { useState, useEffect } = React;

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
            setFormData(formDataResult.data);
            // If there's saved shift data, consider the shift as started
            setShiftStarted(true);
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

