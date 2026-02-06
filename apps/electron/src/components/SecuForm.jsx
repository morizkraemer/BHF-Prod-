const { useState, useEffect } = React;

const PersonnelListForm = window.PersonnelListForm;

function SecuForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted, shiftDate }) {
  const [securityPersonnel, setSecurityPersonnel] = useState(() => {
    const list = formData?.securityPersonnel || [];
    return list.map((p) => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '' }));
  });
  const [scannedDocuments, setScannedDocuments] = useState(formData?.scannedDocuments || []);
  const [webFormPdfs, setWebFormPdfs] = useState([]);

  useEffect(() => {
    const list = formData?.securityPersonnel;
    if (Array.isArray(list)) {
      setSecurityPersonnel(list.map((p) => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '' })));
    }
    if (Array.isArray(formData?.scannedDocuments)) {
      setScannedDocuments(formData.scannedDocuments);
    }
  }, [formData?.securityPersonnel?.length, formData?.scannedDocuments?.length]);

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

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        securityPersonnel,
        scannedDocuments,
        hasWebFormPdfs: webFormPdfs.length > 0,
        noPersonnelConfirmed: securityPersonnel.length > 0 ? false : formData?.noPersonnelConfirmed
      });
    }
  }, [securityPersonnel, scannedDocuments, webFormPdfs.length, formData?.noPersonnelConfirmed, onDataChange]);

  const handlePersonnelDataChange = (payload) => {
    if (payload && Array.isArray(payload.securityPersonnel)) {
      setSecurityPersonnel(payload.securityPersonnel.map((p) => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '' })));
    }
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setScannedDocuments(updatedDocuments.filter((d) => !d.readOnly));
  };

  const handleRemoveReadOnlyDocument = (doc) => {
    if (!doc?.filePath || !window.electronAPI?.deleteLanFormPdf) return;
    window.electronAPI.deleteLanFormPdf(doc.filePath).then((result) => {
      if (result?.ok && shiftDate) {
        window.electronAPI.getSecuWebFormPdfs(shiftDate).then((list) => setWebFormPdfs(Array.isArray(list) ? list : [])).catch(() => setWebFormPdfs([]));
      }
    });
  };

  const displayDocuments = [...webFormPdfs, ...scannedDocuments];

  return (
    <div className="form-container">
      <div className="secu-form">
        <div className="secu-personnel-section">
          {PersonnelListForm ? (
            <PersonnelListForm
              listKey="securityPersonnel"
              initialList={securityPersonnel}
              onDataChange={handlePersonnelDataChange}
              getNames={window.electronAPI?.getSecuNames ?? null}
              addName={window.electronAPI?.addSecuName ?? null}
              roleMode="fixed"
              fixedRoleName="Secu"
              emptyMessage={formData?.noPersonnelConfirmed ? "Kein Sicherheitspersonal bestätigt" : "Kein Sicherheitspersonal hinzugefügt"}
              addButtonLabel="+ Add Person"
              sectionClass="secu-personnel"
              highlightedFields={highlightedFields}
              highlightPrefix="Secu Person"
              emptyStateFooter={securityPersonnel.length === 0 ? (
                <div className="secu-confirm-no-personnel">
                  {formData?.noPersonnelConfirmed ? (
                    <span className="secu-confirm-no-personnel-state">Bestätigt</span>
                  ) : (
                    <button
                      type="button"
                      className="secu-confirm-no-personnel-button"
                      onClick={() => onDataChange({ ...formData, noPersonnelConfirmed: true })}
                    >
                      Kein Sicherheitspersonal
                    </button>
                  )}
                </div>
              ) : null}
            />
          ) : (
            <div className="secu-personnel-empty">PersonnelListForm nicht geladen</div>
          )}
        </div>

        <div className={`scanner-box ${(highlightedFields || []).includes('Gescannte Dokumente') ? 'field-highlighted-group' : ''}`}>
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
