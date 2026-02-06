function Sidebar({
  activeSection,
  setActiveSection,
  currentPhase,
  scannerName,
  scannerAvailable,
  getRequiredFieldsCount,
  onCloseShift
}) {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">
        ProdÜ
        <span className="sidebar-phase-badge">{currentPhase}</span>
      </h2>
      <nav className="sidebar-nav">
        {window.AppConstants.sections.map(section => {
          const count = getRequiredFieldsCount(section.id);
          const isComplete = (count.total > 0 && count.filled === count.total) || count.total === 0;
          const isAmber = !!count.isAmber;
          const counterClass = isAmber
            ? 'sidebar-item-counter-amber'
            : isComplete
              ? 'sidebar-item-counter-complete'
              : '';
          return (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="sidebar-item-name">{section.name}</span>
              <span className={`sidebar-item-counter ${counterClass}`}>
                {count.total > 0 ? `${count.filled}/${count.total}` : '—'}
              </span>
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
            className={`settings-button-sidebar ${activeSection === window.AppConstants.settingsSection.id ? 'active' : ''}`}
            onClick={() => setActiveSection(window.AppConstants.settingsSection.id)}
            title="Settings"
          >
            <i data-lucide="settings"></i>
          </button>
          <button className="close-shift-button-sidebar" onClick={onCloseShift}>
            {currentPhase === 'VVA' ? 'FINISH VVA' : 'Schicht beenden'}
          </button>
        </div>
      </div>
    </aside>
  );
}

