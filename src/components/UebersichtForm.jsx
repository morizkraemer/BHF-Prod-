const { useState, useEffect, useCallback } = React;

function UebersichtForm({ formData, onDataChange }) {
  const [localData, setLocalData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    eventName: formData?.eventName || '',
    eventType: formData?.eventType || '',
    getInTime: formData?.getInTime || '',
    getInTatsachlich: formData?.getInTatsachlich || '',
    doorsTime: formData?.doorsTime || '',
    doorsTatsachlich: formData?.doorsTatsachlich || '',
    travelPartyGetIn: formData?.travelPartyGetIn || '',
    travelPartyTatsachlich: formData?.travelPartyTatsachlich || '',
    nightLead: formData?.nightLead || ''
  });

  const [nightLeadOptions, setNightLeadOptions] = useState(['']);
  const [zettelPrinted, setZettelPrinted] = useState(false);

  useEffect(() => {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  useEffect(() => {
    // Render print button in the title row
    const container = document.getElementById('uebersicht-print-button-container');
    if (container) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `uebersicht-print-button ${zettelPrinted ? 'uebersicht-print-button-printed' : ''}`;
      button.title = zettelPrinted ? 'Alle nochmal drucken' : 'Alle Vorlagen drucken';
      button.innerHTML = `
        <i data-lucide="printer" style="width: 16px; height: 16px;"></i>
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
    setLocalData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-copy to Tatsächlich fields when main fields change
      if (field === 'getInTime' && value) {
        newData.getInTatsachlich = value;
      } else if (field === 'doorsTime' && value) {
        newData.doorsTatsachlich = value;
      } else if (field === 'travelPartyGetIn' && value) {
        newData.travelPartyTatsachlich = value;
      }
      
      return newData;
    });
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

        {/* Get In, Doors, and Travel Party - each paired with their Tatsächlich */}
        <div className="form-row form-row-three-columns">
          {/* Get In Zeit paired with Get In Tatsächlich */}
          <div className="form-group-paired-container">
            <div className="form-group form-group-paired-left">
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
            <div className="form-group form-group-paired-right">
              <label htmlFor="getInTatsachlich">Tatsächlich</label>
              <input
                type="time"
                id="getInTatsachlich"
                value={localData.getInTatsachlich}
                onChange={(e) => handleChange('getInTatsachlich', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Doors Zeit paired with Doors Tatsächlich */}
          <div className="form-group-paired-container">
            <div className="form-group form-group-paired-left">
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
            <div className="form-group form-group-paired-right">
              <label htmlFor="doorsTatsachlich">Tatsächlich</label>
              <input
                type="time"
                id="doorsTatsachlich"
                value={localData.doorsTatsachlich}
                onChange={(e) => handleChange('doorsTatsachlich', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Travel Party Get In paired with Travel Party Tatsächlich */}
          <div className="form-group-paired-container">
            <div className="form-group form-group-paired-left">
              <label htmlFor="travelPartyGetIn">Travel Party Get In</label>
              <input
                type="number"
                id="travelPartyGetIn"
                value={localData.travelPartyGetIn}
                onChange={(e) => handleChange('travelPartyGetIn', e.target.value)}
                className="form-input"
                min="0"
                placeholder="0"
              />
            </div>
            <div className="form-group form-group-paired-right">
              <label htmlFor="travelPartyTatsachlich">Tatsächlich</label>
              <input
                type="number"
                id="travelPartyTatsachlich"
                value={localData.travelPartyTatsachlich}
                onChange={(e) => handleChange('travelPartyTatsachlich', e.target.value)}
                className="form-input"
                min="0"
                placeholder="0"
              />
            </div>
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


