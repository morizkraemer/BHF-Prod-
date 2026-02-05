const { useState, useEffect } = React;

const PersonnelListForm = window.PersonnelListForm;

function TontechnikerForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted }) {
  const initialPersonnel = () => {
    const list = formData?.personnel;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((p) => ({
        name: p.name ?? '',
        startTime: p.startTime ?? '',
        endTime: p.endTime ?? '',
        role: p.role ?? ''
      }));
    }
    return [{ name: '', startTime: '', endTime: '', role: '' }];
  };

  const [personnel, setPersonnel] = useState(initialPersonnel);
  const [scannedImages, setScannedImages] = useState(formData?.scannedImages ?? []);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (window.electronAPI?.getRoles) {
      window.electronAPI.getRoles().then((list) => setRoles(Array.isArray(list) ? list : [])).catch(() => setRoles([]));
    }
  }, []);

  useEffect(() => {
    const list = formData?.personnel;
    if (Array.isArray(list) && list.length > 0) {
      setPersonnel(list.map((p) => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '', role: p.role ?? '' })));
    }
    if (Array.isArray(formData?.scannedImages)) {
      setScannedImages(formData.scannedImages);
    }
  }, [formData?.personnel?.length, formData?.scannedImages?.length]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ personnel, scannedImages });
    }
  }, [personnel, scannedImages, onDataChange]);

  const handlePersonnelDataChange = (payload) => {
    if (payload && Array.isArray(payload.personnel)) {
      setPersonnel(payload.personnel.map((p) => ({
        name: p.name ?? '',
        startTime: p.startTime ?? '',
        endTime: p.endTime ?? '',
        role: p.role ?? ''
      })));
    }
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setScannedImages(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="tontechniker-form">
        <div className="tontechniker-personnel-section">
          {PersonnelListForm ? (
            <PersonnelListForm
              listKey="personnel"
              initialList={personnel}
              onDataChange={handlePersonnelDataChange}
              getNames={window.electronAPI?.getTechNames ?? null}
              addName={window.electronAPI?.addTechName ?? null}
              roleMode="select"
              getRoles={() => roles}
              roles={roles}
              emptyMessage="Keine Ton/Licht-Personen hinzugefügt"
              addButtonLabel="+ Add Person"
              sectionClass="tontechniker-personnel"
              highlightedFields={highlightedFields}
              highlightPrefix="Ton/Licht Person"
            />
          ) : (
            <div className="tontechniker-personnel-empty">PersonnelListForm nicht geladen</div>
          )}
        </div>

        <div className={`scanner-box ${(highlightedFields || []).includes('Gescannte Bilder') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={scannedImages}
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
