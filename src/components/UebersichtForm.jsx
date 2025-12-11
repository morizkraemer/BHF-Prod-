const { useState, useEffect } = React;

function UebersichtForm({ formData, onDataChange }) {
  const [localData, setLocalData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    eventName: formData?.eventName || '',
    eventType: formData?.eventType || '',
    getInTime: formData?.getInTime || '',
    doorsTime: formData?.doorsTime || '',
    travelParty: formData?.travelParty || '',
    nightLead: formData?.nightLead || ''
  });

  const [nightLeadOptions, setNightLeadOptions] = useState(['']);

  useEffect(() => {
    // Load night leads from catalog
    const loadNightLeads = async () => {
      if (window.electronAPI && window.electronAPI.getNightLeads) {
        try {
          const leads = await window.electronAPI.getNightLeads();
          const leadNames = leads.map(lead => lead.name);
          setNightLeadOptions(['', ...leadNames]);
        } catch (error) {
          console.error('Error loading night leads:', error);
        }
      }
    };
    loadNightLeads();
  }, []);

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
        {/* Event Name, Event Type, and Date on same line */}
        <div className="form-row form-row-event-header">
          <div className="form-group form-group-event-name">
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
          <div className="form-group form-group-event-type">
            <label htmlFor="eventType">Event Typ</label>
            <select
              id="eventType"
              value={localData.eventType}
              onChange={(e) => handleChange('eventType', e.target.value)}
              className="form-select form-select-small"
            >
              <option value="">-- Bitte wählen --</option>
              <option value="club">Club</option>
              <option value="konzert">Konzert</option>
              <option value="einmietung">Einmietung</option>
            </select>
          </div>
          <div className="form-group form-group-date-small">
            <label htmlFor="date">Datum *</label>
            <input
              type="date"
              id="date"
              value={localData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="form-input form-input-small"
              required
            />
          </div>
        </div>

        {/* Get In, Doors, and Travel Party on same line */}
        <div className="form-row form-row-three-columns">
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


