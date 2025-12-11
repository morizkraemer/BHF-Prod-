const { useState } = React;

function App() {
  const [activeSection, setActiveSection] = useState('uebersicht');
  const [formData, setFormData] = useState({
    uebersicht: {},
    'rider-extras': {},
    tontechniker: {},
    kassenbelege: {}
  });

  const sections = [
    { id: 'uebersicht', name: 'Uebersicht' },
    { id: 'rider-extras', name: 'Rider / Backstage' },
    { id: 'tontechniker', name: 'Ton/Lichttechnik' },
    { id: 'kassenbelege', name: 'Kassenbelege' }
  ];

  const settingsSection = { id: 'settings', name: 'Settings' };

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
          <div className="sidebar-divider"></div>
          <nav className="sidebar-nav sidebar-nav-bottom">
            <button
              className={`sidebar-item ${activeSection === settingsSection.id ? 'active' : ''}`}
              onClick={() => setActiveSection(settingsSection.id)}
            >
              {settingsSection.name}
            </button>
          </nav>
          <div className="sidebar-divider"></div>
          {/* Close Shift Button */}
          <button className="close-shift-button-sidebar" onClick={handleCloseShift}>
            Close Shift
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-area">
          <h1>{sections.find(s => s.id === activeSection)?.name || settingsSection.name}</h1>
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

