const { useState, useEffect } = React;

function AndereMitarbeiterForm({ formData, onDataChange, highlightedFields = [] }) {
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [mitarbeiter, setMitarbeiter] = useState(
    formData?.mitarbeiter || []
  );

  // Call onDataChange on mount and whenever data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        mitarbeiter
      });
    }
  }, [mitarbeiter, onDataChange]);

  const handleMitarbeiterChange = (index, field, value) => {
    const newMitarbeiter = [...mitarbeiter];
    newMitarbeiter[index][field] = value;
    setMitarbeiter(newMitarbeiter);
  };

  const handleAddMitarbeiter = () => {
    setMitarbeiter([
      ...mitarbeiter,
      { name: '', startTime: '', endTime: '', category: '' }
    ]);
  };

  const handleRemoveMitarbeiter = (index) => {
    const newMitarbeiter = mitarbeiter.filter((_, i) => i !== index);
    // Allow removing all persons (empty array is valid)
    setMitarbeiter(newMitarbeiter.length > 0 ? newMitarbeiter : []);
  };

  return (
    <div className="form-container">
      <div className="andere-mitarbeiter-form">
        {/* Mitarbeiter Section */}
        <div className="andere-mitarbeiter-section">
          {/* Subtitle */}
          <div className="andere-mitarbeiter-subtitle">
            Kasse, WC, Stage Hand, Extern (auf Rechnung)
          </div>
          {/* Column Headers */}
          <div className="andere-mitarbeiter-header">
            <div className="andere-mitarbeiter-header-name">Name</div>
            <div className="andere-mitarbeiter-header-start">Start</div>
            <div className="andere-mitarbeiter-header-end">Ende</div>
            <div className="andere-mitarbeiter-header-category">Kategorie</div>
            <div className="andere-mitarbeiter-header-actions"></div>
          </div>

          {/* Mitarbeiter List */}
          {mitarbeiter.length === 0 ? (
            <div className="andere-mitarbeiter-empty">Keine Mitarbeiter hinzugefügt</div>
          ) : (
            mitarbeiter.map((person, index) => (
            <div key={index} className="andere-mitarbeiter-line">
              <input
                type="text"
                value={person.name}
                onChange={(e) => handleMitarbeiterChange(index, 'name', e.target.value)}
                className={`andere-mitarbeiter-name ${shouldHighlight(`Andere Mitarbeiter Person ${index + 1} Name`) ? 'field-highlighted' : ''}`}
                placeholder="Name *"
                required
              />
              <input
                type="time"
                value={person.startTime}
                onChange={(e) => handleMitarbeiterChange(index, 'startTime', e.target.value)}
                className={`andere-mitarbeiter-time ${shouldHighlight(`Andere Mitarbeiter Person ${index + 1} Start Zeit`) ? 'field-highlighted' : ''}`}
                required
              />
              <input
                type="time"
                value={person.endTime}
                onChange={(e) => handleMitarbeiterChange(index, 'endTime', e.target.value)}
                className={`andere-mitarbeiter-time ${shouldHighlight(`Andere Mitarbeiter Person ${index + 1} End Zeit`) ? 'field-highlighted' : ''}`}
                required
              />
              <select
                value={person.category}
                onChange={(e) => handleMitarbeiterChange(index, 'category', e.target.value)}
                className={`andere-mitarbeiter-category ${shouldHighlight(`Andere Mitarbeiter Person ${index + 1} Kategorie`) ? 'field-highlighted' : ''}`}
                required
              >
                <option value="">Kategorie wählen *</option>
                <option value="Kasse">Kasse</option>
                <option value="WC">WC</option>
                <option value="Stage Hand">Stage Hand</option>
                <option value="Extern (auf Rechnung)">Extern (auf Rechnung)</option>
              </select>
              <div className="andere-mitarbeiter-controls">
                <button
                  type="button"
                  onClick={() => handleRemoveMitarbeiter(index)}
                  className="remove-line-button"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
            ))
          )}
          
          <button
            type="button"
            onClick={handleAddMitarbeiter}
            className="add-line-button"
          >
            + Add Person
          </button>
        </div>
      </div>
    </div>
  );
}
