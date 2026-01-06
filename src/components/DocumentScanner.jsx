const { useState, useEffect } = React;

// Document Scanner Component - Reusable scanner functionality
function DocumentScanner({ 
  scannedDocuments = [], 
  onDocumentsChange,
  showFileSelect = false,
  showScannedList = true,
  className = '',
  defaultSource = 'glass', // Default scan source
  title = 'Dokument scannen', // Title displayed in the component
  scanName = 'scan', // Name prefix for scanned files
  templateKey = null, // Template key for printing (e.g., 'securityzettel', 'handtuchzettel', 'technikzettel')
  printedTemplates = {}, // Object tracking which templates have been printed
  onTemplatePrinted = null // Callback when template is printed
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [pendingScan, setPendingScan] = useState(null); // File waiting for confirmation
  const [previewDocument, setPreviewDocument] = useState(null); // Document to preview in popup
  const [scanSource, setScanSource] = useState(defaultSource); // 'glass' or 'feeder'
  const [showGetScanButton, setShowGetScanButton] = useState(false); // Show "Get Scan" button after timeout
  const [scanTimeoutId, setScanTimeoutId] = useState(null); // Timeout ID for showing button
  
  // Get print status from props
  const hasPrinted = templateKey ? (printedTemplates[templateKey] || false) : false;

  useEffect(() => {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  useEffect(() => {
    // Listen for auto-detected scan files
    if (window.electronAPI && window.electronAPI.onScanFileDetected) {
      const handleAutoDetected = (result) => {
        // Only handle scans that match this component's scanName
        if (result && result.success && result.needsConfirmation && result.scanName === scanName) {
          // Show confirmation popup instead of auto-importing
          setPendingScan(result);
          setIsScanning(false);
          setShowGetScanButton(false);
          // Clear timeout if confirmation appears
          if (scanTimeoutId) {
            clearTimeout(scanTimeoutId);
            setScanTimeoutId(null);
          }
        }
      };
      
      window.electronAPI.onScanFileDetected(handleAutoDetected);
      
      return () => {
        if (window.electronAPI && window.electronAPI.removeScanFileDetectedListener) {
          window.electronAPI.removeScanFileDetectedListener();
        }
      };
    }
  }, [scanName, scanTimeoutId]); // Include scanName and scanTimeoutId in dependencies

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutId) {
        clearTimeout(scanTimeoutId);
      }
    };
  }, [scanTimeoutId]);
  
  const handleConfirmScan = () => {
    if (!pendingScan) return;
    
    const newScan = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      filePath: pendingScan.filePath,
      preview: pendingScan.base64 || `file://${pendingScan.filePath}`,
      type: pendingScan.type || 'image',
      filename: pendingScan.filename || pendingScan.filePath.split('/').pop(),
      scanName: scanName // Store the scanName with the document
    };
    const updatedDocuments = [...scannedDocuments, newScan];
    if (onDocumentsChange) {
      onDocumentsChange(updatedDocuments);
    }
    setPendingScan(null);
    setShowGetScanButton(false); // Hide button when scan is accepted
    if (scanTimeoutId) {
      clearTimeout(scanTimeoutId);
      setScanTimeoutId(null);
    }
  };
  
  const handleRejectScan = () => {
    setPendingScan(null);
    setIsScanning(false);
    setShowGetScanButton(false); // Hide button when scan is rejected
    if (scanTimeoutId) {
      clearTimeout(scanTimeoutId);
      setScanTimeoutId(null);
    }
  };

  const handleScan = async () => {
    // Check scanner availability before scanning
    if (window.scannerAvailability && !window.scannerAvailability.available) {
      alert('Scanner ist nicht verfügbar. Bitte überprüfen Sie die Verbindung.');
      return;
    }
    
    try {
      setIsScanning(true);
      setShowGetScanButton(false);
      // Clear any existing timeout
      if (scanTimeoutId) {
        clearTimeout(scanTimeoutId);
        setScanTimeoutId(null);
      }

      if (window.electronAPI && window.electronAPI.scanDocument) {
        const result = await window.electronAPI.scanDocument(scanSource, scanName);
        
        if (result && result.success) {
          // Scan completed - file will be detected via scan-file-detected event
          // Keep isScanning true - will be set to false when confirmation popup appears
          // Show "Get Scan" button immediately for testing
          setShowGetScanButton(true);
          
          // Also set timeout as fallback to check scan status periodically
          const timeout = setTimeout(async () => {
            // Check if scan is still in progress
            if (window.electronAPI && window.electronAPI.checkScanInProgress) {
              const scanStatus = await window.electronAPI.checkScanInProgress();
              // If scan is still in progress, keep button visible
              // If scan completed, button should already be visible
              if (!scanStatus.inProgress && !showGetScanButton) {
                setShowGetScanButton(true);
              }
            }
          }, 2000); // Check after 2 seconds
          setScanTimeoutId(timeout);
        } else if (result && result.error) {
          // Handle structured error response
          setIsScanning(false);
          setShowGetScanButton(false);
          if (scanTimeoutId) {
            clearTimeout(scanTimeoutId);
            setScanTimeoutId(null);
          }
          const error = result.error;
          
          // Handle different error types with appropriate UI
          // For empty feeder, show a more friendly informational message
          if (error.type === 'empty_feeder') {
            alert('ℹ️ ' + error.message);
          } else if (error.type === 'paper_jam' || error.type === 'cover_open') {
            // For recoverable errors, show with a helpful icon
            alert('⚠️ ' + error.message);
          } else if (error.type === 'scan_in_progress') {
            alert('ℹ️ ' + error.message);
          } else {
            // For other errors, show standard error alert
            alert('❌ ' + error.message);
          }
          
          console.error('Scan error:', error);
          console.error('Error type:', error.type, 'Recoverable:', error.isRecoverable);
        } else {
          setIsScanning(false);
          setShowGetScanButton(false);
          if (scanTimeoutId) {
            clearTimeout(scanTimeoutId);
            setScanTimeoutId(null);
          }
        }
      }
    } catch (error) {
      // Fallback for unexpected errors (shouldn't happen with new structure, but keep for safety)
      setIsScanning(false);
      setShowGetScanButton(false);
      if (scanTimeoutId) {
        clearTimeout(scanTimeoutId);
        setScanTimeoutId(null);
      }
      alert('❌ Fehler: ' + (error.message || 'Unbekannter Fehler beim Scannen'));
      console.error('Scan error:', error);
    }
  };

  const handleGetScan = async () => {
    try {
      // First check if scan is still in progress
      if (window.electronAPI && window.electronAPI.checkScanInProgress) {
        const scanStatus = await window.electronAPI.checkScanInProgress();
        if (scanStatus.inProgress) {
          alert('ℹ️ Scan läuft noch. Bitte warten Sie, bis der Scan abgeschlossen ist.');
          return;
        }
      }

      if (window.electronAPI && window.electronAPI.checkScanFolder) {
        const result = await window.electronAPI.checkScanFolder(scanName);
        
        if (result && result.success && result.found) {
          // Found a scan file - trigger the same confirmation flow
          setPendingScan({
            filePath: result.filePath,
            base64: result.base64,
            type: result.type,
            filename: result.filename,
            scanName: result.scanName
          });
          setIsScanning(false);
          setShowGetScanButton(false);
          if (scanTimeoutId) {
            clearTimeout(scanTimeoutId);
            setScanTimeoutId(null);
          }
        } else if (result && result.success && !result.found) {
          alert('ℹ️ ' + (result.message || 'Keine Scan-Datei gefunden. Der Scan ist möglicherweise noch nicht abgeschlossen.'));
        } else {
          alert('❌ Fehler beim Prüfen des Scan-Ordners: ' + (result?.message || 'Unbekannter Fehler'));
        }
      }
    } catch (error) {
      alert('❌ Fehler: ' + (error.message || 'Unbekannter Fehler beim Prüfen des Scan-Ordners'));
      console.error('Get scan error:', error);
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
            filename: result.filename || result.filePath.split('/').pop(),
            scanName: scanName // Store the scanName with the document
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

  const handlePrintTemplate = async () => {
    if (!templateKey) return;
    
    try {
      if (window.electronAPI && window.electronAPI.printTemplate) {
        await window.electronAPI.printTemplate(templateKey);
        // Notify parent component that this template has been printed
        if (onTemplatePrinted) {
          onTemplatePrinted(templateKey);
        }
      }
    } catch (error) {
      alert('Fehler beim Drucken: ' + error.message);
      console.error('Print error:', error);
    }
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
      
      {/* Scan Controls - Single Line */}
      <div className="scan-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {title && <span className="scan-section-title" style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{title}</span>}
        <button
          type="button"
          onClick={handleScan}
          className="scan-button scan-button-green"
          disabled={isScanning || pendingScan}
        >
          {isScanning ? 'Scannt...' : 'Scannen'}
        </button>
        {templateKey && (
          <button
            type="button"
            onClick={handlePrintTemplate}
            className={`scan-print-icon-button ${hasPrinted ? 'scan-print-icon-button-printed' : 'scan-print-icon-button-gray'}`}
            title="Template drucken"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <i data-lucide="printer" style={{ width: '16px', height: '16px' }}></i>
            <span>drucken</span>
          </button>
        )}
        <div className="scan-source-select" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="scan-source" className="scan-source-label" style={{ margin: 0, fontSize: '14px' }}>
            Scan-Quelle:
          </label>
          <select
            id="scan-source"
            value={scanSource}
            onChange={(e) => setScanSource(e.target.value)}
            className="scan-source-dropdown"
            disabled={isScanning || pendingScan}
          >
            <option value="glass">Glas</option>
            <option value="feeder">Oben</option>
          </select>
        </div>
        {scanSource === 'feeder' && !isScanning && !pendingScan && (
          <span style={{ fontSize: '12px', color: '#d97706' }}>⚠️ Dokumente im Einzug?</span>
        )}
        {isScanning && !showGetScanButton && (
          <span style={{ fontSize: '12px', color: '#2563eb' }}>⏳ Scan läuft...</span>
        )}
        {showGetScanButton && (
          <button
            type="button"
            onClick={handleGetScan}
            className="scan-button scan-button-blue"
            style={{ fontSize: '12px', padding: '6px 12px' }}
            title="Scan-Datei manuell abrufen"
          >
            📥 Scan abrufen
          </button>
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
                  <i data-lucide="x" style={{ width: '16px', height: '16px' }}></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

