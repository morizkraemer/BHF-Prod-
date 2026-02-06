/**
 * Renders formData.shiftNotes (Fehlende Infos) – same structure as report PDF.
 * Only show section when there is content.
 */
export function hasShiftNotesContent(shiftNotes) {
  if (!shiftNotes || typeof shiftNotes !== 'object') return false;
  if (Array.isArray(shiftNotes.vvaMissingFields) && shiftNotes.vvaMissingFields.length > 0) return true;
  if (Array.isArray(shiftNotes.slMissingFields) && shiftNotes.slMissingFields.length > 0) return true;
  if (shiftNotes.vvaMissingFieldsNote && String(shiftNotes.vvaMissingFieldsNote).trim()) return true;
  if (shiftNotes.slMissingFieldsNote && String(shiftNotes.slMissingFieldsNote).trim()) return true;
  if (shiftNotes.vvaConfirmationNote && String(shiftNotes.vvaConfirmationNote).trim()) return true;
  if (shiftNotes.closeShiftConfirmationNote && String(shiftNotes.closeShiftConfirmationNote).trim()) return true;
  return false;
}

export default function FehlendeInfosSection({ data }) {
  const shiftNotes = data && typeof data === 'object' ? data : {};
  const items = [];

  if (shiftNotes.vvaMissingFields && Array.isArray(shiftNotes.vvaMissingFields) && shiftNotes.vvaMissingFields.length > 0) {
    const fieldsBySection = {};
    shiftNotes.vvaMissingFields.forEach((err) => {
      if (!fieldsBySection[err.section]) fieldsBySection[err.section] = [];
      fieldsBySection[err.section].push(err.field);
    });
    const content = Object.entries(fieldsBySection)
      .map(([section, fields]) => `${section}: ${fields.join(', ')}`)
      .join('\n');
    items.push({ title: 'VVA Fehlende Felder', content, note: shiftNotes.vvaMissingFieldsNote });
  } else if (shiftNotes.vvaMissingFieldsNote) {
    items.push({ title: 'VVA Notiz', content: null, note: shiftNotes.vvaMissingFieldsNote });
  }

  if (shiftNotes.slMissingFields && Array.isArray(shiftNotes.slMissingFields) && shiftNotes.slMissingFields.length > 0) {
    const fieldsBySection = {};
    shiftNotes.slMissingFields.forEach((err) => {
      if (!fieldsBySection[err.section]) fieldsBySection[err.section] = [];
      fieldsBySection[err.section].push(err.field);
    });
    const content = Object.entries(fieldsBySection)
      .map(([section, fields]) => `${section}: ${fields.join(', ')}`)
      .join('\n');
    items.push({ title: 'SL Fehlende Felder', content, note: shiftNotes.slMissingFieldsNote });
  } else if (shiftNotes.slMissingFieldsNote) {
    items.push({ title: 'SL Notiz', content: null, note: shiftNotes.slMissingFieldsNote });
  }

  if (shiftNotes.vvaConfirmationNote) {
    items.push({ title: 'VVA Bestätigung Notiz', content: null, note: shiftNotes.vvaConfirmationNote });
  }
  if (shiftNotes.closeShiftConfirmationNote) {
    items.push({ title: 'Shift Beendung Notiz', content: null, note: shiftNotes.closeShiftConfirmationNote });
  }

  if (items.length === 0) return null;

  return (
    <div className="section-blocks">
      {items.map((item, i) => (
        <div key={i} className="section-block" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}:</div>
          {item.content && (
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: 4 }}>{item.content}</div>
          )}
          {item.note && (
            <div style={{ whiteSpace: 'pre-wrap' }}>{item.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}
