const { useState, useEffect } = React;

function SettingsForm() {
  const [activeSettingsSection, setActiveSettingsSection] = useState('rider');
  const [catalogItems, setCatalogItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [nightLeads, setNightLeads] = useState([]);
  const [newLeadName, setNewLeadName] = useState('');
  const [editingLead, setEditingLead] = useState(null);
  const [editLeadName, setEditLeadName] = useState('');
  const [scanners, setScanners] = useState([]);
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [loadingScanners, setLoadingScanners] = useState(false);
  const [scanFolder, setScanFolder] = useState(null);

  useEffect(() => {
    loadItems();
    loadNightLeads();
    loadScanners();
    loadSelectedScanner();
    loadScanFolder();
  }, []);

  const loadScanFolder = async () => {
    if (window.electronAPI && window.electronAPI.getScanFolder) {
      const folder = await window.electronAPI.getScanFolder();
      setScanFolder(folder);
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
        price: price
      });
      setNewItemName('');
      setNewItemPrice('');
      loadItems();
    }
  };

  const handleStartEdit = (item) => {
    setEditingItem(item.id);
    setEditItemName(item.name);
    setEditItemPrice(item.price.toString());
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
        price: price
      });
      setEditingItem(null);
      setEditItemName('');
      setEditItemPrice('');
      loadItems();
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditItemName('');
    setEditItemPrice('');
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
        Verwalten Sie die verfügbaren Night Leads. Diese können dann im Uebersicht-Formular ausgewählt werden.
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
          </nav>
        </aside>

        {/* Settings Content */}
        <div className="settings-content">
          <div className="settings-form">
            {activeSettingsSection === 'rider' ? renderRiderSection() : 
             activeSettingsSection === 'night-leads' ? renderNightLeadsSection() : 
             renderScannerSection()}
          </div>
        </div>
      </div>
    </div>
  );
}

