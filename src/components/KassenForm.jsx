const { useState, useEffect } = React;

function KassenForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted }) {
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [receipts, setReceipts] = useState(formData?.receipts || []);
  const [abrechnungen, setAbrechnungen] = useState(formData?.abrechnungen || []);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ 
        receipts,
        abrechnungen
      });
    }
  }, [receipts, abrechnungen]);

  const handleReceiptsChange = (updatedDocuments) => {
    setReceipts(updatedDocuments);
  };

  const handleAbrechnungenChange = (updatedDocuments) => {
    setAbrechnungen(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="kassen-form">
        {/* Belege Scanner Section in Box */}
        <div className={`scanner-box ${shouldHighlight('Belege Scans') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={receipts}
            onDocumentsChange={handleReceiptsChange}
            showFileSelect={false}
            showScannedList={true}
            className="kassen-scanner"
            defaultSource="glass"
            title="Belege scannen"
            scanName="Kassen-Belege"
          />
        </div>
        
        {/* Kassenabrechnungen Scanner Section in Box */}
        <div className={`scanner-box ${shouldHighlight('Abrechnungen Scans') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={abrechnungen}
            onDocumentsChange={handleAbrechnungenChange}
            showFileSelect={false}
            showScannedList={true}
            className="kassen-scanner"
            defaultSource="glass"
            title="Kassenabrechnungen"
            scanName="Abrechnungen"
            templateKey="kassenzettel"
            printedTemplates={printedTemplates}
            onTemplatePrinted={onTemplatePrinted}
          />
        </div>
      </div>
    </div>
  );
}

