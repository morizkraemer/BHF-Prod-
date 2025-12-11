const { useState, useEffect } = React;

function App() {
  const [activeSection, setActiveSection] = useState('uebersicht');
  const [formData, setFormData] = useState({
    uebersicht: {},
    'rider-extras': {},
    tontechniker: {},
    kassenbelege: {},
    secu: {}
  });

  const sections = [
    { id: 'uebersicht', name: 'Übersicht' },
    { id: 'rider-extras', name: 'Hospitality' },
    { id: 'tontechniker', name: 'Ton/Lichttechnik' },
    { id: 'secu', name: 'Secu' },
    { id: 'kassenbelege', name: 'Kassenbelege' }
  ];

  const settingsSection = { id: 'settings', name: 'Settings' };
  const [scannerName, setScannerName] = useState(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  
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

  const handleCloseShift = () => {
    // Validation and save logic will be implemented in Phase 4
    console.log('Close Shift clicked');
    console.log('Form Data:', formData);
    alert('Close Shift functionality will be implemented in Phase 4');
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
      case 'kassenbelege':
        return (
          <KassenbelegeForm
            formData={formData.kassenbelege}
            onDataChange={(data) => handleFormDataChange('kassenbelege', data)}
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
        <h2 className="sidebar-title">Sections</h2>
        <nav className="sidebar-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.name}
            </button>
          ))}
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
              Close Shift
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
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

