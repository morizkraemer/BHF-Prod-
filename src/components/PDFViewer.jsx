const { useState, useEffect, useRef } = React;

// PDF Viewer Component using PDF.js
function PDFViewer({ base64Data, style }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!base64Data || !window.pdfjsLib) {
      setError('PDF.js nicht verfügbar');
      setLoading(false);
      return;
    }

    async function renderPDF() {
      try {
        setLoading(true);
        setError(null);
        
        // Extract base64 data
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Ungültiges Base64-Format');
        }
        
        const base64String = matches[2];
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Set worker source
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Load PDF
        const loadingTask = window.pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        
        // Get first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        
        // Set canvas dimensions
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error('PDF rendering error:', err);
        setError('Fehler beim Laden der PDF-Vorschau');
        setLoading(false);
      }
    }

    renderPDF();
  }, [base64Data]);

  if (error) {
    return (
      <div style={{ ...style, padding: '20px', textAlign: 'center', color: '#666' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ ...style, position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#666' }}>
          PDF wird geladen...
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: 'auto', 
          maxHeight: style?.maxHeight || '400px',
          objectFit: 'contain',
          border: '1px solid #ddd',
          borderRadius: '4px',
          display: loading ? 'none' : 'block'
        }} 
      />
    </div>
  );
}

