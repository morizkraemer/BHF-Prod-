import { useState, useEffect, useRef } from 'react';
import { getSetting, setSetting } from '../api';

const DEBOUNCE_MS = 700;

const defaultCateringPrices = () => ({ warmPerPerson: '', coldPerPerson: '' });
const defaultBestueckungPrices = () => ({ leer: '', abgeschlossen: '', 'standard-konzert': '', 'standard-tranzit': '' });
const defaultBestueckungTypes = () => ({ leer: 'pauschale', abgeschlossen: 'pauschale', 'standard-konzert': 'pauschale', 'standard-tranzit': 'pauschale' });

const BESTUECKUNG_OPTIONS = [
  { value: 'leer', label: 'Leer' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
  { value: 'standard-konzert', label: 'Standard Konzert' },
  { value: 'standard-tranzit', label: 'Standard Tranzit' },
];

const BESTUECKUNG_NO_PRICE = ['leer', 'abgeschlossen'];

export default function Settings() {
  const [cateringPrices, setCateringPrices] = useState(defaultCateringPrices());
  const [bestueckungTotalPrices, setBestueckungTotalPrices] = useState(defaultBestueckungPrices());
  const [bestueckungPricingTypes, setBestueckungPricingTypes] = useState(defaultBestueckungTypes());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const cateringSaveTimeoutRef = useRef(null);
  const bestueckungSaveTimeoutRef = useRef(null);

  useEffect(() => {
    setError(null);
    Promise.all([
      getSetting('cateringPrices'),
      getSetting('bestueckungTotalPrices'),
      getSetting('bestueckungPricingTypes'),
    ])
      .then(([catering, prices, types]) => {
        setCateringPrices(catering != null ? { ...defaultCateringPrices(), ...catering } : defaultCateringPrices());
        setBestueckungTotalPrices(prices != null ? { ...defaultBestueckungPrices(), ...prices } : defaultBestueckungPrices());
        setBestueckungPricingTypes(types != null ? { ...defaultBestueckungTypes(), ...types } : defaultBestueckungTypes());
      })
      .catch((err) => setError(err.message || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  const scheduleSaveCatering = (nextCateringPrices) => {
    if (cateringSaveTimeoutRef.current) clearTimeout(cateringSaveTimeoutRef.current);
    cateringSaveTimeoutRef.current = setTimeout(async () => {
      setError(null);
      setMessage(null);
      try {
        await setSetting('cateringPrices', nextCateringPrices);
        setMessage('Catering Preise gespeichert');
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError(err.message || 'Fehler beim Speichern');
      }
      cateringSaveTimeoutRef.current = null;
    }, DEBOUNCE_MS);
  };

  const scheduleSaveBestueckung = (nextPrices, nextTypes) => {
    if (bestueckungSaveTimeoutRef.current) clearTimeout(bestueckungSaveTimeoutRef.current);
    bestueckungSaveTimeoutRef.current = setTimeout(async () => {
      setError(null);
      setMessage(null);
      try {
        await setSetting('bestueckungTotalPrices', nextPrices);
        await setSetting('bestueckungPricingTypes', nextTypes);
        setMessage('Backstage Kühlschrank Preise gespeichert');
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError(err.message || 'Fehler beim Speichern');
      }
      bestueckungSaveTimeoutRef.current = null;
    }, DEBOUNCE_MS);
  };

  if (loading) {
    return <div style={{ padding: 16 }}>Laden…</div>;
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ marginBottom: 8 }}>Catering Preise</h2>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Legen Sie die Preise pro Person für warmes und kaltes Catering sowie die Backstage-Kühlschrank-Optionen fest. Diese werden im PDF verwendet.
      </p>
      {error && <div style={{ color: '#c00', marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ color: '#0a0', marginBottom: 16 }}>{message}</div>}

      {/* Catering warm/cold */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Warm Catering Preis pro Person (€)</label>
          <input
            type="number"
            value={cateringPrices.warmPerPerson}
            onChange={(e) => {
              const next = { ...cateringPrices, warmPerPerson: e.target.value };
              setCateringPrices(next);
              scheduleSaveCatering(next);
            }}
            placeholder="0.00"
            step="0.01"
            min="0"
            style={{ width: '100%', maxWidth: 200, padding: '8px 12px', fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Kalt Catering Preis pro Person (€)</label>
          <input
            type="number"
            value={cateringPrices.coldPerPerson}
            onChange={(e) => {
              const next = { ...cateringPrices, coldPerPerson: e.target.value };
              setCateringPrices(next);
              scheduleSaveCatering(next);
            }}
            placeholder="0.00"
            step="0.01"
            min="0"
            style={{ width: '100%', maxWidth: 200, padding: '8px 12px', fontSize: 14 }}
          />
        </div>
      </div>

      {/* Backstage Kühlschrank */}
      <h3 style={{ marginBottom: 12, fontSize: 16 }}>Backstage Kühlschrank</h3>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 13 }}>
        Für Standard Konzert und Standard Tranzit Preisart (Pauschale oder pro Person) und Preis festlegen. Leer und Abgeschlossen benötigen keine Preise.
      </p>
      {BESTUECKUNG_OPTIONS.map((option) => {
        const noPrice = BESTUECKUNG_NO_PRICE.includes(option.value);
        if (noPrice) {
          return (
            <div key={option.value} style={{ marginBottom: 12, padding: 12, border: '1px solid #e8e8e8', borderRadius: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>{option.label}</h4>
            </div>
          );
        }
        return (
          <div key={option.value} style={{ marginBottom: 20, padding: 12, border: '1px solid #e8e8e8', borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>{option.label}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 13, marginRight: 16 }}>Preisart</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`pricing-${option.value}`}
                    value="pauschale"
                    checked={bestueckungPricingTypes[option.value] === 'pauschale'}
                    onChange={() => {
                      const nextTypes = { ...bestueckungPricingTypes, [option.value]: 'pauschale' };
                      setBestueckungPricingTypes(nextTypes);
                      scheduleSaveBestueckung(bestueckungTotalPrices, nextTypes);
                    }}
                  />
                  Pauschale
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`pricing-${option.value}`}
                    value="perPerson"
                    checked={bestueckungPricingTypes[option.value] === 'perPerson'}
                    onChange={() => {
                      const nextTypes = { ...bestueckungPricingTypes, [option.value]: 'perPerson' };
                      setBestueckungPricingTypes(nextTypes);
                      scheduleSaveBestueckung(bestueckungTotalPrices, nextTypes);
                    }}
                  />
                  Pro Person
                </label>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {bestueckungPricingTypes[option.value] === 'pauschale' ? 'Pauschale Preis (€)' : 'Preis pro Person (€)'}
                </label>
                <input
                  type="number"
                  value={bestueckungTotalPrices[option.value] || ''}
                  onChange={(e) => {
                    const nextPrices = { ...bestueckungTotalPrices, [option.value]: e.target.value };
                    setBestueckungTotalPrices(nextPrices);
                    scheduleSaveBestueckung(nextPrices, bestueckungPricingTypes);
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{ width: '100%', maxWidth: 160, padding: '6px 10px', fontSize: 14 }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
