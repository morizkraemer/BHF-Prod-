import { useState, useEffect } from 'react';
import { riderExtrasItemColumns, riderExtrasSingleFields } from 'shared/eventFormSchema';
import { getRiderItems } from '../../api';

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  return String(value);
}

function computedPrice(resolved, item) {
  if (item.discount === 'EK' && resolved.ekPrice != null) return resolved.ekPrice;
  if (item.discount) {
    const pct = parseFloat(item.discount);
    if (!isNaN(pct)) return resolved.price * (1 - pct / 100);
  }
  return resolved.price;
}

export default function RiderExtrasSection({ data }) {
  const safe = data && typeof data === 'object' ? data : {};
  const items = Array.isArray(safe.items) ? safe.items : [];
  const buyoutGroups = Array.isArray(safe.buyoutGroups) ? safe.buyoutGroups : [];
  const [riderItems, setRiderItems] = useState([]);

  useEffect(() => {
    getRiderItems()
      .then((list) => setRiderItems(Array.isArray(list) ? list : []))
      .catch(() => setRiderItems([]));
  }, []);

  const resolveRow = (item) => {
    if (!item.riderItemId || !riderItems.length) {
      return { name: '', price: 0, ekPrice: null, category: '' };
    }
    const cat = riderItems.find((c) => c.id === item.riderItemId);
    if (!cat) return { name: '', price: 0, ekPrice: null, category: '' };
    return {
      name: cat.name,
      price: cat.price ?? 0,
      ekPrice: cat.ekPrice ?? null,
      category: cat.category === 'Karte' ? 'Karte' : 'Extra'
    };
  };

  const rows = items.map((item) => {
    const resolved = resolveRow(item);
    const price = computedPrice(resolved, item);
    return {
      amount: item.amount,
      name: resolved.name,
      price: price.toFixed(2),
      discount: item.discount,
      category: resolved.category,
      checked: item.checked
    };
  });

  return (
    <div className="section-blocks">
      <div className="section-block">
        <h3 className="section-subtitle">Positionen</h3>
        <table className="section-table">
          <thead>
            <tr>
              {riderExtrasItemColumns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={riderExtrasItemColumns.length} className="section-empty">Keine Einträge.</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  {riderExtrasItemColumns.map((c) => (
                    <td key={c.key}>{formatValue(c.key === 'checked' ? (row[c.key] ? 'Ja' : 'Nein') : row[c.key])}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="section-block">
        <table className="section-table">
          <tbody>
            {riderExtrasSingleFields.map(({ key, label }) => (
              <tr key={key}>
                <th>{label}</th>
                <td>{formatValue(safe[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-block">
        <h3 className="section-subtitle">Buyout Gruppen</h3>
        <table className="section-table">
          <thead>
            <tr>
              <th>Personen</th>
              <th>Pro Person</th>
            </tr>
          </thead>
          <tbody>
            {buyoutGroups.length === 0 ? (
              <tr><td colSpan={2} className="section-empty">Keine Einträge.</td></tr>
            ) : (
              buyoutGroups.map((g, i) => (
                <tr key={i}>
                  <td>{formatValue(g.people)}</td>
                  <td>{formatValue(g.perPerson)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
