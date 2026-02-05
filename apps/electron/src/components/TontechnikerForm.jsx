const { useState, useEffect } = React;

const PersonNameSelect = window.PersonNameSelect;

function TontechnikerForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted }) {
  // Map display field names to field identifiers
  const fieldNameMap = {
    'Sound Engineer Name': 'soundEngineerName',
    'Sound Engineer Start Zeit': 'soundEngineerStartTime',
    'Sound Engineer End Zeit': 'soundEngineerEndTime',
    'Lighting Tech Name': 'lightingTechName',
    'Lighting Tech Start Zeit': 'lightingTechStartTime',
    'Lighting Tech End Zeit': 'lightingTechEndTime',
    'Gescannte Bilder': 'scannedImages'
  };
  
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [localData, setLocalData] = useState({
    soundEngineerEnabled: formData?.soundEngineerEnabled !== undefined ? formData.soundEngineerEnabled : true, // Default to checked
    soundEngineerName: formData?.soundEngineerName || '',
    soundEngineerWage: formData?.soundEngineerWage || '',
    soundEngineerStartTime: formData?.soundEngineerStartTime || '',
    soundEngineerEndTime: formData?.soundEngineerEndTime || '',
    lightingTechEnabled: formData?.lightingTechEnabled !== undefined ? formData.lightingTechEnabled : false,
    lightingTechName: formData?.lightingTechName || '',
    lightingTechWage: formData?.lightingTechWage || '',
    lightingTechStartTime: formData?.lightingTechStartTime || '',
    lightingTechEndTime: formData?.lightingTechEndTime || '',
    scannedImages: formData?.scannedImages || []
  });

  // Load saved tech names on mount (only if formData doesn't have them)
  useEffect(() => {
    if (!formData?.soundEngineerName && !formData?.lightingTechName) {
      if (window.electronAPI && window.electronAPI.getSavedTechNames) {
        window.electronAPI.getSavedTechNames().then(savedNames => {
          if (savedNames) {
            setLocalData(prev => ({
              ...prev,
              soundEngineerName: savedNames.soundEngineerName || prev.soundEngineerName || '',
              lightingTechName: savedNames.lightingTechName || prev.lightingTechName || ''
            }));
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(localData);
    }
  }, [localData]);

  // Save tech names when they change (debounced)
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.saveTechNames) {
      const timeoutId = setTimeout(() => {
        window.electronAPI.saveTechNames({
          soundEngineerName: localData.soundEngineerName || '',
          lightingTechName: localData.lightingTechName || ''
        });
      }, 500); // Debounce by 500ms to avoid saving on every keystroke

      return () => clearTimeout(timeoutId);
    }
  }, [localData.soundEngineerName, localData.lightingTechName]);

  const handleChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setLocalData(prev => ({
      ...prev,
      scannedImages: updatedDocuments
    }));
  };

  return (
    <div className="form-container">
      <div className="tontechniker-form">
        {/* Sound Engineer Section */}
        <div className="form-row form-row-tech-info">
          <div className="form-group-tech-checkbox-wrapper">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localData.soundEngineerEnabled}
                onChange={(e) => handleChange('soundEngineerEnabled', e.target.checked)}
                className="tech-checkbox"
              />
              <span className="checkbox-custom"></span>
            </label>
          </div>
          <div className="form-group name-combo-tech">
            <label>Tontechnik Name{localData.soundEngineerEnabled ? ' *' : ''}</label>
            <div className="name-combo-inner">
              {PersonNameSelect ? (
                <PersonNameSelect
                  value={localData.soundEngineerName}
                  onChange={(name) => handleChange('soundEngineerName', name)}
                  getNames={window.electronAPI ? window.electronAPI.getTechNames : null}
                  addName={window.electronAPI ? window.electronAPI.addTechName : null}
                  placeholder="Name"
                  className={`form-input ${shouldHighlight('Sound Engineer Name') ? 'field-highlighted' : ''}`}
                  required={localData.soundEngineerEnabled}
                  disabled={!localData.soundEngineerEnabled}
                />
              ) : (
                <input
                  type="text"
                  id="soundEngineerName"
                  value={localData.soundEngineerName}
                  onChange={(e) => handleChange('soundEngineerName', e.target.value)}
                  className={`form-input ${shouldHighlight('Sound Engineer Name') ? 'field-highlighted' : ''}`}
                  placeholder="Name"
                  required={localData.soundEngineerEnabled}
                  disabled={!localData.soundEngineerEnabled}
                />
              )}
            </div>
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="soundEngineerStartTime">Start{localData.soundEngineerEnabled ? ' *' : ''}</label>
            <input
              type="time"
              id="soundEngineerStartTime"
              value={localData.soundEngineerStartTime}
              onChange={(e) => handleChange('soundEngineerStartTime', e.target.value)}
              className={`form-input ${shouldHighlight('Sound Engineer Start Zeit') ? 'field-highlighted' : ''}`}
              required={localData.soundEngineerEnabled}
              disabled={!localData.soundEngineerEnabled}
            />
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="soundEngineerEndTime">Ende{localData.soundEngineerEnabled ? ' *' : ''}</label>
            <input
              type="time"
              id="soundEngineerEndTime"
              value={localData.soundEngineerEndTime}
              onChange={(e) => handleChange('soundEngineerEndTime', e.target.value)}
              className={`form-input ${shouldHighlight('Sound Engineer End Zeit') ? 'field-highlighted' : ''}`}
              required={localData.soundEngineerEnabled}
              disabled={!localData.soundEngineerEnabled}
            />
          </div>
        </div>

        {/* Lighting Tech Section */}
        <div className="form-row form-row-tech-info">
          <div className="form-group-tech-checkbox-wrapper">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localData.lightingTechEnabled}
                onChange={(e) => handleChange('lightingTechEnabled', e.target.checked)}
                className="tech-checkbox"
              />
              <span className="checkbox-custom"></span>
            </label>
          </div>
          <div className="form-group name-combo-tech">
            <label>Lichttechnik Name{localData.lightingTechEnabled ? ' *' : ''}</label>
            <div className="name-combo-inner">
              {PersonNameSelect ? (
                <PersonNameSelect
                  value={localData.lightingTechName}
                  onChange={(name) => handleChange('lightingTechName', name)}
                  getNames={window.electronAPI ? window.electronAPI.getTechNames : null}
                  addName={window.electronAPI ? window.electronAPI.addTechName : null}
                  placeholder="Name"
                  className={`form-input ${shouldHighlight('Lighting Tech Name') ? 'field-highlighted' : ''}`}
                  required={localData.lightingTechEnabled}
                  disabled={!localData.lightingTechEnabled}
                />
              ) : (
                <input
                  type="text"
                  id="lightingTechName"
                  value={localData.lightingTechName}
                  onChange={(e) => handleChange('lightingTechName', e.target.value)}
                  className={`form-input ${shouldHighlight('Lighting Tech Name') ? 'field-highlighted' : ''}`}
                  placeholder="Name"
                  required={localData.lightingTechEnabled}
                  disabled={!localData.lightingTechEnabled}
                />
              )}
            </div>
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="lightingTechStartTime">Start{localData.lightingTechEnabled ? ' *' : ''}</label>
            <input
              type="time"
              id="lightingTechStartTime"
              value={localData.lightingTechStartTime}
              onChange={(e) => handleChange('lightingTechStartTime', e.target.value)}
              className={`form-input ${shouldHighlight('Lighting Tech Start Zeit') ? 'field-highlighted' : ''}`}
              required={localData.lightingTechEnabled}
              disabled={!localData.lightingTechEnabled}
            />
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="lightingTechEndTime">Ende{localData.lightingTechEnabled ? ' *' : ''}</label>
            <input
              type="time"
              id="lightingTechEndTime"
              value={localData.lightingTechEndTime}
              onChange={(e) => handleChange('lightingTechEndTime', e.target.value)}
              className={`form-input ${shouldHighlight('Lighting Tech End Zeit') ? 'field-highlighted' : ''}`}
              required={localData.lightingTechEnabled}
              disabled={!localData.lightingTechEnabled}
            />
          </div>
        </div>

        {/* Scanner Section in Box */}
        <div className={`scanner-box ${shouldHighlight('Gescannte Bilder') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={localData.scannedImages}
            onDocumentsChange={handleDocumentsChange}
            showScannedList={true}
            className="tontechniker-scanner"
            defaultSource="feeder"
            title="Technikzettel scannen"
            scanName="Technikzettel"
            templateKey="technikzettel"
            printedTemplates={printedTemplates}
            onTemplatePrinted={onTemplatePrinted}
          />
        </div>
      </div>
    </div>
  );
}

