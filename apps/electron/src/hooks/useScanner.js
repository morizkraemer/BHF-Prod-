const { useState, useEffect } = React;

function useScanner() {
  const [scannerName, setScannerName] = useState(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);

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

  // Initialize global scanner availability state
  useEffect(() => {
    window.scannerAvailability = {
      available: scannerAvailable,
      name: scannerName,
      setAvailable: setScannerAvailable,
      setName: setScannerName
    };
  }, [scannerAvailable, scannerName]);

  return {
    scannerName,
    scannerAvailable,
    setScannerName,
    setScannerAvailable
  };
}

// Make available globally
window.AppHooks = window.AppHooks || {};
window.AppHooks.useScanner = useScanner;

