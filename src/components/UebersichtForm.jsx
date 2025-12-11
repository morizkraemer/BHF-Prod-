const { useState, useEffect, useCallback } = React;

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
  const [zettelPrinted, setZettelPrinted] = useState(false);

  useEffect(() => {
    // Render print button in the title row
    const container = document.getElementById('uebersicht-print-button-container');
    if (container) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `uebersicht-print-button ${zettelPrinted ? 'uebersicht-print-button-printed' : ''}`;
      button.title = zettelPrinted ? 'Alle nochmal drucken' : 'Alle Vorlagen drucken';
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>${zettelPrinted ? 'alle nochmal drucken' : 'alle Vorlagen drucken'}</span>
      `;
      button.onclick = handlePrintZettel;
      container.innerHTML = '';
      container.appendChild(button);
    }
  }, [zettelPrinted, handlePrintZettel]);

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

  const handlePrintZettel = useCallback(async () => {
    try {
      if (window.electronAPI && window.electronAPI.printTemplate) {
        await window.electronAPI.printTemplate('uebersichtzettel');
        setZettelPrinted(true);
      }
    } catch (error) {
      alert('Fehler beim Drucken: ' + error.message);
      console.error('Print error:', error);
    }
  }, []);

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


