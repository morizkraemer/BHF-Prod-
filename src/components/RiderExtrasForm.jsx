const { useState, useEffect } = React;

function RiderExtrasForm({ formData, onDataChange }) {
  const [items, setItems] = useState(formData?.items || [{ amount: '', text: '', price: '', discount: '', originalPrice: '', ekPrice: null, checked: false }]);
  const [standardbestueckung, setStandardbestueckung] = useState(formData?.standardbestueckung || '');
  const [getInCatering, setGetInCatering] = useState(formData?.getInCatering || false);
  const [dinner, setDinner] = useState(formData?.dinner || false);
  const [buyout, setBuyout] = useState(formData?.buyout || false);
  const [buyoutProvider, setBuyoutProvider] = useState(formData?.buyoutProvider || '');
  const [buyoutPeople, setBuyoutPeople] = useState(formData?.buyoutPeople || '');
  const [buyoutPerPerson, setBuyoutPerPerson] = useState(formData?.buyoutPerPerson || '');
  const [scannedDocuments, setScannedDocuments] = useState(formData?.scannedDocuments || []);
  const [purchaseReceipts, setPurchaseReceipts] = useState(formData?.purchaseReceipts || []);
  const [catalogItems, setCatalogItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState({});
  const [filteredSuggestions, setFilteredSuggestions] = useState({});

  const discountOptions = [
    { value: '50', label: '50%' },
    { value: '75', label: '75%' },
    { value: '100', label: '100%' },
    { value: 'EK', label: 'EK' }
  ];

  const standardbestueckungOptions = [
    { value: '', label: 'None' },
    { value: 'standard-konzert', label: 'Standard Konzert' },
    { value: 'standard-tranzit', label: 'Standard Tranzit' }
  ];

  // Load catalog items on mount
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getRiderItems) {
      window.electronAPI.getRiderItems().then(items => {
        setCatalogItems(items || []);
      });
    }
  }, []);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ 
        items, 
        standardbestueckung,
        getInCatering,
        dinner,
        buyout,
        buyoutProvider,
        buyoutPeople,
        buyoutPerPerson,
        scannedDocuments,
        purchaseReceipts
      });
    }
  }, [items, standardbestueckung, getInCatering, dinner, buyout, buyoutProvider, buyoutPeople, buyoutPerPerson, scannedDocuments, purchaseReceipts]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [items]); // Re-initialize icons when items change

  // Calculate buyout total
  const buyoutTotal = buyoutPeople && buyoutPerPerson 
    ? (parseFloat(buyoutPeople) * parseFloat(buyoutPerPerson)).toFixed(2)
    : '0.00';

  // Handle buyout checkbox - disable dinner when buyout is checked
  const handleBuyoutChange = (checked) => {
    setBuyout(checked);
    if (checked) {
      setDinner(false); // Uncheck dinner when buyout is checked
    }
  };

  // Handle dinner checkbox - disable buyout when dinner is checked
  const handleDinnerChange = (checked) => {
    setDinner(checked);
    if (checked) {
      setBuyout(false); // Uncheck buyout when dinner is checked
    }
  };

  const handleAmountChange = (index, value) => {
    const newItems = [...items];
    newItems[index].amount = value;
    setItems(newItems);
  };

  const handleTextChange = (index, value) => {
    const newItems = [...items];
    newItems[index].text = value;
    setItems(newItems);

    // Show suggestions if there are matching catalog items
    if (value.length > 0 && catalogItems.length > 0) {
      const filtered = catalogItems.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      if (filtered.length > 0) {
        setFilteredSuggestions(prev => ({ ...prev, [index]: filtered }));
        setShowSuggestions(prev => ({ ...prev, [index]: true }));
      } else {
        setShowSuggestions(prev => ({ ...prev, [index]: false }));
      }
    } else {
      setShowSuggestions(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSelectCatalogItem = (index, catalogItem) => {
    const newItems = [...items];
    newItems[index].text = catalogItem.name;
    const originalPrice = catalogItem.price;
    newItems[index].originalPrice = originalPrice.toString();
    newItems[index].ekPrice = catalogItem.ekPrice || null;
    
    // Apply discount if one is set
    if (newItems[index].discount === 'EK' && catalogItem.ekPrice) {
      newItems[index].price = catalogItem.ekPrice.toString();
    } else if (newItems[index].discount) {
      const discountPercent = parseFloat(newItems[index].discount);
      newItems[index].price = (originalPrice * (1 - discountPercent / 100)).toFixed(2);
    } else {
      newItems[index].price = originalPrice.toString();
    }
    setItems(newItems);
    setShowSuggestions(prev => ({ ...prev, [index]: false }));
  };

  const handlePriceChange = (index, value) => {
    const newItems = [...items];
    newItems[index].price = value;
    // Store as original price if no discount is applied
    if (!newItems[index].discount) {
      newItems[index].originalPrice = value;
    }
    setItems(newItems);
  };

  const handleDiscountChange = (index, discountValue) => {
    const newItems = [...items];
    newItems[index].discount = discountValue;
    
    // Store current price as original if not already stored
    if (!newItems[index].originalPrice && newItems[index].price) {
      newItems[index].originalPrice = newItems[index].price;
    }
    
    // Calculate discounted price
    if (discountValue === 'EK') {
      // Use EK price if available
      if (newItems[index].ekPrice) {
        newItems[index].price = newItems[index].ekPrice.toString();
      } else {
        // Keep current price if no EK price available
        newItems[index].discount = '';
      }
    } else if (discountValue && newItems[index].originalPrice) {
      const discountPercent = parseFloat(discountValue);
      const originalPrice = parseFloat(newItems[index].originalPrice);
      if (!isNaN(originalPrice)) {
        newItems[index].price = (originalPrice * (1 - discountPercent / 100)).toFixed(2);
      }
    } else if (!discountValue && newItems[index].originalPrice) {
      // Reset to original price if discount is removed
      newItems[index].price = newItems[index].originalPrice;
    }
    
    setItems(newItems);
  };

  // Calculate total for a single item
  const calculateItemTotal = (item) => {
    const amount = parseFloat(item.amount) || 0;
    const price = parseFloat(item.price) || 0;
    return (amount * price).toFixed(2);
  };

  // Check if EK option should be disabled for an item
  const isEkDisabled = (item) => {
    // Find matching catalog item
    const catalogItem = catalogItems.find(catItem => catItem.name === item.text);
    return !catalogItem || !catalogItem.ekPrice;
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setScannedDocuments(updatedDocuments);
  };

  const handlePurchaseReceiptsChange = (updatedDocuments) => {
    setPurchaseReceipts(updatedDocuments);
  };

  const handleCheckboxChange = (index) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
  };

  const handleAddLine = () => {
    setItems([...items, { amount: '', text: '', price: '', discount: '', originalPrice: '', ekPrice: null, checked: false }]);
  };

  const handleRemoveLine = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  return (
    <div className="form-container">
      <div className="rider-extras-form">
        {/* Get In Catering Section */}
        <div className="get-in-catering-section">
          <div className="catering-header-row">
            <div className="catering-checkboxes-wrapper">
              <div className="catering-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={getInCatering}
                    onChange={(e) => {
                      setGetInCatering(e.target.checked);
                      if (!e.target.checked) {
                        // Reset dinner and buyout when unchecked
                        setDinner(false);
                        setBuyout(false);
                      }
                    }}
                    className="get-in-catering-checkbox"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Get In Catering</span>
                </label>

                <label className={`checkbox-label ${buyout ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={dinner}
                    onChange={(e) => handleDinnerChange(e.target.checked)}
                    disabled={buyout}
                    className="dinner-checkbox"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Dinner</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={buyout}
                    onChange={(e) => handleBuyoutChange(e.target.checked)}
                    disabled={dinner}
                    className="buyout-checkbox"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Buyout</span>
                </label>
              </div>
            </div>

            {/* Backstage Kuehlschrank Select */}
            <div className="standardbestueckung-section">
              <label htmlFor="standardbestueckung" className="standardbestueckung-label">
                Backstage Kühlschrank
              </label>
              <select
                id="standardbestueckung"
                value={standardbestueckung}
                onChange={(e) => setStandardbestueckung(e.target.value)}
                className="standardbestueckung-select"
              >
                {standardbestueckungOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`buyout-details ${!buyout ? 'disabled' : ''}`}>
            <div className="buyout-details-row">
              <div className="buyout-provider-section">
                <select
                  id="buyoutProvider"
                  value={buyoutProvider}
                  onChange={(e) => setBuyoutProvider(e.target.value)}
                  disabled={!buyout}
                  className="buyout-provider-select"
                >
                  <option value="">Provider</option>
                  <option value="uber-bahnhof-pauli">Uber Bahnhof Pauli</option>
                  <option value="uber-agentur">Uber Agentur</option>
                </select>
              </div>
              <div className="buyout-fields">
                <div className="buyout-field">
                  <input
                    type="number"
                    id="buyoutPeople"
                    value={buyoutPeople}
                    onChange={(e) => setBuyoutPeople(e.target.value)}
                    disabled={!buyout}
                    min="0"
                    placeholder="Anzahl Personen"
                  />
                </div>
                <div className="buyout-field">
                  <input
                    type="number"
                    id="buyoutPerPerson"
                    value={buyoutPerPerson}
                    onChange={(e) => setBuyoutPerPerson(e.target.value)}
                    disabled={!buyout}
                    min="0"
                    step="0.01"
                    placeholder="Buyout pro Person"
                  />
                </div>
                <div className="buyout-total">
                  <span className="buyout-total-label">Total:</span>
                  <span className="buyout-total-amount">€{buyoutTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extras Section */}
        <div className="rider-extras-items-section">
          <h3 className="rider-extras-section-header">Extras</h3>
          {/* Column Headers */}
          <div className="rider-extras-header">
            <div className="rider-extras-header-checkbox">
              Bon <i data-lucide="check" style={{ width: '14px', height: '14px', display: 'inline-block', marginLeft: '4px' }}></i>
            </div>
            <div className="rider-extras-header-amount">Anzahl</div>
            <div className="rider-extras-header-name">Name</div>
            <div className="rider-extras-header-price">Preis</div>
            <div className="rider-extras-header-discount">Rabatt</div>
            <div className="rider-extras-header-sum">Summe</div>
            <div className="rider-extras-header-actions"></div>
          </div>

          {/* Items List */}
          {items.map((item, index) => (
            <div key={index} className="rider-extras-line">
              <div className="rider-extras-checkbox-wrapper">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleCheckboxChange(index)}
                    className="rider-extras-checkbox"
                  />
                  <span className="checkbox-custom"></span>
                </label>
              </div>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                className="rider-extras-amount"
                placeholder="Anzahl"
                min="0"
              />
              <div className="rider-extras-input-wrapper">
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  onFocus={() => {
                    if (item.text.length > 0 && catalogItems.length > 0) {
                      const filtered = catalogItems.filter(catItem =>
                        catItem.name.toLowerCase().includes(item.text.toLowerCase())
                      );
                      if (filtered.length > 0) {
                        setFilteredSuggestions(prev => ({ ...prev, [index]: filtered }));
                        setShowSuggestions(prev => ({ ...prev, [index]: true }));
                      }
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click
                    setTimeout(() => {
                      setShowSuggestions(prev => ({ ...prev, [index]: false }));
                    }, 200);
                  }}
                  className="rider-extras-input"
                  placeholder="Extra item..."
                />
                {showSuggestions[index] && filteredSuggestions[index] && (
                  <div className="suggestions-dropdown">
                    {filteredSuggestions[index].map((catItem) => (
                      <div
                        key={catItem.id}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCatalogItem(index, catItem);
                        }}
                      >
                        <span className="suggestion-name">{catItem.name}</span>
                        <span className="suggestion-price">€{catItem.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={item.price}
                onChange={(e) => handlePriceChange(index, e.target.value)}
                className="rider-extras-price"
                placeholder="Preis"
                min="0"
                step="0.01"
              />
              <select
                value={item.discount || ''}
                onChange={(e) => handleDiscountChange(index, e.target.value)}
                className="rider-extras-discount"
              >
                <option value="">--</option>
                {discountOptions.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value === 'EK' && isEkDisabled(item)}
                    style={option.value === 'EK' && isEkDisabled(item) ? { color: '#999', fontStyle: 'italic' } : {}}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="rider-extras-sum">
                €{calculateItemTotal(item)}
              </div>
              <div className="rider-extras-controls">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(index)}
                    className="remove-line-button"
                    title="Remove line"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddLine}
            className="add-line-button"
          >
            + Add Item
          </button>
        </div>

        {/* Scanner Sections */}
        <div className="scanner-boxes-container">
          <div className="scanner-box">
            <DocumentScanner
              scannedDocuments={scannedDocuments}
              onDocumentsChange={handleDocumentsChange}
              showScannedList={true}
              className="rider-extras-scanner"
              defaultSource="glass"
              title="Handtuchzettel scannen"
              scanName="Handtuchzettel"
              templateKey="handtuchzettel"
            />
          </div>

          <div className="scanner-box">
            <DocumentScanner
              scannedDocuments={purchaseReceipts}
              onDocumentsChange={handlePurchaseReceiptsChange}
              showScannedList={true}
              className="rider-extras-scanner"
              defaultSource="glass"
              title="Einkaufsbeleg scannen"
              scanName="Einkaufsbeleg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

