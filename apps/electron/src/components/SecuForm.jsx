const { useState, useEffect } = React;

const PersonNameSelect = window.PersonNameSelect;

function SecuForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted, shiftDate }) {
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [securityPersonnel, setSecurityPersonnel] = useState(() => {
    const list = formData?.securityPersonnel || [{ name: '', startTime: '', endTime: '', wage: '' }];
    return list.map(p => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '', wage: p.wage ?? '' }));
  });
  const [scannedDocuments, setScannedDocuments] = useState(
    formData?.scannedDocuments || []
  );
  const [webFormPdfs, setWebFormPdfs] = useState([]);

  // Load Secu web form PDFs for current shift date (LAN form submissions)
  useEffect(() => {
    const date = typeof shiftDate === 'string' && shiftDate.trim() ? shiftDate.trim() : null;
    if (!date || !window.electronAPI?.getSecuWebFormPdfs) {
      setWebFormPdfs([]);
      return;
    }
    window.electronAPI.getSecuWebFormPdfs(date).then((list) => {
      setWebFormPdfs(Array.isArray(list) ? list : []);
    }).catch(() => setWebFormPdfs([]));
  }, [shiftDate]);

  // Call onDataChange on mount and whenever data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        securityPersonnel,
        scannedDocuments,
        hasWebFormPdfs: webFormPdfs.length > 0
      });
    }
  }, [securityPersonnel, scannedDocuments, webFormPdfs.length, onDataChange]);

  const handlePersonnelChange = (index, field, value) => {
    const newPersonnel = [...securityPersonnel];
    newPersonnel[index][field] = value;
    setSecurityPersonnel(newPersonnel);
  };

  const handleAddPersonnel = () => {
    setSecurityPersonnel([
      ...securityPersonnel,
      { name: '', startTime: '', endTime: '', wage: '' }
    ]);
  };

  const handleRemovePersonnel = (index) => {
    const newPersonnel = securityPersonnel.filter((_, i) => i !== index);
    // Allow removing all persons (empty array is valid)
    setSecurityPersonnel(newPersonnel.length > 0 ? newPersonnel : []);
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setScannedDocuments(updatedDocuments.filter((d) => !d.readOnly));
  };

  const handleRemoveReadOnlyDocument = (doc) => {
    if (!doc || !doc.filePath || !window.electronAPI?.deleteLanFormPdf) return;
    window.electronAPI.deleteLanFormPdf(doc.filePath).then((result) => {
      if (result && result.ok) {
        window.electronAPI.getSecuWebFormPdfs(shiftDate).then((list) => {
          setWebFormPdfs(Array.isArray(list) ? list : []);
        }).catch(() => setWebFormPdfs([]));
      }
    });
  };

  const displayDocuments = [...webFormPdfs, ...scannedDocuments];

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
          {securityPersonnel.length === 0 ? (
            <div className="secu-personnel-empty">Kein Sicherheitspersonal hinzugefügt</div>
          ) : (
            securityPersonnel.map((person, index) => (
            <div key={index} className="secu-personnel-line">
              <div className="secu-name-combo">
                {PersonNameSelect ? (
                  <PersonNameSelect
                    value={person.name}
                    onChange={(name) => handlePersonnelChange(index, 'name', name)}
                    getNames={window.electronAPI ? window.electronAPI.getSecuNames : null}
                    addName={window.electronAPI ? window.electronAPI.addSecuName : null}
                    placeholder="Name *"
                    className={`secu-personnel-name ${shouldHighlight(`Secu Person ${index + 1} Name`) ? 'field-highlighted' : ''}`}
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => handlePersonnelChange(index, 'name', e.target.value)}
                    className={`secu-personnel-name ${shouldHighlight(`Secu Person ${index + 1} Name`) ? 'field-highlighted' : ''}`}
                    placeholder="Name *"
                    required
                  />
                )}
              </div>
              <input
                type="time"
                value={person.startTime}
                onChange={(e) => handlePersonnelChange(index, 'startTime', e.target.value)}
                className={`secu-personnel-time ${shouldHighlight(`Secu Person ${index + 1} Start Zeit`) ? 'field-highlighted' : ''}`}
                required
              />
              <input
                type="time"
                value={person.endTime}
                onChange={(e) => handlePersonnelChange(index, 'endTime', e.target.value)}
                className={`secu-personnel-time ${shouldHighlight(`Secu Person ${index + 1} End Zeit`) ? 'field-highlighted' : ''}`}
                required
              />
              <div className="secu-personnel-controls">
                <button
                  type="button"
                  onClick={() => handleRemovePersonnel(index)}
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
            onClick={handleAddPersonnel}
            className="add-line-button"
          >
            + Add Person
          </button>
        </div>

        {/* Scanner Section */}
        <div className={`scanner-box ${shouldHighlight('Gescannte Dokumente') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={displayDocuments}
            onDocumentsChange={handleDocumentsChange}
            onRemoveReadOnlyDocument={handleRemoveReadOnlyDocument}
            showScannedList={true}
            className="secu-scanner"
            defaultSource="glass"
            title="Secuzettel scannen"
            scanName="Securityzettel"
            templateKey="securityzettel"
            printedTemplates={printedTemplates}
            onTemplatePrinted={onTemplatePrinted}
          />
        </div>
      </div>
    </div>
  );
}

