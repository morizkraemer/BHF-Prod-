import { useState, useEffect } from 'react';
import {
  getWageOptions,
  putWageOptions,
  getPersonWages,
  putPersonWages,
  getPersonNamesByType,
  removePersonName,
} from '../api';

function wageValue(opt) {
  return typeof opt === 'object' && opt !== null && 'label' in opt ? opt.label : String(opt);
}

export default function LohnMitarbeiter() {
  const [wageOptions, setWageOptions] = useState([]);
  const [newWageOption, setNewWageOption] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [personWages, setPersonWages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadWageOptions = () => {
    setError(null);
    getWageOptions()
      .then((data) => setWageOptions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWageOptions();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    setError(null);
    Promise.all([
      getPersonNamesByType('secu'),
      getPersonNamesByType('tech'),
      getPersonNamesByType('andere'),
      getPersonWages(),
    ])
      .then(([secu, tech, andere, wages]) => {
        const nameSet = new Map();
        const add = (list) => {
          (list || []).forEach((item) => {
            const n = (item?.name || '').trim();
            if (n && !nameSet.has(n.toLowerCase())) nameSet.set(n.toLowerCase(), n);
          });
        };
        add(secu);
        add(tech);
        add(andere);
        const names = Array.from(nameSet.values()).sort((a, b) => a.localeCompare(b));
        const wageMap = wages && typeof wages === 'object' ? wages : {};
        setEmployeesList(names.map((name) => ({ name, wage: wageMap[name] ?? '' })));
        setPersonWages(wageMap);
      })
      .catch((err) => setError(err.message || 'Fehler beim Laden'));
  };

  const handleAddWageOption = async () => {
    const label = (newWageOption || '').trim();
    if (!label || saving) return;
    setSaving(true);
    setError(null);
    const next = [...wageOptions.map(wageValue), label];
    try {
      await putWageOptions(next);
      setWageOptions(next.map((l) => ({ label: l })));
      setNewWageOption('');
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWageOption = async (index) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const next = wageOptions.filter((_, i) => i !== index).map(wageValue);
    try {
      await putWageOptions(next);
      setWageOptions(next.map((l) => ({ label: l })));
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleEmployeeWageChange = async (name, wageOption) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const next = { ...personWages, [name]: wageOption ?? '' };
    try {
      await putPersonWages(next);
      setPersonWages(next);
      setEmployeesList((prev) =>
        prev.map((e) => (e.name === name ? { ...e, wage: wageOption ?? '' } : e))
      );
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEmployee = async (name) => {
    if (!window.confirm(`"${name}" aus allen Namenslisten und Stundensatz entfernen?`)) return;
    setSaving(true);
    setError(null);
    try {
      await removePersonName(name);
      setEmployeesList((prev) => prev.filter((e) => e.name !== name));
      setPersonWages((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (err) {
      setError(err.message || 'Fehler beim Entfernen');
    } finally {
      setSaving(false);
    }
  };

  const wageInOptions = (wage) => wageOptions.some((o) => wageValue(o) === wage);

  if (loading && wageOptions.length === 0) return <div className="loading">Laden…</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Lohn & Mitarbeiter</h1>
      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Stundensätze</h2>
        <p style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>
          Liste der Lohnoptionen, die pro Person zugewiesen werden können.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ minWidth: 140 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              Neuer Stundensatz
            </label>
            <input
              type="text"
              value={newWageOption}
              onChange={(e) => setNewWageOption(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWageOption())}
              placeholder="z.B. 25 €/h"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="button"
            onClick={handleAddWageOption}
            disabled={!newWageOption.trim() || saving}
            style={{
              padding: '8px 14px',
              borderRadius: 4,
              border: '1px solid #1967d2',
              background: '#1967d2',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Hinzufügen
          </button>
        </div>
        {wageOptions.length > 0 ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {wageOptions.map((opt, index) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span>{wageValue(opt)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWageOption(index)}
                  disabled={saving}
                  style={{
                    padding: '4px 10px',
                    fontSize: 13,
                    borderRadius: 4,
                    border: '1px solid #c5221f',
                    background: '#fff',
                    color: '#c5221f',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#666', marginTop: 8 }}>Noch keine Stundensätze.</p>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Mitarbeiter</h2>
          <button
            type="button"
            onClick={loadEmployees}
            disabled={saving}
            style={{
              padding: '8px 14px',
              borderRadius: 4,
              border: '1px solid #1967d2',
              background: '#fff',
              color: '#1967d2',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Aktualisieren
          </button>
        </div>
        <p style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>
          Alle Personen aus Ton/Licht, Secu und Andere Mitarbeiter mit Stundensatz verwalten.
        </p>
        {employeesList.length === 0 ? (
          <p style={{ color: '#666' }}>Noch keine Mitarbeiter. Auf „Aktualisieren“ klicken, um Namenslisten zu laden.</p>
        ) : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Stundensatz</th>
                  <th style={{ width: 100, padding: 10 }}></th>
                </tr>
              </thead>
              <tbody>
                {employeesList.map((emp) => (
                  <tr key={emp.name} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>{emp.name}</td>
                    <td style={{ padding: 10 }}>
                      <select
                        value={emp.wage ?? ''}
                        onChange={(e) => handleEmployeeWageChange(emp.name, e.target.value)}
                        disabled={saving}
                        style={{
                          minWidth: 140,
                          padding: '6px 8px',
                          borderRadius: 4,
                          border: '1px solid #ccc',
                        }}
                      >
                        <option value="">—</option>
                        {wageOptions.map((opt) => {
                          const val = wageValue(opt);
                          return (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          );
                        })}
                        {emp.wage && !wageInOptions(emp.wage) && (
                          <option value={emp.wage}>{emp.wage}</option>
                        )}
                      </select>
                    </td>
                    <td style={{ padding: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(emp.name)}
                        disabled={saving}
                        style={{
                          padding: '4px 10px',
                          fontSize: 13,
                          borderRadius: 4,
                          border: '1px solid #c5221f',
                          background: '#fff',
                          color: '#c5221f',
                          cursor: saving ? 'not-allowed' : 'pointer',
                        }}
                        title="Aus Namenslisten und Stundensatz entfernen"
                      >
                        Entfernen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
