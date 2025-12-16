const { useState, useEffect } = React;

function OrderbirdForm({ formData, onDataChange, highlightedFields = [] }) {
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [receipts, setReceipts] = useState(formData?.receipts || []);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ 
        receipts
      });
    }
  }, [receipts]);

  const handleDocumentsChange = (updatedDocuments) => {
    setReceipts(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="orderbird-form">
        {/* Scanner Section in Box */}
        <div className={`scanner-box ${shouldHighlight('Belege Scans') ? 'field-highlighted-group' : ''}`}>
          <DocumentScanner
            scannedDocuments={receipts}
            onDocumentsChange={handleDocumentsChange}
            showFileSelect={false}
            showScannedList={true}
            className="orderbird-scanner"
            defaultSource="glass"
            title="Belege scannen"
            scanName="Orderbird-Belege"
          />
        </div>
      </div>
    </div>
  );
}

