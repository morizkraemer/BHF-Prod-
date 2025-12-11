const { useState, useEffect } = React;

function SettingsForm() {
  const [catalogItems, setCatalogItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    if (window.electronAPI && window.electronAPI.getRiderItems) {
      const items = await window.electronAPI.getRiderItems();
      setCatalogItems(items || []);
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

  return (
    <div className="form-container">
      <div className="settings-form">
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
      </div>
    </div>
  );
}

