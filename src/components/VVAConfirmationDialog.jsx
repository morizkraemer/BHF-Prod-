const { useState, useEffect } = React;

function VVAConfirmationDialog({ isOpen, onConfirm, onCancel, hasExtras }) {
  const [checklistChecked, setChecklistChecked] = useState(false);
  const [extrasConfirmed, setExtrasConfirmed] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setChecklistChecked(false);
      setExtrasConfirmed(false); // Always start unchecked, needs manual confirmation if no extras
    }
  }, [isOpen, hasExtras]);

  const handleConfirm = () => {
    if (checklistChecked && (hasExtras || extrasConfirmed)) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="vva-confirmation-overlay">
      <div className="vva-confirmation-dialog">
        <h2 className="vva-confirmation-title">FINISH VVA</h2>
        
        <div className="vva-confirmation-content">
          <div className="vva-confirmation-checkbox-group">
            <label className="vva-confirmation-checkbox-label">
              <input
                type="checkbox"
                checked={checklistChecked}
                onChange={(e) => setChecklistChecked(e.target.checked)}
                className="vva-confirmation-checkbox"
              />
              <span className="vva-confirmation-checkbox-custom"></span>
              <span className="vva-confirmation-checkbox-text">VVA Checkliste ausgefüllt</span>
            </label>
          </div>

          {!hasExtras && (
            <div className="vva-confirmation-checkbox-group">
              <label className="vva-confirmation-checkbox-label">
                <input
                  type="checkbox"
                  checked={extrasConfirmed}
                  onChange={(e) => setExtrasConfirmed(e.target.checked)}
                  className="vva-confirmation-checkbox"
                />
                <span className="vva-confirmation-checkbox-custom"></span>
                <span className="vva-confirmation-checkbox-text">
                  Keine Extras in Hospitality zu buchen
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="vva-confirmation-actions">
          <button
            type="button"
            onClick={onCancel}
            className="vva-confirmation-button vva-confirmation-button-cancel"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!checklistChecked || (!hasExtras && !extrasConfirmed)}
            className="vva-confirmation-button vva-confirmation-button-confirm"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

