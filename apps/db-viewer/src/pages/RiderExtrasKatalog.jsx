import { useState, useEffect } from 'react';
import { getRiderItems, postRiderItem, patchRiderItem, deleteRiderItem } from '../api';

const CATEGORIES = [
  { value: 'Karte', label: 'Karte' },
  { value: 'Extra', label: 'Extra' },
];

function formatPriceInput(n) {
  return n === '' || n == null ? '' : Number(n).toFixed(2).replace('.', ',');
}
function parsePriceInput(s) {
  const t = String(s ?? '').trim().replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

export default function RiderExtrasKatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newEkPrice, setNewEkPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Extra');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editEkPrice, setEditEkPrice] = useState('');
  const [editCategory, setEditCategory] = useState('Extra');

  const loadItems = () => {
    setError(null);
    getRiderItems()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = async () => {
    const name = (newName || '').trim();
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    const price = parsePriceInput(newPrice);
    const ekPrice = newEkPrice === '' || newEkPrice == null ? null : parsePriceInput(newEkPrice);
    try {
      const item = await postRiderItem({
        name,
        price: Number.isFinite(price) ? price : 0,
        ekPrice: Number.isFinite(ekPrice) ? ekPrice : null,
        category: newCategory,
      });
      setItems((prev) => [...prev, item].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')));
      setNewName('');
      setNewPrice('');
      setNewEkPrice('');
      setNewCategory('Extra');
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || '');
    setEditPrice(formatPriceInput(item.price));
    setEditEkPrice(item.ekPrice != null ? formatPriceInput(item.ekPrice) : '');
    setEditCategory(item.category === 'Karte' ? 'Karte' : 'Extra');
  };

  const handleSaveEdit = async () => {
    if (!editingId || saving) return;
    setSaving(true);
    setError(null);
    const price = parsePriceInput(editPrice);
    const ekPrice = editEkPrice === '' || editEkPrice == null ? null : parsePriceInput(editEkPrice);
    try {
      const updated = await patchRiderItem(editingId, {
        name: (editName || '').trim(),
        price: Number.isFinite(price) ? price : 0,
        ekPrice: Number.isFinite(ekPrice) ? ekPrice : null,
        category: editCategory,
      });
      setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...updated } : i)));
      setEditingId(null);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.name}" wirklich löschen?`)) return;
    setSaving(true);
    setError(null);
    try {
      await deleteRiderItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen');
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) return <div className="loading">Laden…</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Rider Extras Katalog</h1>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
        Items für Rider Extras verwalten (Name, VK Preis, EK Preis, Kategorie). Diese Items können im Formular und in der App ausgewählt werden.
      </p>
      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Neues Item</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Bezeichnung"
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ minWidth: 100 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>VK Preis (€)</label>
            <input
              type="text"
              inputMode="decimal"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0,00"
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ minWidth: 100 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>EK Preis (€)</label>
            <input
              type="text"
              inputMode="decimal"
              value={newEkPrice}
              onChange={(e) => setNewEkPrice(e.target.value)}
              placeholder="0,00"
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Kategorie</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleAdd} disabled={saving || !(newName || '').trim()} style={{ padding: '8px 16px' }}>
            Hinzufügen
          </button>
        </div>
      </section>

      <section>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Vorhandene Items ({items.length})</h2>
        {items.length === 0 ? (
          <p style={{ color: '#666' }}>Keine Items. Fügen Sie das erste Item hinzu.</p>
        ) : (
          <table className="section-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Name</th>
                <th style={{ padding: 8 }}>VK Preis</th>
                <th style={{ padding: 8 }}>EK Preis</th>
                <th style={{ padding: 8 }}>Kategorie</th>
                <th style={{ padding: 8 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  {editingId === item.id ? (
                    <>
                      <td style={{ padding: 8 }}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ width: '100%', padding: 6 }}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="0,00"
                          style={{ width: 80, padding: 6 }}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editEkPrice}
                          onChange={(e) => setEditEkPrice(e.target.value)}
                          placeholder="0,00"
                          style={{ width: 80, padding: 6 }}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          style={{ padding: 6 }}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: 8 }}>
                        <button type="button" onClick={handleSaveEdit} disabled={saving} style={{ marginRight: 8 }}>
                          Speichern
                        </button>
                        <button type="button" onClick={handleCancelEdit}>
                          Abbrechen
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: 8 }}>{item.name}</td>
                      <td style={{ padding: 8 }}>€{(item.price ?? 0).toFixed(2)}</td>
                      <td style={{ padding: 8 }}>{item.ekPrice != null ? `€${item.ekPrice.toFixed(2)}` : '–'}</td>
                      <td style={{ padding: 8 }}>{item.category === 'Karte' ? 'Karte' : 'Extra'}</td>
                      <td style={{ padding: 8 }}>
                        <button type="button" onClick={() => startEdit(item)} style={{ marginRight: 8 }}>
                          Bearbeiten
                        </button>
                        <button type="button" onClick={() => handleDelete(item)}>
                          Löschen
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
