const { useState, useEffect } = React;

function SecuForm({ formData, onDataChange }) {
  const [securityPersonnel, setSecurityPersonnel] = useState(
    formData?.securityPersonnel || [
      { name: '', startTime: '', endTime: '' }
    ]
  );
  const [scannedDocuments, setScannedDocuments] = useState(
    formData?.scannedDocuments || []
  );

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        securityPersonnel,
        scannedDocuments
      });
    }
  }, [securityPersonnel, scannedDocuments]);

  const handlePersonnelChange = (index, field, value) => {
    const newPersonnel = [...securityPersonnel];
    newPersonnel[index][field] = value;
    setSecurityPersonnel(newPersonnel);
  };

  const handleAddPersonnel = () => {
    setSecurityPersonnel([
      ...securityPersonnel,
      { name: '', startTime: '', endTime: '' }
    ]);
  };

  const handleRemovePersonnel = (index) => {
    if (securityPersonnel.length > 1) {
      const newPersonnel = securityPersonnel.filter((_, i) => i !== index);
      setSecurityPersonnel(newPersonnel);
    }
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setScannedDocuments(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="secu-form">
        {/* Security Personnel Section */}
        <div className="secu-personnel-section">
          {/* Column Headers */}
          <div className="secu-personnel-header">
            <div className="secu-header-name">Name</div>
            <div className="secu-header-start">Start</div>
            <div className="secu-header-end">Ende</div>
            <div className="secu-header-actions"></div>
          </div>

          {/* Personnel List */}
          {securityPersonnel.map((person, index) => (
            <div key={index} className="secu-personnel-line">
              <input
                type="text"
                value={person.name}
                onChange={(e) => handlePersonnelChange(index, 'name', e.target.value)}
                className="secu-personnel-name"
                placeholder="Name"
              />
              <input
                type="time"
                value={person.startTime}
                onChange={(e) => handlePersonnelChange(index, 'startTime', e.target.value)}
                className="secu-personnel-time"
              />
              <input
                type="time"
                value={person.endTime}
                onChange={(e) => handlePersonnelChange(index, 'endTime', e.target.value)}
                className="secu-personnel-time"
              />
              <div className="secu-personnel-controls">
                {securityPersonnel.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePersonnel(index)}
                    className="remove-line-button"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddPersonnel}
            className="add-line-button"
          >
            + Add Person
          </button>
        </div>

        {/* Scanner Section */}
        <div className="scanner-box">
          <DocumentScanner
            scannedDocuments={scannedDocuments}
            onDocumentsChange={handleDocumentsChange}
            showFileSelect={true}
            showScannedList={true}
            className="secu-scanner"
            defaultSource="glass"
          />
        </div>
      </div>
    </div>
  );
}

