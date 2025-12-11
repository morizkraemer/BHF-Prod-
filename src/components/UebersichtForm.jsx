const { useState, useEffect } = React;

function UebersichtForm({ formData, onDataChange }) {
  const [localData, setLocalData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    eventName: formData?.eventName || '',
    getInTime: formData?.getInTime || '',
    doorsTime: formData?.doorsTime || '',
    travelParty: formData?.travelParty || '',
    nightLead: formData?.nightLead || ''
  });

  // Night lead options - can be updated as needed
  const nightLeadOptions = [
    '',
    'Lead 1',
    'Lead 2',
    'Lead 3'
    // Add actual night lead names here
  ];

  useEffect(() => {
    if (onDataChange) {
      onDataChange(localData);
    }
  }, [localData]);

  const handleChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="form-container">
      <form className="uebersicht-form">
        <div className="form-group">
          <label htmlFor="date">Datum *</label>
          <input
            type="date"
            id="date"
            value={localData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventName">Event Name *</label>
          <input
            type="text"
            id="eventName"
            value={localData.eventName}
            onChange={(e) => handleChange('eventName', e.target.value)}
            className="form-input"
            placeholder="z.B. Club Night, Special Event..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="getInTime">Get In Zeit *</label>
            <input
              type="time"
              id="getInTime"
              value={localData.getInTime}
              onChange={(e) => handleChange('getInTime', e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="doorsTime">Doors Zeit *</label>
            <input
              type="time"
              id="doorsTime"
              value={localData.doorsTime}
              onChange={(e) => handleChange('doorsTime', e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="travelParty">Travel Party Anzahl</label>
          <input
            type="number"
            id="travelParty"
            value={localData.travelParty}
            onChange={(e) => handleChange('travelParty', e.target.value)}
            className="form-input"
            min="0"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="nightLead">Night Lead *</label>
          <select
            id="nightLead"
            value={localData.nightLead}
            onChange={(e) => handleChange('nightLead', e.target.value)}
            className="form-select"
            required
          >
            {nightLeadOptions.map((option, index) => (
              <option key={index} value={option}>
                {option || '-- Bitte wählen --'}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
}


