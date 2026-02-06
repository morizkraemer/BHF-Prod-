const { useState, useEffect } = React;

const PersonnelListForm = window.PersonnelListForm;

const CATEGORY_OPTIONS = [
  { value: 'Kasse', label: 'Kasse' },
  { value: 'WC', label: 'WC' },
  { value: 'Stage Hand', label: 'Stage Hand' },
  { value: 'Extern (auf Rechnung)', label: 'Extern (auf Rechnung)' }
];

function AndereMitarbeiterForm({ formData, onDataChange, highlightedFields = [] }) {
  const initialList = () => {
    const list = formData?.mitarbeiter || [];
    return list.map((p) => ({
      name: p.name ?? '',
      startTime: p.startTime ?? '',
      endTime: p.endTime ?? '',
      category: p.category ?? ''
    }));
  };

  const [mitarbeiter, setMitarbeiter] = useState(initialList);

  useEffect(() => {
    const list = formData?.mitarbeiter;
    if (Array.isArray(list) && list.length >= 0) {
      setMitarbeiter(list.map((p) => ({ name: p.name ?? '', startTime: p.startTime ?? '', endTime: p.endTime ?? '', category: p.category ?? '' })));
    }
  }, [formData?.mitarbeiter?.length]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        mitarbeiter,
        noPersonnelConfirmed: mitarbeiter.length > 0 ? false : formData?.noPersonnelConfirmed
      });
    }
  }, [mitarbeiter, formData?.noPersonnelConfirmed, onDataChange]);

  const handleListChange = (payload) => {
    if (payload && Array.isArray(payload.mitarbeiter)) {
      setMitarbeiter(payload.mitarbeiter.map((p) => ({
        name: p.name ?? '',
        startTime: p.startTime ?? '',
        endTime: p.endTime ?? '',
        category: p.category ?? ''
      })));
    }
  };

  return (
    <div className="form-container">
      <div className="andere-mitarbeiter-form">
        <div className="andere-mitarbeiter-subtitle">
          Kasse, WC, Stage Hand, Extern (auf Rechnung) – Stundensatz immer vom Mitarbeiter (Lohn & Mitarbeiter).
        </div>
        <div className="andere-mitarbeiter-section">
          {PersonnelListForm ? (
            <PersonnelListForm
              listKey="mitarbeiter"
              initialList={mitarbeiter}
              onDataChange={handleListChange}
              getNames={window.electronAPI?.getAndereMitarbeiterNames ?? null}
              addName={window.electronAPI?.addAndereMitarbeiterName ?? null}
              roleMode="personWage"
              extraFields={[
                { key: 'category', label: 'Kategorie', options: CATEGORY_OPTIONS, placeholder: 'Kategorie wählen *', required: true }
              ]}
              emptyMessage={formData?.noPersonnelConfirmed ? "Keine Mitarbeiter bestätigt" : "Keine Mitarbeiter hinzugefügt"}
              addButtonLabel="+ Add Person"
              sectionClass="andere-mitarbeiter"
              highlightedFields={highlightedFields}
              highlightPrefix="Andere Mitarbeiter Person"
              emptyStateFooter={mitarbeiter.length === 0 ? (
                <div className="andere-mitarbeiter-confirm-no-personnel">
                  {formData?.noPersonnelConfirmed ? (
                    <span className="andere-mitarbeiter-confirm-no-personnel-state">Bestätigt</span>
                  ) : (
                    <button
                      type="button"
                      className="andere-mitarbeiter-confirm-no-personnel-button"
                      onClick={() => onDataChange({ ...formData, noPersonnelConfirmed: true })}
                    >
                      Keine Mitarbeiter
                    </button>
                  )}
                </div>
              ) : null}
            />
          ) : (
            <div className="andere-mitarbeiter-empty">PersonnelListForm nicht geladen</div>
          )}
        </div>
      </div>
    </div>
  );
}
