const { useState, useEffect } = React;

function CloseShiftConfirmationDialog({ isOpen, onConfirm, onCancel }) {
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setNote('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm(note.trim() || null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="close-shift-confirmation-overlay">
      <div className="close-shift-confirmation-dialog">
        <h2 className="close-shift-confirmation-title">SHIFT BEENDEN</h2>
        
        <div className="close-shift-confirmation-content">
          <div className="close-shift-confirmation-checkbox-group">
            <label className="close-shift-confirmation-checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="close-shift-confirmation-checkbox"
              />
              <span className="close-shift-confirmation-checkbox-custom"></span>
              <span className="close-shift-confirmation-checkbox-text">
                Ich bestätige, dass alle Daten vollständig sind und der Shift beendet werden kann
              </span>
            </label>
          </div>
          
          <div className="close-shift-confirmation-note">
            <label className="close-shift-confirmation-note-label">Notiz (optional):</label>
            <textarea
              className="close-shift-confirmation-note-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optionale Notiz hinzufügen..."
              rows={3}
            />
          </div>
        </div>

        <div className="close-shift-confirmation-actions">
          <button
            type="button"
            onClick={onCancel}
            className="close-shift-confirmation-button close-shift-confirmation-button-cancel"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmed}
            className="close-shift-confirmation-button close-shift-confirmation-button-confirm"
          >
            Shift beenden
          </button>
        </div>
      </div>
    </div>
  );
}

