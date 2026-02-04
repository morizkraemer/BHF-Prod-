const { useState, useEffect } = React;

const PersonNameSelect = window.PersonNameSelect;

function SecuForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted }) {
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [wageOptions, setWageOptions] = useState([]);
  const [securityPersonnel, setSecurityPersonnel] = useState(() => {
    const list = formData?.securityPersonnel || [{ name: '', startTime: '', endTime: '', wage: '' }];
    return list.map(p => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '', wage: p.wage ?? '' }));
  });
  const [scannedDocuments, setScannedDocuments] = useState(
    formData?.scannedDocuments || []
  );

  useEffect(() => {
    if (window.electronAPI?.getWageOptions) {
      window.electronAPI.getWageOptions().then((opts) => setWageOptions(Array.isArray(opts) ? opts : []));
    }
  }, []);

  // Call onDataChange on mount and whenever data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        securityPersonnel,
        scannedDocuments
      });
    }
  }, [securityPersonnel, scannedDocuments, onDataChange]);

  const handlePersonnelChange = (index, field, value) => {
    const newPersonnel = [...securityPersonnel];
    newPersonnel[index][field] = value;
    setSecurityPersonnel(newPersonnel);
    if (field === 'wage' && window.electronAPI?.setPersonWage) {
      const name = (newPersonnel[index]?.name || '').trim();
      if (name) window.electronAPI.setPersonWage(name, value);
    }
    if (field === 'name' && window.electronAPI?.getPersonWage) {
      const name = (value || '').trim();
      if (name) {
        window.electronAPI.getPersonWage(name).then((w) => {
          setTimeout(() => {
            setSecurityPersonnel(prev => {
              const next = [...prev];
              if (next[index] && (next[index].name || '').trim() === name) {
                next[index] = { ...next[index], wage: w ?? '' };
              }
              return next;
            });
          }, 0);
        });
      } else {
        setSecurityPersonnel(prev => {
          const next = [...prev];
          if (next[index]) next[index] = { ...next[index], wage: '' };
          return next;
        });
      }
    }
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
    setScannedDocuments(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="secu-form">
        {/* Security Personnel Section */}
        <div className="secu-personnel-section">
          {/* Column Headers */}
          <div className="secu-personnel-header">
            <div className="secu-header-name-wage">Name / €/h</div>
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
              <div className="secu-name-wage-combo">
                <div className="secu-name-wage-combo-name">
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
                <div className="secu-name-wage-combo-wage">
                  <select
                    value={person.wage ?? ''}
                    onChange={(e) => handlePersonnelChange(index, 'wage', e.target.value)}
                    className="secu-personnel-wage"
                  >
                    <option value="">—</option>
                    {wageOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {(person.wage && wageOptions.indexOf(person.wage) === -1) && (
                      <option value={person.wage}>{person.wage}</option>
                    )}
                  </select>
                </div>
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
            scannedDocuments={scannedDocuments}
            onDocumentsChange={handleDocumentsChange}
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

