const { useState, useEffect } = React;

function TontechnikerForm({ formData, onDataChange }) {
  const [scannedImages, setScannedImages] = useState(formData?.scannedImages || []);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ scannedImages });
    }
  }, [scannedImages]);

  const handleDocumentsChange = (updatedDocuments) => {
    setScannedImages(updatedDocuments);
  };

  return (
    <div className="form-container">
      <div className="tontechniker-form">
        <DocumentScanner
          scannedDocuments={scannedImages}
          onDocumentsChange={handleDocumentsChange}
          showFileSelect={true}
          showScannedList={true}
          className="tontechniker-scanner"
        />
      </div>
    </div>
  );
}

