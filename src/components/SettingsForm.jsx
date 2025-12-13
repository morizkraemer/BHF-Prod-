const { useState, useEffect } = React;

function SettingsForm() {
  const [activeSettingsSection, setActiveSettingsSection] = useState('rider');
  const [catalogItems, setCatalogItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemEkPrice, setNewItemEkPrice] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemEkPrice, setEditItemEkPrice] = useState('');
  const [nightLeads, setNightLeads] = useState([]);
  const [newLeadName, setNewLeadName] = useState('');
  const [editingLead, setEditingLead] = useState(null);
  const [editLeadName, setEditLeadName] = useState('');
  const [scanners, setScanners] = useState([]);
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [loadingScanners, setLoadingScanners] = useState(false);
  const [scanFolder, setScanFolder] = useState(null);
  const [reportFolder, setReportFolder] = useState(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [templates, setTemplates] = useState({
    securityzettel: null,
    handtuchzettel: null,
    technikzettel: null,
    uebersichtzettel: null
  });
  const [bestueckungLists, setBestueckungLists] = useState({
    'standard-konzert': [],
    'standard-tranzit': []
  });
  const [selectedBestueckung, setSelectedBestueckung] = useState('standard-konzert');
  const [selectedRiderItemId, setSelectedRiderItemId] = useState('');
  const [selectedItemAmount, setSelectedItemAmount] = useState('1');
  const [editingBestueckungItem, setEditingBestueckungItem] = useState(null);
  const [editSelectedRiderItemId, setEditSelectedRiderItemId] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('1');

  const checkScannerAvailability = async () => {
    if (window.electronAPI && window.electronAPI.checkScannerAvailability) {
      try {
        const result = await window.electronAPI.checkScannerAvailability();
        setScannerAvailable(result.available || false);
      } catch (error) {
        setScannerAvailable(false);
      }
    }
  };

  useEffect(() => {
    loadItems();
    loadNightLeads();
    loadScanners();
    loadSelectedScanner();
    loadScanFolder();
    loadReportFolder();
    loadTemplates();
    loadBestueckungLists();
    checkScannerAvailability();
    
    // Check scanner availability periodically
    const interval = setInterval(checkScannerAvailability, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadScanFolder = async () => {
    if (window.electronAPI && window.electronAPI.getScanFolder) {
      const folder = await window.electronAPI.getScanFolder();
      setScanFolder(folder);
    }
  };

  const loadReportFolder = async () => {
    if (window.electronAPI && window.electronAPI.getReportFolder) {
      const folder = await window.electronAPI.getReportFolder();
      setReportFolder(folder);
    }
  };

  const loadTemplates = async () => {
    if (window.electronAPI && window.electronAPI.getTemplate) {
      const securityzettel = await window.electronAPI.getTemplate('securityzettel');
      const handtuchzettel = await window.electronAPI.getTemplate('handtuchzettel');
      const technikzettel = await window.electronAPI.getTemplate('technikzettel');
      const uebersichtzettel = await window.electronAPI.getTemplate('uebersichtzettel');
      setTemplates({
        securityzettel,
        handtuchzettel,
        technikzettel,
        uebersichtzettel
      });
    }
  };

  const handleUploadTemplate = async (templateKey) => {
    if (window.electronAPI && window.electronAPI.uploadTemplate) {
      try {
        const result = await window.electronAPI.uploadTemplate(templateKey);
        if (result.success) {
          setTemplates(prev => ({
            ...prev,
            [templateKey]: result.filePath
          }));
          alert('Template erfolgreich hochgeladen!');
        }
      } catch (error) {
        alert('Fehler beim Hochladen des Templates: ' + error.message);
      }
    }
  };

  const handleSelectScanFolder = async () => {
    if (window.electronAPI && window.electronAPI.setScanFolder) {
      const folder = await window.electronAPI.setScanFolder();
      if (folder) {
        setScanFolder(folder);
      }
    }
  };

  const handleSelectReportFolder = async () => {
    if (window.electronAPI && window.electronAPI.setReportFolder) {
      const folder = await window.electronAPI.setReportFolder();
      if (folder) {
        setReportFolder(folder);
      }
    }
  };

  const loadScanners = async () => {
    setLoadingScanners(true);
    if (window.electronAPI && window.electronAPI.listScanners) {
      try {
        const scannerList = await window.electronAPI.listScanners();
        console.log('Found scanners:', scannerList);
        setScanners(scannerList || []);
      } catch (error) {
        console.error('Error loading scanners:', error);
        alert('Fehler beim Laden der Scanner: ' + error.message);
        setScanners([]);
      }
    }
    setLoadingScanners(false);
  };

  const loadSelectedScanner = async () => {
    if (window.electronAPI && window.electronAPI.getSelectedScanner) {
      const scannerId = await window.electronAPI.getSelectedScanner();
      setSelectedScanner(scannerId);
    }
  };

  const handleScannerChange = async (scannerId) => {
    if (window.electronAPI && window.electronAPI.setSelectedScanner) {
      // Find the scanner object to pass full info
      const scanner = scanners.find(s => s.id === scannerId);
      await window.electronAPI.setSelectedScanner(scannerId, scanner || null);
      setSelectedScanner(scannerId);
      // Check availability after selection
      setTimeout(checkScannerAvailability, 500);
    }
  };

  const loadItems = async () => {
    if (window.electronAPI && window.electronAPI.getRiderItems) {
      const items = await window.electronAPI.getRiderItems();
      setCatalogItems(items || []);
    }
  };

  const loadNightLeads = async () => {
    if (window.electronAPI && window.electronAPI.getNightLeads) {
      const leads = await window.electronAPI.getNightLeads();
      setNightLeads(leads || []);
    }
  };

  const loadBestueckungLists = async () => {
    if (window.electronAPI && window.electronAPI.getBestueckungLists) {
      const lists = await window.electronAPI.getBestueckungLists();
      setBestueckungLists(lists || {
        'standard-konzert': [],
        'standard-tranzit': []
      });
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      alert('Bitte Name und Preis eingeben');
      return;
    }

    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price < 0) {
      alert('Bitte einen gültigen Preis eingeben');
      return;
    }

    if (window.electronAPI && window.electronAPI.addRiderItem) {
      await window.electronAPI.addRiderItem({
        name: newItemName.trim(),
        price: price,
        ekPrice: newItemEkPrice.trim() ? parseFloat(newItemEkPrice) : null
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemEkPrice('');
      loadItems();
    }
  };

  const handleStartEdit = (item) => {
    setEditingItem(item.id);
    setEditItemName(item.name);
    setEditItemPrice(item.price.toString());
    setEditItemEkPrice(item.ekPrice ? item.ekPrice.toString() : '');
  };

  const handleSaveEdit = async () => {
    if (!editItemName.trim() || !editItemPrice.trim()) {
      alert('Bitte Name und Preis eingeben');
      return;
    }

    const price = parseFloat(editItemPrice);
    if (isNaN(price) || price < 0) {
      alert('Bitte einen gültigen Preis eingeben');
      return;
    }

    if (window.electronAPI && window.electronAPI.updateRiderItem) {
      await window.electronAPI.updateRiderItem(editingItem, {
        name: editItemName.trim(),
        price: price,
        ekPrice: editItemEkPrice.trim() ? parseFloat(editItemEkPrice) : null
      });
      setEditingItem(null);
      setEditItemName('');
      setEditItemPrice('');
      setEditItemEkPrice('');
      loadItems();
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditItemName('');
    setEditItemPrice('');
    setEditItemEkPrice('');
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Möchten Sie dieses Element wirklich löschen?')) {
      if (window.electronAPI && window.electronAPI.deleteRiderItem) {
        await window.electronAPI.deleteRiderItem(itemId);
        loadItems();
      }
    }
  };

  // Night Leads handlers
  const handleAddLead = async () => {
    if (!newLeadName.trim()) {
      alert('Bitte Name eingeben');
      return;
    }

    if (window.electronAPI && window.electronAPI.addNightLead) {
      await window.electronAPI.addNightLead({
        name: newLeadName.trim()
      });
      setNewLeadName('');
      loadNightLeads();
    }
  };

  const handleStartEditLead = (lead) => {
    setEditingLead(lead.id);
    setEditLeadName(lead.name);
  };

  const handleSaveEditLead = async () => {
    if (!editLeadName.trim()) {
      alert('Bitte Name eingeben');
      return;
    }

    if (window.electronAPI && window.electronAPI.updateNightLead) {
      await window.electronAPI.updateNightLead(editingLead, {
        name: editLeadName.trim()
      });
      setEditingLead(null);
      setEditLeadName('');
      loadNightLeads();
    }
  };

  const handleCancelEditLead = () => {
    setEditingLead(null);
    setEditLeadName('');
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Möchten Sie diesen Night Lead wirklich löschen?')) {
      if (window.electronAPI && window.electronAPI.deleteNightLead) {
        await window.electronAPI.deleteNightLead(leadId);
        loadNightLeads();
      }
    }
  };

  // Bestückung handlers
  const handleAddBestueckungItem = async () => {
    if (!selectedRiderItemId) {
      alert('Bitte ein Item auswählen');
      return;
    }

    const amount = parseFloat(selectedItemAmount) || 1;
    if (amount <= 0) {
      alert('Die Menge muss größer als 0 sein');
      return;
    }

    if (window.electronAPI && window.electronAPI.addBestueckungItem) {
      const result = await window.electronAPI.addBestueckungItem(selectedBestueckung, selectedRiderItemId, amount);
      if (result) {
        setSelectedRiderItemId('');
        setSelectedItemAmount('1');
        loadBestueckungLists();
      } else {
        alert('Dieses Item ist bereits in der Liste');
      }
    }
  };

  const handleStartEditBestueckungItem = (riderItemId, amount) => {
    setEditingBestueckungItem(riderItemId);
    setEditSelectedRiderItemId(riderItemId);
    setEditItemAmount(amount.toString());
  };

  const handleSaveEditBestueckungItem = async () => {
    if (!editSelectedRiderItemId) {
      alert('Bitte ein Item auswählen');
      return;
    }

    const amount = parseFloat(editItemAmount) || 1;
    if (amount <= 0) {
      alert('Die Menge muss größer als 0 sein');
      return;
    }

    if (window.electronAPI && window.electronAPI.updateBestueckungItem) {
      await window.electronAPI.updateBestueckungItem(selectedBestueckung, editingBestueckungItem, {
        riderItemId: editSelectedRiderItemId,
        amount: amount
      });
      setEditingBestueckungItem(null);
      setEditSelectedRiderItemId('');
      setEditItemAmount('1');
      loadBestueckungLists();
    }
  };

  const handleCancelEditBestueckungItem = () => {
    setEditingBestueckungItem(null);
    setEditSelectedRiderItemId('');
    setEditItemAmount('1');
  };

  const handleDeleteBestueckungItem = async (itemId) => {
    if (window.confirm('Möchten Sie dieses Item wirklich löschen?')) {
      if (window.electronAPI && window.electronAPI.deleteBestueckungItem) {
        await window.electronAPI.deleteBestueckungItem(selectedBestueckung, itemId);
        loadBestueckungLists();
      }
    }
  };

  const renderRiderSection = () => (
    <>
      <h2>Rider Extras Katalog</h2>
      <p className="settings-description">
        Verwalten Sie die verfügbaren Items für Rider Extras. Diese Items können dann beim Ausfüllen des Formulars ausgewählt werden.
      </p>

      {/* Add New Item */}
      <div className="settings-add-section">
          <h3>Neues Item hinzufügen</h3>
          <div className="settings-add-form">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="settings-input"
              placeholder="Item Name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
            />
            <input
              type="number"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="settings-input settings-price-input"
              placeholder="Preis"
              min="0"
              step="0.01"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
            />
            <input
              type="number"
              value={newItemEkPrice}
              onChange={(e) => setNewItemEkPrice(e.target.value)}
              className="settings-input settings-price-input"
              placeholder="EK Preis (optional)"
              min="0"
              step="0.01"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="settings-add-button"
            >
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="settings-items-section">
          <h3>Vorhandene Items ({catalogItems.length})</h3>
          {catalogItems.length === 0 ? (
            <p className="settings-empty">Keine Items vorhanden. Fügen Sie das erste Item hinzu.</p>
          ) : (
            <div className="settings-items-list">
              {catalogItems.map((item) => (
                <div key={item.id} className="settings-item-row">
                  {editingItem === item.id ? (
                    <>
                      <input
                        type="text"
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        className="settings-edit-input"
                      />
                      <input
                        type="number"
                        value={editItemPrice}
                        onChange={(e) => setEditItemPrice(e.target.value)}
                        className="settings-edit-input settings-price-input"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        value={editItemEkPrice}
                        onChange={(e) => setEditItemEkPrice(e.target.value)}
                        className="settings-edit-input settings-price-input"
                        placeholder="EK Preis"
                        min="0"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="settings-save-button"
                      >
                        Speichern
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="settings-cancel-button"
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="settings-item-name">{item.name}</span>
                      <span className="settings-item-price">€{item.price.toFixed(2)}</span>
                      <span className="settings-item-price">{item.ekPrice ? `EK: €${item.ekPrice.toFixed(2)}` : 'Kein EK Preis'}</span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="settings-edit-button"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="settings-delete-button"
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
    </>
  );

  const renderNightLeadsSection = () => (
    <>
      <h2>Night Leads Katalog</h2>
      <p className="settings-description">
        Verwalten Sie die verfügbaren Night Leads. Diese können dann im Übersicht-Formular ausgewählt werden.
      </p>

      {/* Add New Lead */}
      <div className="settings-add-section">
        <h3>Neuer Night Lead hinzufügen</h3>
        <div className="settings-add-form">
          <input
            type="text"
            value={newLeadName}
            onChange={(e) => setNewLeadName(e.target.value)}
            className="settings-input"
            placeholder="Night Lead Name"
            style={{ flex: 1 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddLead();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddLead}
            className="settings-add-button"
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div className="settings-items-section">
        <h3>Vorhandene Night Leads ({nightLeads.length})</h3>
        {nightLeads.length === 0 ? (
          <p className="settings-empty">Keine Night Leads vorhanden. Fügen Sie den ersten Night Lead hinzu.</p>
        ) : (
          <div className="settings-items-list">
            {nightLeads.map((lead) => (
              <div key={lead.id} className="settings-item-row">
                {editingLead === lead.id ? (
                  <>
                    <input
                      type="text"
                      value={editLeadName}
                      onChange={(e) => setEditLeadName(e.target.value)}
                      className="settings-edit-input"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveEditLead}
                      className="settings-save-button"
                    >
                      Speichern
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditLead}
                      className="settings-cancel-button"
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    <span className="settings-item-name" style={{ flex: 1 }}>{lead.name}</span>
                    <button
                      type="button"
                      onClick={() => handleStartEditLead(lead)}
                      className="settings-edit-button"
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLead(lead.id)}
                      className="settings-delete-button"
                    >
                      Löschen
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderScannerSection = () => (
    <>
      <h2>Printer / Scanner</h2>
      <p className="settings-description">
        Wählen Sie den Scanner aus, der für das Scannen von Dokumenten verwendet werden soll.
      </p>

      {/* Scanner Selection */}
      <div className="settings-scanner-section">
        <h3>Scanner</h3>
        <div className="settings-scanner-form">
          <select
            value={selectedScanner || ''}
            onChange={(e) => handleScannerChange(e.target.value)}
            className="settings-scanner-select"
            disabled={loadingScanners}
          >
            <option value="">-- Scanner auswählen --</option>
            {scanners.map((scanner) => (
              <option key={scanner.id} value={scanner.id}>
                {scanner.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadScanners}
            className="settings-refresh-button"
            disabled={loadingScanners}
          >
            {loadingScanners ? 'Lädt...' : 'Aktualisieren'}
          </button>
        </div>
        {selectedScanner && (
          <div className="settings-scanner-status">
            <span className={`settings-scanner-status-indicator ${scannerAvailable ? 'settings-scanner-available' : 'settings-scanner-unavailable'}`}>
              {scannerAvailable ? '✓ Verfügbar' : '✗ Nicht verfügbar'}
            </span>
          </div>
        )}
        {scanners.length === 0 && !loadingScanners && (
          <p className="settings-empty">Keine Scanner gefunden. Stellen Sie sicher, dass ein Scanner angeschlossen ist.</p>
        )}
      </div>

      {/* Scan Folder Selection */}
      <div className="settings-scanner-section">
        <h3>Scan-Ordner</h3>
        <p className="settings-description">
          Wählen Sie den Ordner aus, in dem gescannte Dateien gespeichert werden sollen. Die App überwacht diesen Ordner automatisch nach neuen Scans.
        </p>
        <div className="settings-scan-folder-form">
          <div className="settings-scan-folder-display">
            <span className="settings-scan-folder-path">
              {scanFolder || 'Kein Ordner ausgewählt'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSelectScanFolder}
            className="settings-select-folder-button"
          >
            Ordner auswählen
          </button>
        </div>
        {!scanFolder && (
          <p className="settings-empty">Bitte wählen Sie einen Ordner aus. Standardmäßig wird ~/Documents/NightclubScans verwendet.</p>
        )}
      </div>

      {/* Report Folder Selection */}
      <div className="settings-scanner-section">
        <h3>Report-Ordner</h3>
        <p className="settings-description">
          Wählen Sie den Ordner aus, in dem die Shift-Reports und gescannten PDFs gespeichert werden sollen. Für jeden Shift wird ein Unterordner erstellt.
        </p>
        <div className="settings-scan-folder-form">
          <div className="settings-scan-folder-display">
            <span className="settings-scan-folder-path">
              {reportFolder || 'Kein Ordner ausgewählt'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSelectReportFolder}
            className="settings-select-folder-button"
          >
            Ordner auswählen
          </button>
        </div>
        {!reportFolder && (
          <p className="settings-empty">Bitte wählen Sie einen Ordner aus. Standardmäßig wird ~/Documents/NightclubReports verwendet.</p>
        )}
      </div>
    </>
  );

  const renderBestueckungSection = () => {
    const bestueckungOptions = [
      { value: 'standard-konzert', label: 'Standard Konzert' },
      { value: 'standard-tranzit', label: 'Standard Tranzit' }
    ];
    const currentList = bestueckungLists[selectedBestueckung] || [];

    return (
      <>
        <h2>Backstage Kühlschrank Bestückung</h2>
        <p className="settings-description">
          Verwalten Sie die Items für jede Bestückungsoption. Diese werden im Hospitality-Formular angezeigt, wenn die entsprechende Option ausgewählt wird.
        </p>

        {/* Select Bestückung */}
        <div className="settings-add-section">
          <h3>Bestückung auswählen</h3>
          <select
            value={selectedBestueckung}
            onChange={(e) => {
              setSelectedBestueckung(e.target.value);
              setEditingBestueckungItem(null);
              setEditSelectedRiderItemId('');
              setEditItemAmount('1');
            }}
            className="settings-select"
            style={{ marginBottom: '20px' }}
          >
            {bestueckungOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Add New Item */}
        <div className="settings-add-section">
          <h3>Neues Item hinzufügen</h3>
          <div className="settings-add-form">
            <select
              value={selectedRiderItemId}
              onChange={(e) => setSelectedRiderItemId(e.target.value)}
              className="settings-select"
              style={{ flex: 1 }}
            >
              <option value="">-- Item auswählen --</option>
              {catalogItems
                .filter(item => {
                  // Filter out items that are already in the current list
                  const currentList = bestueckungLists[selectedBestueckung] || [];
                  return !currentList.some(listItem => listItem.riderItemId === item.id);
                })
                .map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (€{item.price.toFixed(2)})
                  </option>
                ))}
            </select>
            <input
              type="number"
              value={selectedItemAmount}
              onChange={(e) => setSelectedItemAmount(e.target.value)}
              className="settings-input"
              placeholder="Menge"
              min="1"
              step="1"
              style={{ width: '100px' }}
            />
            <button
              type="button"
              onClick={handleAddBestueckungItem}
              className="settings-add-button"
              disabled={!selectedRiderItemId}
            >
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="settings-items-section">
          <h3>Items für {bestueckungOptions.find(o => o.value === selectedBestueckung)?.label}</h3>
          {currentList.length === 0 ? (
            <p className="settings-empty-message">Keine Items hinzugefügt</p>
          ) : (
            <div className="settings-items-list">
              {currentList.map((listItem) => {
                const riderItem = catalogItems.find(item => item.id === listItem.riderItemId);
                if (!riderItem) return null; // Skip if item not found
                
                return (
                  <div key={listItem.riderItemId} className="settings-item">
                    {editingBestueckungItem === listItem.riderItemId ? (
                      <div className="settings-edit-form">
                        <select
                          value={editSelectedRiderItemId}
                          onChange={(e) => setEditSelectedRiderItemId(e.target.value)}
                          className="settings-select"
                          style={{ flex: 1 }}
                        >
                          <option value="">-- Item auswählen --</option>
                          {catalogItems
                            .filter(item => {
                              // Show current item and items not in the list
                              const currentList = bestueckungLists[selectedBestueckung] || [];
                              return item.id === listItem.riderItemId || !currentList.some(li => li.riderItemId === item.id);
                            })
                            .map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} (€{item.price.toFixed(2)})
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          value={editItemAmount}
                          onChange={(e) => setEditItemAmount(e.target.value)}
                          className="settings-input"
                          placeholder="Menge"
                          min="1"
                          step="1"
                          style={{ width: '100px' }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveEditBestueckungItem}
                          className="settings-save-button"
                          disabled={!editSelectedRiderItemId}
                        >
                          Speichern
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditBestueckungItem}
                          className="settings-cancel-button"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="settings-item-name">{riderItem.name} (€{riderItem.price.toFixed(2)}) x {listItem.amount}</span>
                        <div className="settings-item-actions">
                          <button
                            type="button"
                            onClick={() => handleStartEditBestueckungItem(listItem.riderItemId, listItem.amount)}
                            className="settings-edit-button"
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBestueckungItem(listItem.riderItemId)}
                            className="settings-delete-button"
                          >
                            Löschen
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const handleResetAllData = async () => {
    const confirmed = window.confirm(
      'WARNUNG: Möchten Sie wirklich ALLE Einstellungen und Daten zurücksetzen?\n\n' +
      'Dies wird gelöscht:\n' +
      '• Alle Rider Extras Items\n' +
      '• Alle Night Leads\n' +
      '• Scanner-Auswahl\n' +
      '• Scan- und Report-Ordner\n' +
      '• Tech-Namen\n' +
      '• Alle Templates\n' +
      '• Alle Bestückungslisten\n' +
      '• Alle Shift-Daten\n\n' +
      'Diese Aktion kann nicht rückgängig gemacht werden!'
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirmed = window.confirm(
      'Sind Sie ABSOLUT sicher? Diese Aktion kann NICHT rückgängig gemacht werden!'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      if (window.electronAPI && window.electronAPI.resetAllData) {
        const result = await window.electronAPI.resetAllData();
        if (result.success) {
          alert('Alle Einstellungen und Daten wurden erfolgreich zurückgesetzt. Die Seite wird neu geladen.');
          // Reload all data
          loadItems();
          loadNightLeads();
          loadScanners();
          loadSelectedScanner();
          loadScanFolder();
          loadReportFolder();
          loadTemplates();
          loadBestueckungLists();
          // Optionally reload the page
          window.location.reload();
        } else {
          alert('Fehler beim Zurücksetzen: ' + (result.error || 'Unbekannter Fehler'));
        }
      } else {
        alert('Fehler: Electron API nicht verfügbar.');
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Fehler beim Zurücksetzen: ' + error.message);
    }
  };

  const renderTemplatesSection = () => (
    <>
      <div className="settings-section">
        <h2>Templates</h2>
        <p className="settings-description">
          Laden Sie PDF-Templates hoch, die beim Drucken neben den Scan-Komponenten verwendet werden können.
        </p>
      </div>

      {/* Securityzettel Template */}
      <div className="settings-scanner-section">
        <h3>Secuzettel Template</h3>
        <p className="settings-description">
          Template für Securityzettel-Drucke
        </p>
        <div className="settings-template-form">
          <div className="settings-template-display">
            <span className="settings-template-path">
              {templates.securityzettel ? templates.securityzettel.split('/').pop() : 'Kein Template hochgeladen'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUploadTemplate('securityzettel')}
            className="settings-upload-template-button"
          >
            Template hochladen
          </button>
        </div>
      </div>

      {/* Handtuchzettel Template */}
      <div className="settings-scanner-section">
        <h3>Handtuchzettel Template</h3>
        <p className="settings-description">
          Template für Handtuchzettel-Drucke
        </p>
        <div className="settings-template-form">
          <div className="settings-template-display">
            <span className="settings-template-path">
              {templates.handtuchzettel ? templates.handtuchzettel.split('/').pop() : 'Kein Template hochgeladen'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUploadTemplate('handtuchzettel')}
            className="settings-upload-template-button"
          >
            Template hochladen
          </button>
        </div>
      </div>

      {/* Technikzettel Template */}
      <div className="settings-scanner-section">
        <h3>Technikzettel Template</h3>
        <p className="settings-description">
          Template für Technikzettel-Drucke
        </p>
        <div className="settings-template-form">
          <div className="settings-template-display">
            <span className="settings-template-path">
              {templates.technikzettel ? templates.technikzettel.split('/').pop() : 'Kein Template hochgeladen'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUploadTemplate('technikzettel')}
            className="settings-upload-template-button"
          >
            Template hochladen
          </button>
        </div>
      </div>

      {/* Übersichtzettel Template */}
      <div className="settings-scanner-section">
        <h3>Übersichtzettel Template</h3>
        <p className="settings-description">
          Template für Übersichtzettel-Drucke
        </p>
        <div className="settings-template-form">
          <div className="settings-template-display">
            <span className="settings-template-path">
              {templates.uebersichtzettel ? templates.uebersichtzettel.split('/').pop() : 'Kein Template hochgeladen'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUploadTemplate('uebersichtzettel')}
            className="settings-upload-template-button"
          >
            Template hochladen
          </button>
        </div>
      </div>
    </>
  );

  const renderResetSection = () => (
    <>
      <div className="settings-section">
        <h2>Alle Daten zurücksetzen</h2>
        <p className="settings-description" style={{ color: '#d32f2f', fontWeight: 'bold' }}>
          ⚠️ WARNUNG: Diese Aktion kann nicht rückgängig gemacht werden!
        </p>
        <p className="settings-description">
          Setzen Sie alle Einstellungen und Daten auf die Standardwerte zurück. Dies umfasst:
        </p>
        <ul className="settings-description" style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Alle Rider Extras Items</li>
          <li>Alle Night Leads</li>
          <li>Scanner-Auswahl</li>
          <li>Scan- und Report-Ordner</li>
          <li>Tech-Namen (Sound Engineer & Lighting Tech)</li>
          <li>Alle Templates</li>
          <li>Alle Bestückungslisten</li>
          <li>Alle aktuellen Shift-Daten</li>
        </ul>
        <div style={{ marginTop: '30px' }}>
          <button
            type="button"
            onClick={handleResetAllData}
            className="settings-delete-button"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Alle Daten zurücksetzen
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="form-container">
      <div className="settings-container">
        {/* Settings Sub-Sidebar */}
        <aside className="settings-sidebar">
          <nav className="settings-sidebar-nav">
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'rider' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('rider')}
            >
              Rider
            </button>
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'night-leads' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('night-leads')}
            >
              Night Leads
            </button>
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'scanner' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('scanner')}
            >
              Printer / Scanner
            </button>
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'bestueckung' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('bestueckung')}
            >
              Bestückung
            </button>
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('templates')}
            >
              Templates
            </button>
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'reset' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('reset')}
            >
              Reset
            </button>
          </nav>
        </aside>

        {/* Settings Content */}
        <div className="settings-content">
          <div className="settings-form">
            {activeSettingsSection === 'rider' ? renderRiderSection() : 
             activeSettingsSection === 'night-leads' ? renderNightLeadsSection() : 
             activeSettingsSection === 'bestueckung' ? renderBestueckungSection() :
             activeSettingsSection === 'templates' ? renderTemplatesSection() :
             activeSettingsSection === 'reset' ? renderResetSection() :
             renderScannerSection()}
          </div>
        </div>
      </div>
    </div>
  );
}

