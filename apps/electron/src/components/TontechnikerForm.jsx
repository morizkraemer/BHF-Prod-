const { useState, useEffect } = React;

const PersonnelListForm = window.PersonnelListForm;

function TontechnikerForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted, shiftDate }) {
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
    return [];
  };

  const [personnel, setPersonnel] = useState(initialPersonnel);
  const [scannedImages, setScannedImages] = useState(formData?.scannedImages ?? []);
  const [technikWebFormPdfs, setTechnikWebFormPdfs] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (window.electronAPI?.getRoles) {
      window.electronAPI.getRoles().then((list) => setRoles(Array.isArray(list) ? list : [])).catch(() => setRoles([]));
    }
  }, []);

  useEffect(() => {
    const list = formData?.personnel;
    if (Array.isArray(list)) {
      setPersonnel(list.map((p) => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '', role: p.role ?? '' })));
    }
    if (Array.isArray(formData?.scannedImages)) {
      setScannedImages(formData.scannedImages);
    }
  }, [formData?.personnel?.length, formData?.scannedImages?.length]);

  useEffect(() => {
    const hasDate = typeof shiftDate === 'string' && shiftDate.trim();
    if (!hasDate || !window.electronAPI?.getServerUrl || !window.electronAPI?.getCurrentEvent || !window.electronAPI?.getEventDocuments) {
      setTechnikWebFormPdfs([]);
      return;
    }
    window.electronAPI.getServerUrl().then((serverUrl) => {
      const url = (serverUrl || '').trim();
      if (!url) {
        setTechnikWebFormPdfs([]);
        return;
      }
      window.electronAPI.getCurrentEvent().then((current) => {
        if (!current || !current.id) {
          setTechnikWebFormPdfs([]);
          return;
        }
        window.electronAPI.getEventDocuments(current.id).then((list) => {
          const technikDocs = (list || []).filter((d) => (d.sectionOrName || d.section_or_name || '') === 'technik');
          const mapped = technikDocs.map((d) => {
            const docId = d.id;
            const baseUrl = url.replace(/\/$/, '');
            const filePath = d.filePath || d.file_path || '';
            const filename = filePath ? filePath.split('/').pop() : `Technikfeedback-${docId}.pdf`;
            return {
              id: 'technik-doc-' + docId,
              documentUrl: `${baseUrl}/api/documents/${docId}`,
              filename: filename || 'Technik-Feedback.pdf',
              scanName: 'Technik-Feedback',
              type: 'pdf',
              readOnly: true
            };
          });
          setTechnikWebFormPdfs(mapped);
        }).catch(() => setTechnikWebFormPdfs([]));
      }).catch(() => setTechnikWebFormPdfs([]));
    }).catch(() => setTechnikWebFormPdfs([]));
  }, [shiftDate]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        personnel,
        scannedImages,
        noPersonnelConfirmed: personnel.length > 0 ? false : formData?.noPersonnelConfirmed
      });
    }
  }, [personnel, scannedImages, formData?.noPersonnelConfirmed, onDataChange]);

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
    setScannedImages(updatedDocuments.filter((d) => !d.readOnly));
  };

  const handleRemoveReadOnlyDocument = (doc) => {
    if (doc?.documentUrl) return;
    if (doc?.filePath && window.electronAPI?.deleteLanFormPdf) {
      window.electronAPI.deleteLanFormPdf(doc.filePath).then((result) => {
        if (result?.ok && shiftDate) {
          window.electronAPI.getCurrentEvent().then((current) => {
            if (current?.id) {
              window.electronAPI.getServerUrl().then((serverUrl) => {
                if (!(serverUrl || '').trim()) return;
                window.electronAPI.getEventDocuments(current.id).then((list) => {
                  const technikDocs = (list || []).filter((d) => (d.sectionOrName || d.section_or_name || '') === 'technik');
                  const mapped = technikDocs.map((d) => ({
                    id: 'technik-doc-' + d.id,
                    documentUrl: `${(serverUrl || '').replace(/\/$/, '')}/api/documents/${d.id}`,
                    filename: (d.filePath || d.file_path || '').split('/').pop() || 'Technik-Feedback.pdf',
                    scanName: 'Technik-Feedback',
                    type: 'pdf',
                    readOnly: true
                  }));
                  setTechnikWebFormPdfs(mapped);
                }).catch(() => {});
              });
            }
          });
        }
      });
    }
  };

  const displayDocuments = [...technikWebFormPdfs, ...scannedImages];

  // Ton/Licht: show only roles that are not Secu
  const tonLichtRoles = roles.filter((r) => (r.name || '').trim().toLowerCase() !== 'secu');

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
              getRoles={() => tonLichtRoles}
              roles={tonLichtRoles}
              emptyMessage={formData?.noPersonnelConfirmed ? "Keine Ton/Lichtperson bestätigt" : "Keine Ton/Licht-Personen hinzugefügt"}
              addButtonLabel="+ Add Person"
              sectionClass="tontechniker-personnel"
              highlightedFields={highlightedFields}
              highlightPrefix="Ton/Licht Person"
              emptyStateFooter={personnel.length === 0 ? (
                <div className="tontechniker-confirm-no-personnel">
                  {formData?.noPersonnelConfirmed ? (
                    <span className="tontechniker-confirm-no-personnel-state">Bestätigt</span>
                  ) : (
                    <button
                      type="button"
                      className="tontechniker-confirm-no-personnel-button"
                      onClick={() => onDataChange({ ...formData, noPersonnelConfirmed: true })}
                    >
                      Keine Ton/Lichtperson
                    </button>
                  )}
                </div>
              ) : null}
            />
          ) : (
            <div className="tontechniker-personnel-empty">PersonnelListForm nicht geladen</div>
          )}
        </div>

        <div className={`scanner-box ${(highlightedFields || []).includes('Gescannte Bilder') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={displayDocuments}
            onDocumentsChange={handleDocumentsChange}
            onRemoveReadOnlyDocument={handleRemoveReadOnlyDocument}
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
