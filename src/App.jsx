const { useState } = React;

function App() {
  const [activeSection, setActiveSection] = useState('uebersicht');

  const sections = [
    { id: 'uebersicht', name: 'Uebersicht' },
    { id: 'rider-extras', name: 'Rider Extras' },
    { id: 'tontechniker', name: 'Tontechniker' },
    { id: 'kassenbelege', name: 'Kassenbelege' }
  ];

  const handleCloseShift = () => {
    // Validation and save logic will be implemented in Phase 4
    console.log('Close Shift clicked');
    alert('Close Shift functionality will be implemented in Phase 4');
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
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-area">
          <h1>{sections.find(s => s.id === activeSection)?.name}</h1>
          <p>Form content for {activeSection} will be implemented in Phase 3</p>
        </div>
      </main>

      {/* Close Shift Button */}
      <button className="close-shift-button" onClick={handleCloseShift}>
        Close Shift
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

