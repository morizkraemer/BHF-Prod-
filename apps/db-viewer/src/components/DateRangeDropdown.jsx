import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-day-picker/style.css';

function toYYYYMMDD(date) {
  if (!date || !(date instanceof Date) || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

function fromYYYYMMDD(str) {
  if (!str || typeof str !== 'string') return undefined;
  const d = parseISO(str);
  return isValid(d) ? d : undefined;
}

export default function DateRangeDropdown({ fromDate, toDate, onChange, label = 'Datum' }) {
  const [open, setOpen] = useState(false);

  const from = fromYYYYMMDD(fromDate);
  const to = fromYYYYMMDD(toDate);
  const selected = from || to ? { from: from ?? undefined, to: to ?? undefined } : undefined;

  const handleSelect = (range) => {
    if (!range) {
      onChange({ from: '', to: '' });
      return;
    }
    onChange({
      from: toYYYYMMDD(range.from),
      to: toYYYYMMDD(range.to),
    });
  };

  const handleClear = () => {
    onChange({ from: '', to: '' });
  };

  const buttonLabel = from && to
    ? `${format(from, 'dd.MM.yyyy', { locale: de })} – ${format(to, 'dd.MM.yyyy', { locale: de })}`
    : label;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '4px 10px',
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {buttonLabel} ▾
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="rdp-root"
            style={{
              position: 'absolute',
              left: 0,
              top: '100%',
              marginTop: 4,
              padding: 8,
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 11,
              // Compact calendar
              '--rdp-day-height': '28px',
              '--rdp-day-width': '28px',
              '--rdp-day_button-height': '26px',
              '--rdp-day_button-width': '26px',
              '--rdp-nav_button-height': '1.5rem',
              '--rdp-nav_button-width': '1.5rem',
              '--rdp-nav-height': '2rem',
              fontSize: 12,
            }}
          >
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={handleSelect}
              locale={de}
            />
            <button
              type="button"
              onClick={() => {
                handleClear();
              }}
              style={{
                marginTop: 6,
                padding: '4px 10px',
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Zurücksetzen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
