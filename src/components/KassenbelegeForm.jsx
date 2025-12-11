const { useState, useEffect } = React;

function KassenbelegeForm({ formData, onDataChange }) {
  const [receipts, setReceipts] = useState(formData?.receipts || []);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ receipts });
    }
  }, [receipts]);

  const handleDocumentsChange = (updatedDocuments) => {
    setReceipts(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="kassenbelege-form">
        {/* Scanner Section in Box */}
        <div className="scanner-box">
          <DocumentScanner
            scannedDocuments={receipts}
            onDocumentsChange={handleDocumentsChange}
            showFileSelect={false}
            showScannedList={true}
            className="kassenbelege-scanner"
            defaultSource="glass"
          />
        </div>
      </div>
    </div>
  );
}
