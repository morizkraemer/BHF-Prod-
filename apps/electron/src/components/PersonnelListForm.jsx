/**
 * Reusable personnel list: name, startTime, endTime, optional role column, optional extra fields.
 * roleMode: 'fixed' (one role for all), 'select' (dropdown per row), 'personWage' (no role column; wage from person at close-shift).
 */

const { useState, useEffect } = React;

const PersonNameSelect = window.PersonNameSelect;

function PersonnelListForm({
  listKey,
  initialList = [],
  onDataChange,
  getNames,
  addName,
  roleMode = 'fixed',
  fixedRoleName = '',
  getRoles,
  roles = [],
  extraFields = [],
  emptyMessage = 'Keine Einträge',
  addButtonLabel = '+ Add Person',
  sectionClass = 'personnel-list',
  highlightedFields = [],
  highlightPrefix = 'Person'
}) {
  const normalize = (arr) =>
    (Array.isArray(arr) ? arr : []).map((p) => ({
      name: p.name ?? '',
      startTime: p.startTime ?? '',
      endTime: p.endTime ?? '',
      ...(roleMode === 'select' && { role: p.role ?? '' }),
      ...(extraFields.reduce((acc, f) => ({ ...acc, [f.key]: p[f.key] ?? '' }), {}))
    }));

  const [list, setList] = useState(() => normalize(initialList));

  useEffect(() => {
    setList((prev) => {
      const next = normalize(initialList);
      if (JSON.stringify(prev) !== JSON.stringify(next)) return next;
      return prev;
    });
  }, [initialList?.length, initialList?.map((p) => p.name + p.startTime + p.endTime).join('|')]);

  useEffect(() => {
    if (onDataChange) onDataChange({ [listKey]: list });
  }, [list, listKey, onDataChange]);

  const shouldHighlight = (fieldName) => highlightedFields.includes(fieldName);

  const handleChange = (index, field, value) => {
    setList((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const getDefaultRow = () => {
    const row = { name: '', startTime: '', endTime: '' };
    if (roleMode === 'select') row.role = '';
    extraFields.forEach((f) => (row[f.key] = ''));
    return row;
  };

  const handleAdd = () => setList((prev) => [...prev, getDefaultRow()]);

  const handleRemove = (index) => {
    setList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [];
    });
  };

  const headerClass = `${sectionClass}-header`;
  const lineClass = `${sectionClass}-line`;
  const emptyClass = `${sectionClass}-empty`;
  const nameClass = `${sectionClass}-name`;
  const timeClass = `${sectionClass}-time`;
  const controlsClass = `${sectionClass}-controls`;

  return (
    <div className={`${sectionClass}-section`}>
      <div className={headerClass}>
        <div className={`${headerClass}-name`}>Name</div>
        <div className={`${headerClass}-start`}>Start</div>
        <div className={`${headerClass}-end`}>Ende</div>
        {roleMode === 'select' && <div className={`${headerClass}-role`}>Rolle</div>}
        {extraFields.map((f) => (
          <div key={f.key} className={`${headerClass}-${f.key}`}>{f.label}</div>
        ))}
        <div className={`${headerClass}-actions`}></div>
      </div>

      {list.length === 0 ? (
        <div className={emptyClass}>{emptyMessage}</div>
      ) : (
        list.map((person, index) => (
          <div key={index} className={lineClass}>
            <div className={`${nameClass}-combo`}>
              {PersonNameSelect && getNames && addName ? (
                <PersonNameSelect
                  value={person.name}
                  onChange={(name) => handleChange(index, 'name', name)}
                  getNames={getNames}
                  addName={addName}
                  placeholder="Name *"
                  className={`${nameClass} ${shouldHighlight(`${highlightPrefix} ${index + 1} Name`) ? 'field-highlighted' : ''}`}
                  required
                />
              ) : (
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className={`${nameClass} ${shouldHighlight(`${highlightPrefix} ${index + 1} Name`) ? 'field-highlighted' : ''}`}
                  placeholder="Name *"
                  required
                />
              )}
            </div>
            <input
              type="time"
              value={person.startTime}
              onChange={(e) => handleChange(index, 'startTime', e.target.value)}
              className={`${timeClass} ${shouldHighlight(`${highlightPrefix} ${index + 1} Start Zeit`) ? 'field-highlighted' : ''}`}
              required
            />
            <input
              type="time"
              value={person.endTime}
              onChange={(e) => handleChange(index, 'endTime', e.target.value)}
              className={`${timeClass} ${shouldHighlight(`${highlightPrefix} ${index + 1} End Zeit`) ? 'field-highlighted' : ''}`}
              required
            />
            {roleMode === 'select' && (
              <select
                value={person.role ?? ''}
                onChange={(e) => handleChange(index, 'role', e.target.value)}
                className={`${sectionClass}-role ${shouldHighlight(`${highlightPrefix} ${index + 1} Rolle`) ? 'field-highlighted' : ''}`}
              >
                <option value="">Rolle wählen</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name ?? ''}>{r.name}</option>
                ))}
              </select>
            )}
            {extraFields.map((f) =>
              f.options ? (
                <select
                  key={f.key}
                  value={person[f.key] ?? ''}
                  onChange={(e) => handleChange(index, f.key, e.target.value)}
                  className={`${sectionClass}-${f.key} ${shouldHighlight(`${highlightPrefix} ${index + 1} ${f.label}`) ? 'field-highlighted' : ''}`}
                  required={f.required !== false}
                >
                  <option value="">{f.placeholder ?? `${f.label} wählen`}</option>
                  {(f.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label ?? opt.value}</option>
                  ))}
                </select>
              ) : (
                <input
                  key={f.key}
                  type="text"
                  value={person[f.key] ?? ''}
                  onChange={(e) => handleChange(index, f.key, e.target.value)}
                  className={`${sectionClass}-${f.key} ${shouldHighlight(`${highlightPrefix} ${index + 1} ${f.label}`) ? 'field-highlighted' : ''}`}
                  placeholder={f.placeholder ?? f.label}
                  required={f.required === true}
                />
              )
            )}
            <div className={controlsClass}>
              <button type="button" onClick={() => handleRemove(index)} className="remove-line-button" title="Remove">×</button>
            </div>
          </div>
        ))
      )}

      <button type="button" onClick={handleAdd} className="add-line-button">
        {addButtonLabel}
      </button>
    </div>
  );
}

window.PersonnelListForm = PersonnelListForm;
