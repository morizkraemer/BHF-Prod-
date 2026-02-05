function StartShiftScreen({ onStartShift }) {
  return (
    <div className="start-shift-screen">
      <div className="start-shift-container">
        <h1 className="start-shift-title">Produktionsübersicht</h1>
        <p className="start-shift-subtitle">Keine aktive Schicht</p>
        <button 
          className="start-shift-button"
          onClick={onStartShift}
        >
          <i data-lucide="play"></i>
          <span>Schicht starten</span>
        </button>
      </div>
    </div>
  );
}

