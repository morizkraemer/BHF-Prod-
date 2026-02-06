import { useState, useRef, useEffect } from 'react';

const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

export default function MultiSelectDropdown({
  label,
  options = [],
  selected = [],
  onChange,
  searchPlaceholder = 'Suchen…',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((opt) =>
    (opt ?? '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter((x) => x !== opt)
      : [...selected, opt];
    onChange(next);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          padding: '6px 10px',
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {selected.length === 0 ? label : `${label} (${selected.length})`} ▾
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => {
              setOpen(false);
              setSearch('');
            }}
            aria-hidden
          />
          <div
            role="listbox"
            style={{
              position: 'absolute',
              left: 0,
              top: '100%',
              marginTop: 4,
              minWidth: 200,
              maxHeight: 280,
              padding: 8,
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 11,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              style={inputStyle}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{ overflowY: 'auto', maxHeight: 220 }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: 8, color: '#666', fontSize: 13 }}>Keine Treffer</div>
              ) : (
                filteredOptions.map((opt) => (
                  <label
                    key={opt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => toggle(opt)}
                    />
                    {opt}
                  </label>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
