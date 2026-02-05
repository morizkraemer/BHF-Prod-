import { useState, useEffect } from 'react';
import {
  getRoles,
  postRole,
  patchRole,
  deleteRole,
  getPersonWages,
  putPersonWages,
  getPersonNamesByType,
  removePersonName,
} from '../api';

function formatWage(n) {
  if (n === '' || n == null || !Number.isFinite(Number(n))) return '';
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
function parseWage(s) {
  const t = String(s ?? '').trim().replace(/\s*€\s*$/g, '').trim().replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

export default function LohnMitarbeiter() {
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleWage, setNewRoleWage] = useState('');
  const [focusedRoleId, setFocusedRoleId] = useState(null);
  const [localRoleWage, setLocalRoleWage] = useState('');
  const [focusedEmpName, setFocusedEmpName] = useState(null);
  const [localEmpWage, setLocalEmpWage] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [personWages, setPersonWages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadRoles = () => {
    setError(null);
    getRoles()
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    setError(null);
    setLoading(true);
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
        setEmployeesList(
          names.map((name) => ({
            name,
            useCustomWage: name in wageMap && wageMap[name] !== '' && wageMap[name] != null,
            customWage: wageMap[name] != null ? Number(wageMap[name]) : 0,
          }))
        );
        setPersonWages(wageMap);
      })
      .catch((err) => setError(err.message || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  };

  const handleAddRole = async () => {
    const name = (newRoleName || '').trim();
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    const wage = parseWage(newRoleWage);
    try {
      const role = await postRole({ name, hourlyWage: wage });
      setRoles((prev) => [...prev, role].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.name || '').localeCompare(b.name || '')));
      setNewRoleName('');
      setNewRoleWage('');
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleWageChange = async (roleId, value) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const wage = typeof value === 'number' ? value : parseWage(value);
    try {
      const updated = await patchRole(roleId, { hourlyWage: wage });
      setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...updated } : r)));
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Rolle wirklich löschen?')) return;
    setSaving(true);
    setError(null);
    try {
      await deleteRole(roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen');
    } finally {
      setSaving(false);
    }
  };

  const handleEmployeePayModeChange = async (name, useCustomWage, customWage = '') => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const next = { ...personWages };
    if (useCustomWage && customWage !== '') {
      const w = typeof customWage === 'number' ? customWage : parseWage(customWage);
      next[name] = w;
    } else {
      delete next[name];
    }
    try {
      await putPersonWages(next);
      setPersonWages(next);
      setEmployeesList((prev) =>
        prev.map((e) => (e.name === name ? { ...e, useCustomWage, customWage: useCustomWage ? (typeof customWage === 'number' ? customWage : parseWage(customWage)) : 0 } : e))
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

  if (loading && roles.length === 0) return <div className="loading">Laden…</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Lohn & Mitarbeiter</h1>
      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Rollen</h2>
        <p style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>
          Rollen definieren und Stundensatz (€/h) pro Rolle setzen. Bei Zeiterfassung wird der Stundensatz der Rolle verwendet, sofern kein eigener Stundensatz gesetzt ist.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ minWidth: 140 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Neue Rolle</label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
              placeholder="z.B. Secu"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>€/h</label>
            <input
              type="text"
              inputMode="decimal"
              value={newRoleWage}
              onChange={(e) => setNewRoleWage(e.target.value)}
              onBlur={(e) => setNewRoleWage(formatWage(parseWage(e.target.value)))}
              placeholder="0,00 €"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="button"
            onClick={handleAddRole}
            disabled={!newRoleName.trim() || saving}
            style={{
              padding: '8px 14px',
              borderRadius: 4,
              border: '1px solid #1967d2',
              background: '#1967d2',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Rolle hinzufügen
          </button>
        </div>
        {roles.length > 0 ? (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Rolle</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>€/h</th>
                  <th style={{ width: 100, padding: 10 }}></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>{role.name}</td>
                    <td style={{ padding: 10 }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={focusedRoleId === role.id ? localRoleWage : formatWage(role.hourlyWage)}
                        onFocus={() => {
                          setFocusedRoleId(role.id);
                          setLocalRoleWage(formatWage(role.hourlyWage).replace(/\s*€\s*$/, '').trim());
                        }}
                        onChange={(e) => setLocalRoleWage(e.target.value)}
                        onBlur={() => {
                          const n = parseWage(localRoleWage);
                          handleRoleWageChange(role.id, n);
                          setFocusedRoleId(null);
                        }}
                        disabled={saving}
                        style={{ minWidth: 90, padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
                      />
                    </td>
                    <td style={{ padding: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666', marginTop: 8 }}>Noch keine Rollen. Rolle hinzufügen, um Stundensätze pro Rolle zu setzen.</p>
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
          Pro Person: Bezahlung nach Rolle (Stundensatz der zugewiesenen Rolle) oder eigener Stundensatz (€/h). „Entfernen“ löscht aus Namenslisten und entfernt den eigenen Stundensatz.
        </p>
        {employeesList.length === 0 ? (
          <p style={{ color: '#666' }}>Noch keine Mitarbeiter. Auf „Aktualisieren“ klicken, um Namenslisten zu laden.</p>
        ) : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Bezahlung</th>
                  <th style={{ width: 100, padding: 10 }}></th>
                </tr>
              </thead>
              <tbody>
                {employeesList.map((emp) => (
                  <tr key={emp.name} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>{emp.name}</td>
                    <td style={{ padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="radio"
                            name={`pay-${emp.name}`}
                            checked={!emp.useCustomWage}
                            onChange={() => handleEmployeePayModeChange(emp.name, false)}
                            disabled={saving}
                          />
                          <span>Nach Rolle</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="radio"
                            name={`pay-${emp.name}`}
                            checked={emp.useCustomWage}
                            onChange={() => handleEmployeePayModeChange(emp.name, true, emp.customWage ?? 0)}
                            disabled={saving}
                          />
                          <span>Eigener Stundensatz</span>
                        </label>
                        {emp.useCustomWage && (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={focusedEmpName === emp.name ? localEmpWage : formatWage(emp.customWage)}
                            onFocus={() => {
                              setFocusedEmpName(emp.name);
                              setLocalEmpWage(formatWage(emp.customWage).replace(/\s*€\s*$/, '').trim());
                            }}
                            onChange={(e) => setLocalEmpWage(e.target.value)}
                            onBlur={() => {
                              const n = parseWage(localEmpWage);
                              handleEmployeePayModeChange(emp.name, true, n);
                              setFocusedEmpName(null);
                            }}
                            disabled={saving}
                            placeholder="0,00 €"
                            style={{ minWidth: 90, padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
                          />
                        )}
                      </div>
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
