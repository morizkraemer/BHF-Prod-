const { useState, useEffect } = React;

function SettingsForm() {
  const [activeSettingsSection, setActiveSettingsSection] = useState('rider');
  const [catalogItems, setCatalogItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemEkPrice, setNewItemEkPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Extra');
  const [editingItem, setEditingItem] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemEkPrice, setEditItemEkPrice] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('Extra');
  const [cateringPrices, setCateringPrices] = useState({
    warmPerPerson: '',
    coldPerPerson: ''
  });
  const [pauschalePrices, setPauschalePrices] = useState({
    standard: '',
    longdrinks: '',
    shots: ''
  });
  const [scanners, setScanners] = useState([]);
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [loadingScanners, setLoadingScanners] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [scanFolder, setScanFolder] = useState(null);
  const [reportFolder, setReportFolder] = useState(null);
  const [einkaufsbelegeFolder, setEinkaufsbelegeFolder] = useState(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [templates, setTemplates] = useState({
    securityzettel: null,
    handtuchzettel: null,
    technikzettel: null,
    uebersichtzettel: null,
    kassenzettel: null,
    gaesteliste: null
  });
  const [bestueckungLists, setBestueckungLists] = useState({
    'standard-konzert': [],
    'standard-tranzit': []
  });
  const [bestueckungTotalPrices, setBestueckungTotalPrices] = useState({
    'standard-konzert': '',
    'standard-tranzit': ''
  });
  const [bestueckungPricingTypes, setBestueckungPricingTypes] = useState({
    'standard-konzert': 'pauschale',
    'standard-tranzit': 'pauschale'
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
    loadCateringPrices();
    loadPauschalePrices();
    loadScanners();
    loadBestueckungTotalPrices();
    loadBestueckungPricingTypes();
    loadSelectedScanner();
    loadServerUrl();
    loadScanFolder();
    loadReportFolder();
    loadEinkaufsbelegeFolder();
    loadTemplates();
    loadBestueckungLists();
    checkScannerAvailability();
    
    // Check scanner availability periodically
    const interval = setInterval(checkScannerAvailability, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadServerUrl = async () => {
    if (window.electronAPI && window.electronAPI.getServerUrl) {
      const url = await window.electronAPI.getServerUrl();
      setServerUrl(url || '');
    }
  };

  const handleSaveServerUrl = async () => {
    if (window.electronAPI && window.electronAPI.setServerUrl) {
      await window.electronAPI.setServerUrl(serverUrl);
    }
  };

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

  const loadEinkaufsbelegeFolder = async () => {
    if (window.electronAPI && window.electronAPI.getEinkaufsbelegeFolder) {
      const folder = await window.electronAPI.getEinkaufsbelegeFolder();
      setEinkaufsbelegeFolder(folder);
    }
  };

  const loadTemplates = async () => {
    if (window.electronAPI && window.electronAPI.getTemplate) {
      const securityzettel = await window.electronAPI.getTemplate('securityzettel');
      const handtuchzettel = await window.electronAPI.getTemplate('handtuchzettel');
      const technikzettel = await window.electronAPI.getTemplate('technikzettel');
      const uebersichtzettel = await window.electronAPI.getTemplate('uebersichtzettel');
      const kassenzettel = await window.electronAPI.getTemplate('kassenzettel');
      const gaesteliste = await window.electronAPI.getTemplate('gaesteliste');
      setTemplates({
        securityzettel,
        handtuchzettel,
        technikzettel,
        uebersichtzettel,
        kassenzettel,
        gaesteliste
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

  const handleSelectEinkaufsbelegeFolder = async () => {
    if (window.electronAPI && window.electronAPI.setEinkaufsbelegeFolder) {
      const folder = await window.electronAPI.setEinkaufsbelegeFolder();
      if (folder) {
        setEinkaufsbelegeFolder(folder);
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

  const loadCateringPrices = async () => {
    if (window.electronAPI && window.electronAPI.getCateringPrices) {
      const prices = await window.electronAPI.getCateringPrices();
      setCateringPrices(prices || { warmPerPerson: '', coldPerPerson: '' });
    }
  };

  const handleSaveCateringPrices = async () => {
    if (window.electronAPI && window.electronAPI.saveCateringPrices) {
      await window.electronAPI.saveCateringPrices(cateringPrices);
      alert('Catering Preise gespeichert');
    }
  };

  const loadPauschalePrices = async () => {
    if (window.electronAPI && window.electronAPI.getPauschalePrices) {
      const prices = await window.electronAPI.getPauschalePrices();
      setPauschalePrices(prices || { standard: '', longdrinks: '', sektCocktails: '', shots: '' });
    }
  };

  const handleSavePauschalePrices = async () => {
    if (window.electronAPI && window.electronAPI.savePauschalePrices) {
      await window.electronAPI.savePauschalePrices(pauschalePrices);
      alert('Pauschale Preise gespeichert');
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

  const loadBestueckungTotalPrices = async () => {
    if (window.electronAPI && window.electronAPI.getBestueckungTotalPrices) {
      const prices = await window.electronAPI.getBestueckungTotalPrices();
      setBestueckungTotalPrices(prices || {
        'standard-konzert': '',
        'standard-tranzit': ''
      });
    }
  };

  const loadBestueckungPricingTypes = async () => {
    if (window.electronAPI && window.electronAPI.getBestueckungPricingTypes) {
      const types = await window.electronAPI.getBestueckungPricingTypes();
      setBestueckungPricingTypes(types || {
        'standard-konzert': 'pauschale',
        'standard-tranzit': 'pauschale'
      });
    }
  };

  const handleSaveBestueckungTotalPrice = async (bestueckungKey) => {
    if (window.electronAPI && window.electronAPI.saveBestueckungTotalPrice) {
      await window.electronAPI.saveBestueckungTotalPrice(bestueckungKey, bestueckungTotalPrices[bestueckungKey]);
      alert('Gesamtpreis gespeichert');
    }
  };

  const handleSaveBestueckungPricingType = async (bestueckungKey) => {
    if (window.electronAPI && window.electronAPI.saveBestueckungPricingType) {
      await window.electronAPI.saveBestueckungPricingType(bestueckungKey, bestueckungPricingTypes[bestueckungKey]);
      alert('Preisart gespeichert');
    }
  };

  const parsePriceInput = (s) => {
    const t = String(s ?? '').trim().replace(',', '.');
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : NaN;
  };
  const formatPriceInput = (n) => (n === '' || n == null ? '' : Number(n).toFixed(2).replace('.', ','));

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      alert('Bitte Name und Preis eingeben');
      return;
    }

    const price = parsePriceInput(newItemPrice);
    if (isNaN(price) || price < 0) {
      alert('Bitte einen gültigen Preis eingeben');
      return;
    }

    if (window.electronAPI && window.electronAPI.addRiderItem) {
      await window.electronAPI.addRiderItem({
        name: newItemName.trim(),
        price: price,
        ekPrice: newItemEkPrice.trim() ? parsePriceInput(newItemEkPrice) : null,
        category: newItemCategory === 'Karte' ? 'Karte' : 'Extra'
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemEkPrice('');
      setNewItemCategory('Extra');
      loadItems();
    }
  };

  const handleStartEdit = (item) => {
    setEditingItem(item.id);
    setEditItemName(item.name);
    setEditItemPrice(formatPriceInput(item.price));
    setEditItemEkPrice(item.ekPrice != null ? formatPriceInput(item.ekPrice) : '');
    setEditItemCategory(item.category === 'Karte' ? 'Karte' : 'Extra');
  };

  const handleSaveEdit = async () => {
    if (!editItemName.trim() || !editItemPrice.trim()) {
      alert('Bitte Name und Preis eingeben');
      return;
    }

    const price = parsePriceInput(editItemPrice);
    if (isNaN(price) || price < 0) {
      alert('Bitte einen gültigen Preis eingeben');
      return;
    }

    if (window.electronAPI && window.electronAPI.updateRiderItem) {
      await window.electronAPI.updateRiderItem(editingItem, {
        name: editItemName.trim(),
        price: price,
        ekPrice: editItemEkPrice.trim() ? parsePriceInput(editItemEkPrice) : null,
        category: editItemCategory === 'Karte' ? 'Karte' : 'Extra'
      });
      setEditingItem(null);
      setEditItemName('');
      setEditItemPrice('');
      setEditItemEkPrice('');
      setEditItemCategory('Extra');
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
              type="text"
              inputMode="decimal"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="settings-input settings-price-input"
              placeholder="0,00"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
            />
            <input
              type="text"
              inputMode="decimal"
              value={newItemEkPrice}
              onChange={(e) => setNewItemEkPrice(e.target.value)}
              className="settings-input settings-price-input"
              placeholder="0,00"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="settings-input"
            >
              <option value="Karte">Karte</option>
              <option value="Extra">Extra</option>
            </select>
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
                        type="text"
                        inputMode="decimal"
                        value={editItemPrice}
                        onChange={(e) => setEditItemPrice(e.target.value)}
                        className="settings-edit-input settings-price-input"
                        placeholder="0,00"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editItemEkPrice}
                        onChange={(e) => setEditItemEkPrice(e.target.value)}
                        className="settings-edit-input settings-price-input"
                        placeholder="0,00"
                      />
                      <select
                        value={editItemCategory}
                        onChange={(e) => setEditItemCategory(e.target.value)}
                        className="settings-edit-input"
                      >
                        <option value="Karte">Karte</option>
                        <option value="Extra">Extra</option>
                      </select>
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
                      <span className="settings-item-price">{item.category === 'Karte' ? 'Karte' : 'Extra'}</span>
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

  const renderCateringPricesSection = () => (
    <>
      <h2>Catering Preise</h2>
      <p className="settings-description">
        Legen Sie die Preise pro Person für warmes Catering und kaltes Catering fest. Diese werden im PDF basierend auf der Travel Party Anzahl berechnet.
      </p>

      <div className="settings-add-section">
        <div className="settings-add-form" style={{ flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px' }}>Warm Catering Preis pro Person (€)</label>
            <input
              type="number"
              value={cateringPrices.warmPerPerson}
              onChange={(e) => setCateringPrices({ ...cateringPrices, warmPerPerson: e.target.value })}
              className="settings-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px' }}>Kalt Catering Preis pro Person (€)</label>
            <input
              type="number"
              value={cateringPrices.coldPerPerson}
              onChange={(e) => setCateringPrices({ ...cateringPrices, coldPerPerson: e.target.value })}
              className="settings-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveCateringPrices}
            className="settings-add-button"
            style={{ alignSelf: 'flex-start' }}
          >
            Speichern
          </button>
        </div>
      </div>

      <h2 style={{ marginTop: '40px' }}>Gast Pauschale Preise</h2>
      <p className="settings-description">
        Legen Sie die Preise für die verschiedenen Pauschale-Optionen fest. Diese werden im PDF verwendet, wenn Pauschale als Zahlungsart ausgewählt wurde.
      </p>

      <div className="settings-add-section">
        <div className="settings-add-form" style={{ flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px' }}>Standard Pauschale Preis (€)</label>
            <input
              type="number"
              value={pauschalePrices.standard}
              onChange={(e) => setPauschalePrices({ ...pauschalePrices, standard: e.target.value })}
              className="settings-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px' }}>Longdrinks Pauschale Preis (€)</label>
            <input
              type="number"
              value={pauschalePrices.longdrinks}
              onChange={(e) => setPauschalePrices({ ...pauschalePrices, longdrinks: e.target.value })}
              className="settings-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px' }}>Shots Pauschale Preis (€)</label>
            <input
              type="number"
              value={pauschalePrices.shots}
              onChange={(e) => setPauschalePrices({ ...pauschalePrices, shots: e.target.value })}
              className="settings-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <button
            type="button"
            onClick={handleSavePauschalePrices}
            className="settings-add-button"
            style={{ alignSelf: 'flex-start' }}
          >
            Speichern
          </button>
        </div>
      </div>
    </>
  );

  const renderScannerSection = () => (
    <>
      <h2>Printer / Scanner</h2>

      {/* Server URL (Backend API) */}
      <div className="settings-scanner-section">
        <h3>Server-URL (API)</h3>
        <p className="settings-description">
          URL des Backend-Servers (z. B. http://localhost:3001). Wenn gesetzt, werden Kataloge, Schichtdaten und Scans über den Server synchronisiert. Leer = nur lokale Speicherung.
        </p>
        <div className="settings-scan-folder-form" style={{ alignItems: 'center', gap: '8px' }}>
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            onBlur={handleSaveServerUrl}
            className="settings-input"
            placeholder="http://localhost:3001"
            style={{ flex: 1, maxWidth: '400px' }}
          />
          <button
            type="button"
            onClick={handleSaveServerUrl}
            className="settings-select-folder-button"
          >
            Speichern
          </button>
        </div>
        {serverUrl && serverUrl.trim() && (
          <p className="settings-description" style={{ marginTop: '8px' }}>
            Security-Zettel Formular (mobil/Tablet): <a href={`${serverUrl.replace(/\/$/, '')}/forms/secu`} target="_blank" rel="noopener noreferrer">{serverUrl.replace(/\/$/, '')}/forms/secu</a>
          </p>
        )}
      </div>

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
          Wählen Sie den Ordner aus, in dem die Schicht-Reports und gescannten PDFs gespeichert werden sollen. Für jede Schicht wird ein Unterordner erstellt.
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

      {/* Einkaufsbelege Folder Selection */}
      <div className="settings-scanner-section">
        <h3>Einkaufsbelege Ordner</h3>
        <p className="settings-description">
          Wählen Sie den Ordner aus, in dem Kopien der gescannten Einkaufsbelege gespeichert werden sollen. Die App erstellt automatisch Unterordner im Format {`{Jahr}-{Monat}`} (z.B. 2024-01).
        </p>
        <div className="settings-scan-folder-form">
          <div className="settings-scan-folder-display">
            <span className="settings-scan-folder-path">
              {einkaufsbelegeFolder || 'Kein Ordner ausgewählt'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSelectEinkaufsbelegeFolder}
            className="settings-select-folder-button"
          >
            Ordner auswählen
          </button>
        </div>
        {!einkaufsbelegeFolder && (
          <p className="settings-empty">Optional: Wenn kein Ordner ausgewählt ist, werden keine Kopien der Einkaufsbelege erstellt.</p>
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

        {/* Pricing Type and Price for Selected Bestückung */}
        <div className="settings-add-section">
          <h3>Preiseinstellung für {bestueckungOptions.find(o => o.value === selectedBestueckung)?.label}</h3>
          <div className="settings-add-form" style={{ flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Preisart</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`pricing-type-${selectedBestueckung}`}
                    value="pauschale"
                    checked={bestueckungPricingTypes[selectedBestueckung] === 'pauschale'}
                    onChange={(e) => setBestueckungPricingTypes({ ...bestueckungPricingTypes, [selectedBestueckung]: e.target.value })}
                  />
                  <span>Pauschale</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`pricing-type-${selectedBestueckung}`}
                    value="perPerson"
                    checked={bestueckungPricingTypes[selectedBestueckung] === 'perPerson'}
                    onChange={(e) => setBestueckungPricingTypes({ ...bestueckungPricingTypes, [selectedBestueckung]: e.target.value })}
                  />
                  <span>Pro Person</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>
                {bestueckungPricingTypes[selectedBestueckung] === 'pauschale' ? 'Pauschale Preis (€)' : 'Preis pro Person (€)'}
              </label>
              <input
                type="number"
                value={bestueckungTotalPrices[selectedBestueckung] || ''}
                onChange={(e) => setBestueckungTotalPrices({ ...bestueckungTotalPrices, [selectedBestueckung]: e.target.value })}
                className="settings-input"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                handleSaveBestueckungTotalPrice(selectedBestueckung);
                handleSaveBestueckungPricingType(selectedBestueckung);
              }}
              className="settings-add-button"
              style={{ alignSelf: 'flex-start' }}
            >
              Speichern
            </button>
          </div>
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

  const handleResetShiftData = async () => {
    const confirmed = window.confirm(
      'Möchten Sie wirklich die aktuelle Schicht zurücksetzen?\n\n' +
      'Dies wird gelöscht:\n' +
      '• Alle aktuellen Schicht-Daten\n' +
      '• Tech-Namen (Sound Engineer & Lighting Tech)\n' +
      '• Aktuelle Phase wird auf VVA zurückgesetzt\n\n' +
      'Einstellungen und Templates bleiben erhalten.'
    );

    if (!confirmed) {
      return;
    }

    try {
      if (window.electronAPI && window.electronAPI.clearShiftData) {
        const result = await window.electronAPI.clearShiftData();
        if (result.success) {
          alert('Schicht-Daten wurden erfolgreich zurückgesetzt. Die Seite wird neu geladen.');
          window.location.reload();
        } else {
          alert('Fehler beim Zurücksetzen: ' + (result.error || 'Unbekannter Fehler'));
        }
      } else {
        alert('Fehler: Electron API nicht verfügbar.');
      }
    } catch (error) {
      console.error('Error resetting shift data:', error);
      alert('Fehler beim Zurücksetzen: ' + error.message);
    }
  };

  const handleResetAllData = async () => {
    const confirmed = window.confirm(
      'WARNUNG: Möchten Sie wirklich ALLE Einstellungen und Daten zurücksetzen?\n\n' +
      'Dies wird gelöscht:\n' +
      '• Alle Rider Extras Items\n' +
      '• Scanner-Auswahl\n' +
      '• Scan-, Report- und Einkaufsbelege-Ordner\n' +
      '• Tech-Namen\n' +
      '• Alle Templates\n' +
      '• Alle Bestückungslisten\n' +
      '• Alle Schicht-Daten\n\n' +
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
          loadCateringPrices();
          loadPauschalePrices();
          loadScanners();
          loadSelectedScanner();
          loadScanFolder();
          loadReportFolder();
          loadEinkaufsbelegeFolder();
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

  const pickRandomName = (list, fallback) => {
    const names = Array.isArray(list) ? list.map((item) => (item && item.name ? item.name : '')).filter(Boolean) : [];
    if (names.length === 0) return fallback;
    return names[Math.floor(Math.random() * names.length)];
  };

  const handleFillTestData = async () => {
    const confirmed = window.confirm(
      'Möchten Sie wirklich alle Felder mit Test-Daten füllen?\n\n' +
      'Dies wird alle aktuellen Schicht-Daten überschreiben.'
    );

    if (!confirmed) {
      return;
    }

    try {
      // Load name pools and pick random names for test data
      const [secuNames, techNames, andereNames] = await Promise.all([
        window.electronAPI?.getSecuNames?.() ?? Promise.resolve([]),
        window.electronAPI?.getTechNames?.() ?? Promise.resolve([]),
        window.electronAPI?.getAndereMitarbeiterNames?.() ?? Promise.resolve([])
      ]);

      const soundName = pickRandomName(techNames, 'Hans Sound');
      const lightName = pickRandomName(techNames, 'Peter Licht');
      const secu1 = pickRandomName(secuNames, 'Security Person 1');
      const secu2 = pickRandomName(secuNames, 'Security Person 2');
      const secu3 = pickRandomName(secuNames, 'Security Person 3');
      const andere1 = pickRandomName(andereNames, 'Kasse Person 1');
      const andere2 = pickRandomName(andereNames, 'WC Person 1');
      const andere3 = pickRandomName(andereNames, 'Stage Hand 1');

      // Get current date for test data
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      // Generate comprehensive test data
      const testData = {
        uebersicht: {
          date: dateStr,
          eventName: 'Test Event 2024',
          eventType: 'konzert',
          getInTime: '14:00',
          getInTatsachlich: '14:15',
          doorsTime: '19:00',
          doorsTatsachlich: '19:10',
          travelPartyGetIn: '8',
          travelPartyTatsachlich: '8',
          konzertende: '23:00',
          konzertendeTatsachlich: '23:15',
          backstageCurfew: '01:00',
          backstageCurfewTatsachlich: '01:00',
          nightLead: 'Max Mustermann',
          agentur: 'Test Agentur GmbH',
          agenturAPName: 'Test Agentur AP',
          vva: 'VVA-12345',
          companyName: '',
          nightlinerParkplatz: 'yes',
          notes: 'Test Notizen für Übersicht'
        },
        'rider-extras': {
          items: [
            {
              amount: '2',
              text: 'Red Bull',
              price: '3.50',
              discount: '',
              originalPrice: '3.50',
              ekPrice: null,
              checked: true
            },
            {
              amount: '1',
              text: 'Wasser',
              price: '2.00',
              discount: '50',
              originalPrice: '2.00',
              ekPrice: null,
              checked: false
            },
            {
              amount: '3',
              text: 'Bier',
              price: '4.00',
              discount: '',
              originalPrice: '4.00',
              ekPrice: null,
              checked: true
            }
          ],
          standardbestueckung: 'standard-konzert',
          getInCatering: 'kalt',
          dinner: 'warm',
          buyoutProvider: '',
          buyoutGroups: [{ people: '', perPerson: '' }],
          scannedDocuments: [],
          purchaseReceipts: [],
          notes: 'Test Notizen für Rider Extras',
          customizedFridgeItems: []
        },
        tontechniker: {
          personnel: [
            { name: soundName, startTime: '13:00', endTime: '00:30', role: 'Ton/Licht' },
            { name: lightName, startTime: '15:00', endTime: '01:00', role: 'Ton/Licht' }
          ],
          scannedImages: []
        },
        secu: {
          securityPersonnel: [
            { name: secu1, startTime: '18:00', endTime: '02:00' },
            { name: secu2, startTime: '18:00', endTime: '02:00' },
            { name: secu3, startTime: '20:00', endTime: '02:00' }
          ],
          scannedDocuments: []
        },
        'andere-mitarbeiter': {
          mitarbeiter: [
            { name: andere1, startTime: '18:00', endTime: '02:00', category: 'Kasse' },
            { name: andere2, startTime: '19:00', endTime: '02:00', category: 'WC' },
            { name: andere3, startTime: '14:00', endTime: '00:00', category: 'Stage Hand' }
          ]
        },
        gaeste: {
          paymentType: 'selbstzahler',
          pauschaleOptions: {
            standard: true,
            longdrinks: false,
            shots: false
          },
          anzahlAbendkasse: '150',
          betragAbendkasse: '15.00',
          useTimeBasedPricing: false,
          abendkasseTimeSlots: [],
          gaesteGesamt: '350',
          scannedDocuments: []
        },
        kassen: {
          receipts: [],
          abrechnungen: []
        }
      };

      // Save test data
      if (window.electronAPI && window.electronAPI.saveData) {
        await window.electronAPI.saveData('currentShiftData', testData);
        alert('Test-Daten wurden erfolgreich eingefügt. Die Seite wird neu geladen.');
        window.location.reload();
      } else {
        alert('Fehler: Electron API nicht verfügbar.');
      }
    } catch (error) {
      console.error('Error filling test data:', error);
      alert('Fehler beim Füllen der Test-Daten: ' + error.message);
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

      {/* Kassenzettel Template */}
      <div className="settings-scanner-section">
        <h3>Kassenzettel Template</h3>
        <p className="settings-description">
          Template für Kassenzettel-Drucke
        </p>
        <div className="settings-template-form">
          <div className="settings-template-display">
            <span className="settings-template-path">
              {templates.kassenzettel ? templates.kassenzettel.split('/').pop() : 'Kein Template hochgeladen'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUploadTemplate('kassenzettel')}
            className="settings-upload-template-button"
          >
            Template hochladen
          </button>
        </div>
      </div>

      {/* Gästeliste (Excel) */}
      <div className="settings-scanner-section">
        <h3>Gästeliste (Excel)</h3>
        <p className="settings-description">
          Excel-Datei, die beim Klick auf „Gästeliste öffnen“ auf der Übersicht mit der Standard-App (z. B. Excel) geöffnet wird.
        </p>
        <div className="settings-template-form">
          <div className="settings-template-display">
            <span className="settings-template-path">
              {templates.gaesteliste ? templates.gaesteliste.split(/[/\\]/).pop() : 'Keine Datei ausgewählt'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUploadTemplate('gaesteliste')}
            className="settings-upload-template-button"
          >
            Datei auswählen
          </button>
        </div>
      </div>
    </>
  );

  const renderResetSection = () => (
    <>
      <div className="settings-section">
        <h2>Daten zurücksetzen</h2>
        <p className="settings-description">
          Setzen Sie Schicht-Daten oder alle Einstellungen zurück.
        </p>
        <div style={{ marginTop: '30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Test-Daten</h3>
          <p className="settings-description">
            Füllt alle Formularfelder mit Test-Daten für Testzwecke.
          </p>
          <button
            type="button"
            onClick={handleFillTestData}
            className="settings-add-button"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            Test Daten füllen
          </button>
        </div>
        <div style={{ marginTop: '30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Schicht zurücksetzen</h3>
          <p className="settings-description">
            Setzt nur die aktuellen Schicht-Daten zurück. Einstellungen und Templates bleiben erhalten.
          </p>
          <button
            type="button"
            onClick={handleResetShiftData}
            className="settings-delete-button"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            Schicht zurücksetzen
          </button>
        </div>
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Alle Daten zurücksetzen</h3>
          <p className="settings-description" style={{ color: '#d32f2f', fontWeight: 'bold' }}>
            ⚠️ WARNUNG: Diese Aktion kann nicht rückgängig gemacht werden!
          </p>
          <p className="settings-description">
            Setzen Sie alle Einstellungen und Daten auf die Standardwerte zurück. Dies umfasst:
          </p>
          <ul className="settings-description" style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>Alle Rider Extras Items</li>
            <li>Scanner-Auswahl</li>
            <li>Scan-, Report- und Einkaufsbelege-Ordner</li>
            <li>Tech-Namen (Sound Engineer & Lighting Tech)</li>
            <li>Alle Templates</li>
            <li>Alle Bestückungslisten</li>
            <li>Alle aktuellen Schicht-Daten</li>
          </ul>
          <div style={{ marginTop: '15px' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleResetAllData();
              }}
              style={{
                color: '#d32f2f',
                textDecoration: 'underline',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Alle Daten zurücksetzen
            </a>
          </div>
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
              className={`settings-sidebar-item ${activeSettingsSection === 'catering-prices' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('catering-prices')}
            >
              Catering Preise
            </button>
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'bestueckung' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('bestueckung')}
            >
              Backstage Kühlschrank
            </button>
            <button
              className={`settings-sidebar-item ${activeSettingsSection === 'scanner' ? 'active' : ''}`}
              onClick={() => setActiveSettingsSection('scanner')}
            >
              Printer / Scanner
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
             activeSettingsSection === 'catering-prices' ? renderCateringPricesSection() : 
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

