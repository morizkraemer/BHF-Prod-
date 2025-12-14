const { useState, useEffect } = React;

function RiderExtrasForm({ formData, onDataChange, highlightedFields = [], printedTemplates = {}, onTemplatePrinted }) {
  // Map display field names to field identifiers
  const fieldNameMap = {
    'Get In Catering': 'getInCatering',
    'Dinner': 'dinner',
    'Backstage Kühlschrank': 'standardbestueckung',
    'Handtuchzettel Scan': 'handtuchzettel'
  };
  
  const shouldHighlight = (fieldName) => {
    return highlightedFields.includes(fieldName);
  };
  const [items, setItems] = useState(formData?.items || [{ amount: '', text: '', price: '', discount: '', originalPrice: '', ekPrice: null, checked: false }]);
  const [standardbestueckung, setStandardbestueckung] = useState(formData?.standardbestueckung || '');
  const [getInCatering, setGetInCatering] = useState(formData?.getInCatering || '');
  const [dinner, setDinner] = useState(formData?.dinner || ''); // Can be 'no', 'warm', or 'buyout'
  const [buyoutProvider, setBuyoutProvider] = useState(formData?.buyoutProvider || '');
  const [buyoutGroups, setBuyoutGroups] = useState(formData?.buyoutGroups || [
    { people: '', perPerson: '' }
  ]);
  const [scannedDocuments, setScannedDocuments] = useState(formData?.scannedDocuments || []);
  const [purchaseReceipts, setPurchaseReceipts] = useState(formData?.purchaseReceipts || []);
  const [notes, setNotes] = useState(formData?.notes || '');
  const [catalogItems, setCatalogItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState({});
  const [filteredSuggestions, setFilteredSuggestions] = useState({});
  const [bestueckungItems, setBestueckungItems] = useState([]);
  const [customizedFridgeItems, setCustomizedFridgeItems] = useState(formData?.customizedFridgeItems || []);

  const discountOptions = [
    { value: '50', label: '50%' },
    { value: '75', label: '75%' },
    { value: '100', label: '100%' },
    { value: 'EK', label: 'EK' }
  ];

  const standardbestueckungOptions = [
    { value: '', label: '-- Bitte wählen --' },
    { value: 'leer', label: 'Leer' },
    { value: 'abgeschlossen', label: 'Abgeschlossen' },
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

  // Load bestueckung items when standardbestueckung changes
  useEffect(() => {
    if (standardbestueckung && (standardbestueckung === 'standard-konzert' || standardbestueckung === 'standard-tranzit') && window.electronAPI && window.electronAPI.getBestueckungList) {
      window.electronAPI.getBestueckungList(standardbestueckung).then(listItems => {
        // Look up the actual rider items from the catalog and include amounts
        const items = (listItems || [])
          .map(listItem => {
            const riderItem = catalogItems.find(item => item.id === listItem.riderItemId);
            if (!riderItem) return null;
            return { ...riderItem, amount: listItem.amount || 1 };
          })
          .filter(item => item !== null); // Remove any items not found in catalog
        setBestueckungItems(items);
        // Initialize customized items with the loaded items if not already set
        if (formData?.customizedFridgeItems && formData.customizedFridgeItems.length > 0) {
          setCustomizedFridgeItems(formData.customizedFridgeItems);
        } else {
          setCustomizedFridgeItems(items);
        }
      });
    } else {
      setBestueckungItems([]);
      setCustomizedFridgeItems([]);
    }
  }, [standardbestueckung, catalogItems]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ 
        items, 
        standardbestueckung,
        getInCatering,
        dinner,
        buyoutProvider,
        buyoutGroups,
        scannedDocuments,
        purchaseReceipts,
        notes,
        customizedFridgeItems
      });
    }
  }, [items, standardbestueckung, getInCatering, dinner, buyoutProvider, buyoutGroups, scannedDocuments, purchaseReceipts, notes, customizedFridgeItems]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [items, buyoutGroups]); // Re-initialize icons when items or buyoutGroups change

  // Calculate buyout total for all groups
  const buyoutTotal = buyoutGroups.reduce((total, group) => {
    if (group.people && group.perPerson) {
      return total + (parseFloat(group.people) * parseFloat(group.perPerson));
    }
    return total;
  }, 0).toFixed(2);

  const handleBuyoutGroupChange = (index, field, value) => {
    const newGroups = [...buyoutGroups];
    newGroups[index][field] = value;
    setBuyoutGroups(newGroups);
  };

  const handleAddBuyoutGroup = () => {
    setBuyoutGroups([...buyoutGroups, { people: '', perPerson: '' }]);
  };

  const handleRemoveBuyoutGroup = (index) => {
    if (buyoutGroups.length > 1) {
      const newGroups = buyoutGroups.filter((_, i) => i !== index);
      setBuyoutGroups(newGroups);
    }
  };

  const handleRemoveFridgeItem = (itemId) => {
    const updatedItems = customizedFridgeItems.filter(item => item.id !== itemId);
    setCustomizedFridgeItems(updatedItems);
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
          <div className="catering-main-layout">
            {/* Left Side: Catering Options (Radio Buttons + Buyout Details) */}
            <div className="catering-options-section">
              <h3 className="catering-section-title">Catering</h3>
              <div className="catering-radio-wrapper">
                <div className="catering-radio-group">
                <div className={`form-group form-group-catering-radio ${shouldHighlight('Get In Catering') ? 'field-highlighted-group' : ''}`}>
                  <label className="catering-radio-label">Get In Catering *</label>
                  <div className="catering-radio-buttons">
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="getInCatering"
                        value="no"
                        checked={getInCatering === 'no'}
                        onChange={(e) => {
                          const value = e.target.value;
                          setGetInCatering(value);
                          if (value === 'no') {
                            // Reset dinner when set to no
                            setDinner('');
                          }
                        }}
                        className="catering-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Nein</span>
                    </label>
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="getInCatering"
                        value="kalt"
                        checked={getInCatering === 'kalt'}
                        onChange={(e) => {
                          setGetInCatering(e.target.value);
                        }}
                        className="catering-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Kalt</span>
                    </label>
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="getInCatering"
                        value="nur-snacks"
                        checked={getInCatering === 'nur-snacks'}
                        onChange={(e) => {
                          setGetInCatering(e.target.value);
                        }}
                        className="catering-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Nur Snacks</span>
                    </label>
                  </div>
                </div>

                <div className={`form-group form-group-catering-radio ${shouldHighlight('Dinner') ? 'field-highlighted-group' : ''}`}>
                  <label className="catering-radio-label">Dinner *</label>
                  <div className="catering-radio-buttons">
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="dinner"
                        value="no"
                        checked={dinner === 'no'}
                        onChange={(e) => setDinner(e.target.value)}
                        className="catering-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Nein</span>
                    </label>
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="dinner"
                        value="warm"
                        checked={dinner === 'warm'}
                        onChange={(e) => setDinner(e.target.value)}
                        className="catering-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Warm</span>
                    </label>
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="dinner"
                        value="buyout"
                        checked={dinner === 'buyout'}
                        onChange={(e) => setDinner(e.target.value)}
                        className="catering-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Buyout</span>
                    </label>
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="dinner"
                        value="caterer"
                        checked={dinner === 'caterer'}
                        onChange={(e) => setDinner(e.target.value)}
                        className="catering-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Caterer</span>
                    </label>
                  </div>
                </div>
              </div>
              </div>

              <div className={`buyout-details ${dinner !== 'buyout' ? 'disabled' : ''}`}>
                <div className="buyout-provider-section">
                  <select
                    id="buyoutProvider"
                    value={buyoutProvider}
                    onChange={(e) => setBuyoutProvider(e.target.value)}
                    disabled={dinner !== 'buyout'}
                    className="buyout-provider-select"
                  >
                    <option value="">-- Buyout Über --</option>
                    <option value="uber-bahnhof-pauli">Uber Bahnhof Pauli</option>
                    <option value="uber-agentur">Uber Agentur</option>
                  </select>
                </div>
                {buyoutGroups.map((group, index) => (
                  <div key={index} className="buyout-group">
                    <div className="buyout-container">
                      <div className="buyout-fields">
                        <div className="form-group-paired-container">
                          <div className="form-group form-group-paired-left">
                            <label htmlFor={`buyoutPeople-${index}`}>Anzahl Personen</label>
                            <input
                              type="number"
                              id={`buyoutPeople-${index}`}
                              value={group.people}
                              onChange={(e) => handleBuyoutGroupChange(index, 'people', e.target.value)}
                              disabled={dinner !== 'buyout'}
                              className="form-input"
                              min="0"
                              placeholder="0"
                            />
                          </div>
                          <div className="form-group form-group-paired-right">
                            <label htmlFor={`buyoutPerPerson-${index}`}>Buyout pro Person</label>
                            <input
                              type="number"
                              id={`buyoutPerPerson-${index}`}
                              value={group.perPerson}
                              onChange={(e) => handleBuyoutGroupChange(index, 'perPerson', e.target.value)}
                              disabled={dinner !== 'buyout'}
                              className="form-input"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="buyout-total">
                        <span className="buyout-total-amount">
                          €{group.people && group.perPerson 
                            ? (parseFloat(group.people) * parseFloat(group.perPerson)).toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                      {buyoutGroups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBuyoutGroup(index)}
                          className="remove-line-button"
                          title="Entfernen"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {buyoutGroups.length > 1 && (
                  <div className="buyout-grand-total">
                    <span className="buyout-grand-total-amount">€{buyoutTotal}</span>
                  </div>
                )}
                <span
                  onClick={dinner === 'buyout' ? handleAddBuyoutGroup : undefined}
                  className={`buyout-add-link ${dinner !== 'buyout' ? 'disabled' : ''}`}
                  style={{ cursor: dinner === 'buyout' ? 'pointer' : 'not-allowed' }}
                >
                  <i data-lucide="plus" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}></i>
                  Weiteren Betrag hinzufügen
                </span>
              </div>
            </div>

            {/* Right Side: Fridge Select + Contents List */}
            <div className={`fridge-section ${shouldHighlight('Backstage Kühlschrank') ? 'field-highlighted-group' : ''}`}>
              <h3 className="fridge-section-title">Backstage Kühlschrank</h3>
              <select
                id="standardbestueckung"
                value={standardbestueckung}
                onChange={(e) => setStandardbestueckung(e.target.value)}
                className={`standardbestueckung-select ${shouldHighlight('Backstage Kühlschrank') ? 'field-highlighted' : ''}`}
                required
              >
                {standardbestueckungOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="fridge-contents-list">
                {customizedFridgeItems.length > 0 ? (
                  <ul className="fridge-contents-items">
                    {customizedFridgeItems.map((item) => (
                      <li key={item.id} className="fridge-contents-item">
                        <span className="fridge-item-text">
                          {item.amount}x {item.name} {item.price ? `(€${item.price.toFixed(2)})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFridgeItem(item.id)}
                          className="remove-fridge-item-button"
                          title="Item entfernen"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="fridge-contents-empty">Keine Items</p>
                )}
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

        {/* Notes Section */}
        <div className="notes-section">
          <label htmlFor="riderExtrasNotes" className="notes-label">Notizen</label>
          <textarea
            id="riderExtrasNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-textarea"
            placeholder="Zusätzliche Notizen oder Bemerkungen..."
            rows="4"
          />
        </div>

        {/* Scanner Sections */}
        <div className="scanner-boxes-container">
          <div className={`scanner-box ${shouldHighlight('Handtuchzettel Scan') ? 'field-highlighted-group' : ''}`}>
            <DocumentScanner
              scannedDocuments={scannedDocuments}
              onDocumentsChange={handleDocumentsChange}
              showScannedList={true}
              className="rider-extras-scanner"
              defaultSource="glass"
              title="Handtuchzettel scannen"
              scanName="Handtuchzettel"
              templateKey="handtuchzettel"
              printedTemplates={printedTemplates}
              onTemplatePrinted={onTemplatePrinted}
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

