const { useState, useEffect } = React;

function DateConfirmationDialog({ isOpen, onConfirm, onCancel, currentDate, onDateChange, shiftStartTime }) {
  const [selectedDate, setSelectedDate] = useState(currentDate || new Date().toISOString().split('T')[0]);
  const [isChangingDate, setIsChangingDate] = useState(false);

  // Check if shift was started after midnight (between 00:00 and 08:00)
  const wasStartedAfterMidnight = () => {
    if (!shiftStartTime) return false;
    const startDate = new Date(shiftStartTime);
    const hours = startDate.getHours();
    return hours >= 0 && hours < 8;
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(currentDate || new Date().toISOString().split('T')[0]);
      setIsChangingDate(false);
    }
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const handleConfirmDate = () => {
    onConfirm();
  };

  const handleChangeDate = () => {
    setIsChangingDate(true);
  };

  const handleDateUpdate = () => {
    onDateChange(selectedDate);
  };

  const handleCancel = () => {
    setIsChangingDate(false);
    setSelectedDate(currentDate || new Date().toISOString().split('T')[0]);
    onCancel();
  };

  // Format date for display (DD.MM.YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="vva-missing-fields-overlay">
      <div className="vva-missing-fields-dialog date-confirmation-dialog">
        <h2 className="vva-missing-fields-title">
          Datum bestätigen
        </h2>

        <div className="vva-missing-fields-content">
          {!isChangingDate ? (
            <div className="date-confirmation-content">
              <div className="date-confirmation-question">
                Ist das Datum <strong>{formatDateForDisplay(currentDate)}</strong> korrekt?
              </div>
              {wasStartedAfterMidnight() && (
                <div className="date-confirmation-disclaimer">
                  <strong>⚠️ Hinweis:</strong> Diese Schicht wurde nach Mitternacht gestartet (zwischen 00:00 und 08:00 Uhr).
                </div>
              )}
              <div className="date-confirmation-hint">
                Wenn du die Schicht nach Mitternacht gestartet hast, benötigst du möglicherweise das Datum des Vortages.
              </div>
            </div>
          ) : (
            <div className="date-change-content">
              <div className="date-change-label">
                <label htmlFor="date-picker">Neues Datum auswählen:</label>
              </div>
              <input
                type="date"
                id="date-picker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker-input"
              />
              <div className="date-change-preview">
                Ausgewähltes Datum: <strong>{formatDateForDisplay(selectedDate)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="vva-missing-fields-actions">
          {!isChangingDate ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="vva-missing-fields-button vva-missing-fields-button-cancel"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleChangeDate}
                className="vva-missing-fields-button vva-missing-fields-button-back"
              >
                Datum ändern
              </button>
              <button
                type="button"
                onClick={handleConfirmDate}
                className="vva-missing-fields-button vva-missing-fields-button-continue"
              >
                Ja, korrekt
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="vva-missing-fields-button vva-missing-fields-button-cancel"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDateUpdate}
                className="vva-missing-fields-button vva-missing-fields-button-continue"
              >
                Datum übernehmen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

