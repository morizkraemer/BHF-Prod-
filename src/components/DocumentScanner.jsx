const { useState, useEffect } = React;

// Document Scanner Component - Reusable scanner functionality
function DocumentScanner({ 
  scannedDocuments = [], 
  onDocumentsChange,
  showFileSelect = true,
  showScannedList = true,
  className = ''
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [pendingScan, setPendingScan] = useState(null); // File waiting for confirmation
  const [previewDocument, setPreviewDocument] = useState(null); // Document to preview in popup
  const [scanSource, setScanSource] = useState('glass'); // 'glass' or 'feeder'

  useEffect(() => {
    // Listen for auto-detected scan files
    if (window.electronAPI && window.electronAPI.onScanFileDetected) {
      const handleAutoDetected = (result) => {
        if (result && result.success && result.needsConfirmation) {
          // Show confirmation popup instead of auto-importing
          setPendingScan(result);
          setIsScanning(false);
        }
      };
      
      window.electronAPI.onScanFileDetected(handleAutoDetected);
      
      return () => {
        if (window.electronAPI && window.electronAPI.removeScanFileDetectedListener) {
          window.electronAPI.removeScanFileDetectedListener();
        }
      };
    }
  }, []);
  
  const handleConfirmScan = () => {
    if (pendingScan) {
      const newScan = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        filePath: pendingScan.filePath,
        preview: pendingScan.base64 || `file://${pendingScan.filePath}`,
        type: pendingScan.type || 'image',
        filename: pendingScan.filename
      };
      const updatedDocuments = [...scannedDocuments, newScan];
      if (onDocumentsChange) {
        onDocumentsChange(updatedDocuments);
      }
      setPendingScan(null);
    }
  };
  
  const handleRejectScan = () => {
    setPendingScan(null);
    setIsScanning(false);
  };

  const handleScan = async () => {
    try {
      setIsScanning(true);
      if (window.electronAPI && window.electronAPI.scanDocument) {
        const result = await window.electronAPI.scanDocument(scanSource);
        
        if (result.success) {
          // Scan completed - file will be detected via scan-file-detected event
          // Keep isScanning true - will be set to false when confirmation popup appears
        } else {
          setIsScanning(false);
        }
      }
    } catch (error) {
      setIsScanning(false);
      alert('Fehler: ' + error.message);
      console.error('Scan error:', error);
    }
  };

  const handleSelectFile = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectScanFile) {
        const result = await window.electronAPI.selectScanFile();
        
        if (result && result.success) {
          const newScan = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            filePath: result.filePath,
            preview: result.base64 || `file://${result.filePath}`,
            type: result.type || 'image',
            filename: result.filename || result.filePath.split('/').pop()
          };
          const updatedDocuments = [...scannedDocuments, newScan];
          if (onDocumentsChange) {
            onDocumentsChange(updatedDocuments);
          }
        }
      }
    } catch (error) {
      alert('Fehler beim Auswählen der Datei: ' + error.message);
      console.error('File select error:', error);
    }
  };

  const handleRemoveScan = (scanId) => {
    const updatedDocuments = scannedDocuments.filter(scan => scan.id !== scanId);
    if (onDocumentsChange) {
      onDocumentsChange(updatedDocuments);
    }
    // Close preview if the removed document was being previewed
    if (previewDocument && previewDocument.id === scanId) {
      setPreviewDocument(null);
    }
  };

  const handlePreviewDocument = (scan) => {
    setPreviewDocument(scan);
  };

  const handleClosePreview = () => {
    setPreviewDocument(null);
  };

  return (
    <div className={className}>
      {/* Confirmation Popup */}
      {pendingScan && (
        <div className="scan-confirmation-overlay">
          <div className="scan-confirmation-popup">
            <h3>Neuer Scan erkannt</h3>
            <p className="scan-confirmation-filename">{pendingScan.filename}</p>
            <div className="scan-confirmation-preview">
              {pendingScan.type === 'pdf' ? (
                window.pdfjsLib ? (
                  <PDFViewer 
                    base64Data={pendingScan.base64} 
                    style={{ width: '100%', maxHeight: '400px' }}
                  />
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p>PDF.js wird geladen...</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{pendingScan.filename}</p>
                  </div>
                )
              ) : (
                <img 
                  src={pendingScan.base64} 
                  alt="Scan preview" 
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              )}
            </div>
            <div className="scan-confirmation-buttons">
              <button
                type="button"
                onClick={handleConfirmScan}
                className="scan-confirm-button"
              >
                ✓ Bestätigen und hinzufügen
              </button>
              <button
                type="button"
                onClick={handleRejectScan}
                className="scan-reject-button"
              >
                ✗ Ablehnen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Scan Controls */}
      <div className="scan-section">
        <div className="scan-controls-row">
          <div className="scan-source-select">
            <label htmlFor="scan-source" className="scan-source-label">
              Scan-Quelle:
            </label>
            <select
              id="scan-source"
              value={scanSource}
              onChange={(e) => setScanSource(e.target.value)}
              className="scan-source-dropdown"
              disabled={isScanning || pendingScan}
            >
              <option value="glass">Glas (Flachbett)</option>
              <option value="feeder">Einzug (Automatik)</option>
            </select>
          </div>
          <div className="scan-buttons">
            <button
              type="button"
              onClick={handleScan}
              className="scan-button"
              disabled={isScanning || pendingScan}
            >
              {isScanning ? 'Scannt...' : 'Scannen'}
            </button>
            {showFileSelect && (
              <button
                type="button"
                onClick={handleSelectFile}
                className="scan-button scan-button-secondary"
                disabled={isScanning || pendingScan}
              >
                Datei auswählen
              </button>
            )}
          </div>
        </div>
        {isScanning && (
          <div className="scan-status">
            <p>⏳ Scan läuft...</p>
            <p className="scan-status-hint">Bitte warten Sie, während das Dokument gescannt wird.</p>
          </div>
        )}
      </div>

      {/* Preview Popup */}
      {previewDocument && (
        <div className="scan-preview-overlay" onClick={handleClosePreview}>
          <div className="scan-preview-popup" onClick={(e) => e.stopPropagation()}>
            <div className="scan-preview-header">
              <h3>{previewDocument.filename || 'Vorschau'}</h3>
              <button
                type="button"
                onClick={handleClosePreview}
                className="scan-preview-close"
                title="Schließen"
              >
                ×
              </button>
            </div>
            <div className="scan-preview-content">
              {previewDocument.type === 'pdf' ? (
                window.pdfjsLib && previewDocument.preview && previewDocument.preview.startsWith('data:') ? (
                  <PDFViewer 
                    base64Data={previewDocument.preview} 
                    style={{ width: '100%', maxHeight: '80vh' }}
                  />
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    <p>PDF-Vorschau nicht verfügbar</p>
                    {previewDocument.filePath && (
                      <p style={{ fontSize: '12px', marginTop: '8px' }}>{previewDocument.filePath}</p>
                    )}
                  </div>
                )
              ) : (
                previewDocument.preview && (previewDocument.preview.startsWith('data:') || previewDocument.preview.startsWith('blob:')) ? (
                  <img 
                    src={previewDocument.preview} 
                    alt="Scanned document" 
                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    <p>Bild-Vorschau nicht verfügbar</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scanned Documents List */}
      {showScannedList && scannedDocuments.length > 0 && (
        <div className="scanned-images-section">
          <h3>Gescannte Dokumente ({scannedDocuments.length})</h3>
          <div className="scanned-documents-list">
            {scannedDocuments.map((scan) => (
              <div key={scan.id} className="scanned-document-item">
                <button
                  type="button"
                  onClick={() => handlePreviewDocument(scan)}
                  className="scanned-document-name"
                  title="Zum Vorschauen klicken"
                >
                  <span className="document-icon">
                    {scan.type === 'pdf' ? '📄' : '🖼️'}
                  </span>
                  <span className="document-filename">{scan.filename || `Scan ${scannedDocuments.indexOf(scan) + 1}`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveScan(scan.id)}
                  className="remove-scan-button"
                  title="Entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

