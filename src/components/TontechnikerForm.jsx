const { useState, useEffect } = React;

function TontechnikerForm({ formData, onDataChange }) {
  const [localData, setLocalData] = useState({
    soundEngineerName: formData?.soundEngineerName || '',
    soundEngineerStartTime: formData?.soundEngineerStartTime || '',
    soundEngineerEndTime: formData?.soundEngineerEndTime || '',
    lightingTechName: formData?.lightingTechName || '',
    lightingTechStartTime: formData?.lightingTechStartTime || '',
    lightingTechEndTime: formData?.lightingTechEndTime || '',
    scannedImages: formData?.scannedImages || []
  });

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
          <div className="form-group form-group-tech-name">
            <label htmlFor="soundEngineerName">Tontechniker Name *</label>
            <input
              type="text"
              id="soundEngineerName"
              value={localData.soundEngineerName}
              onChange={(e) => handleChange('soundEngineerName', e.target.value)}
              className="form-input"
              placeholder="Name"
              required
            />
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="soundEngineerStartTime">Start</label>
            <input
              type="time"
              id="soundEngineerStartTime"
              value={localData.soundEngineerStartTime}
              onChange={(e) => handleChange('soundEngineerStartTime', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="soundEngineerEndTime">Ende</label>
            <input
              type="time"
              id="soundEngineerEndTime"
              value={localData.soundEngineerEndTime}
              onChange={(e) => handleChange('soundEngineerEndTime', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Lighting Tech Section (Optional) */}
        <div className="form-row form-row-tech-info">
          <div className="form-group form-group-tech-name">
            <label htmlFor="lightingTechName">Lichttechniker Name</label>
            <input
              type="text"
              id="lightingTechName"
              value={localData.lightingTechName}
              onChange={(e) => handleChange('lightingTechName', e.target.value)}
              className="form-input"
              placeholder="Name (optional)"
            />
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="lightingTechStartTime">Start</label>
            <input
              type="time"
              id="lightingTechStartTime"
              value={localData.lightingTechStartTime}
              onChange={(e) => handleChange('lightingTechStartTime', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group form-group-time">
            <label htmlFor="lightingTechEndTime">Ende</label>
            <input
              type="time"
              id="lightingTechEndTime"
              value={localData.lightingTechEndTime}
              onChange={(e) => handleChange('lightingTechEndTime', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Scanner Section in Box */}
        <div className="scanner-box">
          <DocumentScanner
            scannedDocuments={localData.scannedImages}
            onDocumentsChange={handleDocumentsChange}
            showFileSelect={true}
            showScannedList={true}
            className="tontechniker-scanner"
            defaultSource="feeder"
          />
        </div>
      </div>
    </div>
  );
}

