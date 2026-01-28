const { useState, useEffect, useCallback } = React;

function UebersichtForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onPrintAll }) {
  // Map display field names to field identifiers
  const fieldNameMap = {
    'Event Name': 'eventName',
    'Datum': 'date',
    'Event Typ': 'eventType',
    'Get In Zeit': 'getInTime',
    'Doors Zeit': 'doorsTime',
    'Night Lead': 'nightLead',
    'Konzertende': 'konzertende',
    'Backstage Curfew': 'backstageCurfew',
    'Agentur': 'agentur',
    'Veranstalter Name': 'veranstalterName'
  };
  
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
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
    konzertende: formData?.konzertende || '',
    konzertendeTatsachlich: formData?.konzertendeTatsachlich || '',
    backstageCurfew: formData?.backstageCurfew || '',
    backstageCurfewTatsachlich: formData?.backstageCurfewTatsachlich || '',
    nightLead: formData?.nightLead || '',
    agentur: formData?.agentur || '',
    agenturAPName: formData?.agenturAPName || '',
    veranstalterName: formData?.veranstalterName || '',
    veranstalterAPName: formData?.veranstalterAPName || '',
    vva: formData?.vva || '',
    companyName: formData?.companyName || '',
    nightlinerParkplatz: formData?.nightlinerParkplatz || '',
    notes: formData?.notes || ''
  });

  // Use printedTemplates from props instead of local state
  const zettelPrinted = printedTemplates.uebersichtzettel || false;

  useEffect(() => {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  useEffect(() => {
    // Render Gästeliste öffnen + print button in the title row
    const container = document.getElementById('uebersicht-print-button-container');
    if (container) {
      container.innerHTML = '';
      const gaestelisteBtn = document.createElement('button');
      gaestelisteBtn.type = 'button';
      gaestelisteBtn.className = 'uebersicht-print-button uebersicht-gaesteliste-button';
      gaestelisteBtn.title = 'Gästeliste in Excel öffnen';
      gaestelisteBtn.innerHTML = `
        <i data-lucide="file-spreadsheet" style="width: 16px; height: 16px;"></i>
        <span>Gästeliste öffnen</span>
      `;
      gaestelisteBtn.onclick = handleOpenGaesteliste;
      const printBtn = document.createElement('button');
      printBtn.type = 'button';
      printBtn.className = `uebersicht-print-button ${zettelPrinted ? 'uebersicht-print-button-printed' : ''}`;
      printBtn.title = zettelPrinted ? 'Alle nochmal drucken' : 'Alle Vorlagen drucken';
      printBtn.innerHTML = `
        <i data-lucide="printer" style="width: 16px; height: 16px;"></i>
        <span>${zettelPrinted ? 'alle nochmal drucken' : 'alle Vorlagen drucken'}</span>
      `;
      printBtn.onclick = handlePrintZettel;
      container.appendChild(gaestelisteBtn);
      container.appendChild(printBtn);
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }, [zettelPrinted, handlePrintZettel, handleOpenGaesteliste]);


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
      } else if (field === 'konzertende' && value) {
        newData.konzertendeTatsachlich = value;
      } else if (field === 'backstageCurfew' && value) {
        newData.backstageCurfewTatsachlich = value;
      }
      
      // Auto-fill Veranstalter AP Name when Veranstalter Name changes (for Club events)
      if (field === 'veranstalterName' && value && newData.eventType === 'club') {
        newData.veranstalterAPName = value;
      }
      
      return newData;
    });
  };

  const handlePrintZettel = useCallback(async () => {
    try {
      if (window.electronAPI && window.electronAPI.printAllTemplates) {
        // Merge and print all templates as one PDF
        await window.electronAPI.printAllTemplates();
        
        // Mark all templates as printed
        if (onPrintAll) {
          onPrintAll();
        }
      } else {
        alert('Fehler: Print-API nicht verfügbar.');
      }
    } catch (error) {
      alert('Fehler beim Drucken: ' + error.message);
      console.error('Print error:', error);
    }
  }, [onPrintAll]);

  const handleOpenGaesteliste = useCallback(async () => {
    try {
      if (window.electronAPI && window.electronAPI.openGaesteliste) {
        await window.electronAPI.openGaesteliste();
      } else {
        alert('Fehler: API nicht verfügbar.');
      }
    } catch (error) {
      alert(error.message || 'Fehler beim Öffnen der Gästeliste.');
      console.error('Open gaesteliste error:', error);
    }
  }, []);

  return (
    <div className="form-container">
      <form className="uebersicht-form">
        {/* Event Name, Event Type, and Date on top row */}
        <div className="form-row form-row-top-header">
          <div className="form-group form-group-event-name">
            <label htmlFor="eventName">Event Name *</label>
            <input
              type="text"
              id="eventName"
              value={localData.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              className={`form-input ${shouldHighlight('Event Name') ? 'field-highlighted' : ''}`}
              placeholder="z.B. Club Night, Special Event..."
              required
            />
          </div>
          <div className="form-group form-group-event-type">
            <label htmlFor="eventType">Event Typ *</label>
            <select
              id="eventType"
              value={localData.eventType}
              onChange={(e) => handleChange('eventType', e.target.value)}
              className={`form-select form-select-small ${shouldHighlight('Event Typ') ? 'field-highlighted' : ''}`}
              required
            >
              <option value="">-- Bitte wählen --</option>
              <option value="andere">Andere</option>
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
              className={`form-input form-input-small ${shouldHighlight('Datum') ? 'field-highlighted' : ''}`}
              required
            />
          </div>
        </div>

        {/* Conditional fields based on event type - appears below Name field */}
        {(localData.eventType === 'konzert' || localData.eventType === 'club' || localData.eventType === 'andere' || localData.eventType === 'einmietung') && (
          <div className="event-type-conditional-fields">
            {localData.eventType === 'konzert' && (
              <>
                <div className="form-group">
                  <label htmlFor="agentur">Agentur Name *</label>
                  <input
                    type="text"
                    id="agentur"
                    value={localData.agentur}
                    onChange={(e) => handleChange('agentur', e.target.value)}
                    className={`form-input ${shouldHighlight('Agentur') ? 'field-highlighted' : ''}`}
                    placeholder="Agentur Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="agenturAPName">Agentur AP Name</label>
                  <input
                    type="text"
                    id="agenturAPName"
                    value={localData.agenturAPName}
                    onChange={(e) => handleChange('agenturAPName', e.target.value)}
                    className="form-input"
                    placeholder="Agentur AP Name"
                  />
                </div>
              </>
            )}
            {localData.eventType === 'club' && (
              <>
                <div className="form-group">
                  <label htmlFor="veranstalterName">Veranstalter Name *</label>
                  <input
                    type="text"
                    id="veranstalterName"
                    value={localData.veranstalterName}
                    onChange={(e) => handleChange('veranstalterName', e.target.value)}
                    className={`form-input ${shouldHighlight('Veranstalter Name') ? 'field-highlighted' : ''}`}
                    placeholder="Veranstalter Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="veranstalterAPName">Veranstalter AP Name</label>
                  <input
                    type="text"
                    id="veranstalterAPName"
                    value={localData.veranstalterAPName}
                    onChange={(e) => handleChange('veranstalterAPName', e.target.value)}
                    className="form-input"
                    placeholder="Veranstalter AP Name"
                  />
                </div>
              </>
            )}
            {localData.eventType === 'andere' && (
              <div className="form-group">
                <label htmlFor="veranstalterName">Veranstalter Name *</label>
                <input
                  type="text"
                  id="veranstalterName"
                  value={localData.veranstalterName}
                  onChange={(e) => handleChange('veranstalterName', e.target.value)}
                  className="form-input"
                  placeholder="Veranstalter Name"
                  required
                />
              </div>
            )}
            {localData.eventType === 'einmietung' && (
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  value={localData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="form-input"
                  placeholder="Company Name"
                />
              </div>
            )}
          </div>
        )}

        {/* Get In/Doors - moved below first line */}
        <div className="get-in-doors-row">
          {/* Get In Zeit paired with Get In Tatsächlich */}
          <div className="form-group-paired-container">
            <div className="form-group form-group-paired-left">
              <label htmlFor="getInTime">Get In Zeit *</label>
              <input
                type="time"
                id="getInTime"
                value={localData.getInTime}
                onChange={(e) => handleChange('getInTime', e.target.value)}
                className={`form-input ${shouldHighlight('Get In Zeit') ? 'field-highlighted' : ''}`}
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
                className={`form-input ${shouldHighlight('Doors Zeit') ? 'field-highlighted' : ''}`}
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
        </div>

        {/* Night Lead and VVA */}
        <div className="night-lead-vva-box">
          <div className="form-group">
            <label htmlFor="nightLead">Night Lead *</label>
            <input
              type="text"
              id="nightLead"
              value={localData.nightLead}
              onChange={(e) => handleChange('nightLead', e.target.value)}
              className={`form-input ${shouldHighlight('Night Lead') ? 'field-highlighted' : ''}`}
              placeholder="Night Lead"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="vva">VVA</label>
            <input
              type="text"
              id="vva"
              value={localData.vva}
              onChange={(e) => handleChange('vva', e.target.value)}
              className="form-input"
              placeholder="VVA"
            />
          </div>
        </div>

        {/* Notes Section */}
        <div className="notes-section">
          <label htmlFor="uebersichtNotes" className="notes-label">Notizen</label>
          <textarea
            id="uebersichtNotes"
            value={localData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="form-textarea"
            placeholder="Zusätzliche Notizen oder Bemerkungen..."
            rows="4"
          />
        </div>

        {/* Konzertende and Backstage Curfew - moved to end */}
        <div className="end-curfew-row">
          {/* Konzertende paired with Konzertende Tatsächlich */}
          <div className="form-group-paired-container">
            <div className="form-group form-group-paired-left">
              <label htmlFor="konzertende">Konzertende *</label>
              <input
                type="time"
                id="konzertende"
                value={localData.konzertende}
                onChange={(e) => handleChange('konzertende', e.target.value)}
                className={`form-input ${shouldHighlight('Konzertende') ? 'field-highlighted' : ''}`}
                required
              />
            </div>
            <div className="form-group form-group-paired-right">
              <label htmlFor="konzertendeTatsachlich">Tatsächlich</label>
              <input
                type="time"
                id="konzertendeTatsachlich"
                value={localData.konzertendeTatsachlich}
                onChange={(e) => handleChange('konzertendeTatsachlich', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Backstage Curfew paired with Backstage Curfew Tatsächlich */}
          <div className="form-group-paired-container">
            <div className="form-group form-group-paired-left">
              <label htmlFor="backstageCurfew">Backstage Curfew *</label>
              <input
                type="time"
                id="backstageCurfew"
                value={localData.backstageCurfew}
                onChange={(e) => handleChange('backstageCurfew', e.target.value)}
                className={`form-input ${shouldHighlight('Backstage Curfew') ? 'field-highlighted' : ''}`}
                required
              />
            </div>
            <div className="form-group form-group-paired-right">
              <label htmlFor="backstageCurfewTatsachlich">Tatsächlich</label>
              <input
                type="time"
                id="backstageCurfewTatsachlich"
                value={localData.backstageCurfewTatsachlich}
                onChange={(e) => handleChange('backstageCurfewTatsachlich', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}


