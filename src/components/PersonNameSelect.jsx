const { useState, useEffect, useRef } = React;

const SIMILARITY_THRESHOLD = 0.6;
const MAX_SIMILAR = 5;

function PersonNameSelect({ value = '', onChange, getNames, addName, placeholder = 'Name *', className = '', required = false, disabled = false }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [catalog, setCatalog] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastSelected, setLastSelected] = useState(value || '');
  const [pendingAddName, setPendingAddName] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
    setLastSelected(value || '');
  }, [value]);

  const loadCatalog = () => {
    if (!getNames) return;
    const result = getNames();
    if (result && typeof result.then === 'function') {
      result.then((list) => setCatalog(Array.isArray(list) ? list : []));
    } else {
      setCatalog(Array.isArray(result) ? result : []);
    }
  };

  useEffect(() => {
    if (isOpen) loadCatalog();
  }, [isOpen]);

  const trimmed = (inputValue || '').trim().toLowerCase();
  const matches = trimmed.length === 0
    ? catalog
    : catalog.filter((item) => (item.name || '').trim().toLowerCase().includes(trimmed));
  const similar = window.NameSimilarity && trimmed.length > 0 && matches.length === 0
    ? window.NameSimilarity.findSimilarNames(inputValue.trim(), catalog, SIMILARITY_THRESHOLD, MAX_SIMILAR)
    : [];
  const isInCatalog = catalog.some((item) => (item.name || '').trim().toLowerCase() === trimmed);
  const showAddOption = trimmed.length > 0 && !isInCatalog;

  const handleSelect = (name) => {
    setInputValue(name);
    setLastSelected(name);
    if (onChange) onChange(name);
    setIsOpen(false);
  };

  const handleAddPerson = async () => {
    const nameToAdd = (inputValue || '').trim();
    if (!nameToAdd || !addName) return;
    if (similar.length > 0) {
      setPendingAddName(nameToAdd);
      return;
    }
    try {
      const result = await addName(nameToAdd);
      if (result && result.name) {
        loadCatalog();
        handleSelect(result.name);
      }
    } catch (err) {
      console.error('Add person error:', err);
    }
  };

  const pendingAddNameRef = useRef(null);
  useEffect(() => {
    if (pendingAddName === null) return;
    if (pendingAddNameRef.current === pendingAddName) return;
    pendingAddNameRef.current = pendingAddName;
    const nameToAdd = pendingAddName;
    const similarNames = window.NameSimilarity
      ? window.NameSimilarity.findSimilarNames(nameToAdd, catalog, SIMILARITY_THRESHOLD, MAX_SIMILAR)
      : [];
    const message = similarNames.length > 0
      ? `Es gibt ähnliche Einträge (z. B. ${similarNames[0].name}). Trotzdem neue Person hinzufügen?`
      : `Neue Person "${nameToAdd}" hinzufügen?`;
    const doAdd = () => {
      pendingAddNameRef.current = null;
      setPendingAddName(null);
      addName(nameToAdd).then((result) => {
        if (result && result.name) {
          loadCatalog();
          handleSelect(result.name);
        }
      }).catch((err) => console.error('Add person error:', err));
    };
    const onCancel = () => {
      pendingAddNameRef.current = null;
      setPendingAddName(null);
    };
    if (window.electronAPI && window.electronAPI.showMessageBox) {
      window.electronAPI.showMessageBox({
        type: 'question',
        buttons: ['Abbrechen', 'Hinzufügen'],
        defaultId: 1,
        cancelId: 0,
        title: 'Person hinzufügen',
        message
      }).then(({ response }) => {
        if (response === 1) doAdd();
        else onCancel();
      });
    } else {
      if (window.confirm(message)) doAdd();
      else onCancel();
    }
  }, [pendingAddName]);

  const handleBlur = () => {
    setTimeout(() => {
      if (!containerRef.current || !document.activeElement) return;
      if (containerRef.current.contains(document.activeElement)) return;
      setIsOpen(false);
      if (trimmed.length > 0 && !isInCatalog) {
        setInputValue(lastSelected);
        if (onChange) onChange(lastSelected);
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(lastSelected);
      if (onChange) onChange(lastSelected);
    }
  };

  return (
    <div className="person-name-select-wrapper" ref={containerRef}>
      <input
        type="text"
        className={`person-name-select-input ${className}`.trim()}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => !disabled && setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        disabled={disabled}
      />
      {isOpen && !disabled && (
        <div className="person-name-select-dropdown">
          {matches.length > 0 && (
            <ul className="person-name-select-list">
              {matches.map((item) => (
                <li
                  key={item.id}
                  className="person-name-select-option"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(item.name); }}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
          {matches.length === 0 && trimmed.length > 0 && similar.length > 0 && (
            <div className="person-name-select-similar">
              <div className="person-name-select-similar-label">Ähnlich:</div>
              <ul className="person-name-select-list">
                {similar.map((item) => (
                  <li
                    key={item.id}
                    className="person-name-select-option"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(item.name); }}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showAddOption && (
            <button
              type="button"
              className="person-name-select-add"
              onMouseDown={(e) => { e.preventDefault(); handleAddPerson(); }}
            >
              Person hinzufügen: {inputValue.trim()}
            </button>
          )}
          {isOpen && trimmed.length === 0 && catalog.length === 0 && (
            <div className="person-name-select-empty">Bitte Namen eingeben</div>
          )}
        </div>
      )}
    </div>
  );
}

window.PersonNameSelect = PersonNameSelect;
