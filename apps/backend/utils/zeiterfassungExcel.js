/**
 * Zeiterfassung: collect time entries from close-shift form data for DB (zeiterfassung_entries).
 * No Excel; data only.
 */

function parseWageToNumber(wageStr) {
  if (wageStr == null || wageStr === '') return null;
  const s = String(wageStr).trim();
  const match = s.match(/[\d,]+([.,]\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

function parseTimeToDecimalHours(timeStr) {
  if (timeStr == null || String(timeStr).trim() === '') return null;
  const s = String(timeStr).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours + minutes / 60 + seconds / 3600;
}

function computeHours(von, bis) {
  const start = parseTimeToDecimalHours(von);
  const end = parseTimeToDecimalHours(bis);
  if (start == null || end == null) return 0;
  let hours = end - start;
  if (hours < 0) hours += 24;
  return Math.round(hours * 100) / 100;
}

function collectZeiterfassungData(formData, eventDate) {
  const secuRows = [];
  const tonLichtRows = [];
  const andereRows = [];
  const eventName = (formData.uebersicht && formData.uebersicht.eventName) ? String(formData.uebersicht.eventName).trim() : '';
  const ton = formData.tontechniker || {};
  if (ton.soundEngineerEnabled !== false && (ton.soundEngineerName || '').trim()) {
    tonLichtRows.push([eventName, eventDate, (ton.soundEngineerName || '').trim(), ton.soundEngineerWage || '', ton.soundEngineerStartTime || '', ton.soundEngineerEndTime || '']);
  }
  if (ton.lightingTechEnabled && (ton.lightingTechName || '').trim()) {
    tonLichtRows.push([eventName, eventDate, (ton.lightingTechName || '').trim(), ton.lightingTechWage || '', ton.lightingTechStartTime || '', ton.lightingTechEndTime || '']);
  }
  (formData.secu?.securityPersonnel || []).forEach((p) => {
    const n = (p.name || '').trim();
    if (!n) return;
    secuRows.push([eventName, eventDate, n, p.wage || '', p.startTime || '', p.endTime || '']);
  });
  (formData['andere-mitarbeiter']?.mitarbeiter || []).forEach((p) => {
    const n = (p.name || '').trim();
    if (!n) return;
    andereRows.push([eventName, eventDate, n, p.wage || '', p.startTime || '', p.endTime || '', (p.category || '').trim()]);
  });
  return { secuRows, tonLichtRows, andereRows };
}

/**
 * Returns time entries in DB shape for zeiterfassung_entries table.
 * @param {string} eventId - UUID of the event
 * @param {Object} formData - Full form data from close-shift
 * @param {string} eventDate - YYYY-MM-DD
 * @returns {Array<{ event_id, role, event_name, entry_date, person_name, wage, start_time, end_time, hours, amount, category }>}
 */
function collectZeiterfassungEntriesForDb(eventId, formData, eventDate) {
  const { secuRows, tonLichtRows, andereRows } = collectZeiterfassungData(formData, eventDate);
  const out = [];

  function pushRow(role, row) {
    const eventName = row[0];
    const personName = row[2];
    const wageStr = row[3];
    const von = row[4];
    const bis = row[5];
    const category = row.length > 6 ? row[6] : null;
    const wageNum = parseWageToNumber(wageStr);
    const wage = wageNum != null ? wageNum : 0;
    const hours = computeHours(von, bis);
    const amount = Math.round(hours * wage * 100) / 100;
    out.push({
      event_id: eventId,
      role,
      event_name: eventName || null,
      entry_date: eventDate,
      person_name: personName,
      wage,
      start_time: von || null,
      end_time: bis || null,
      hours,
      amount,
      category: category || null
    });
  }

  secuRows.forEach((row) => pushRow('secu', row));
  tonLichtRows.forEach((row) => pushRow('ton_licht', row));
  andereRows.forEach((row) => pushRow('andere', row));
  return out;
}

module.exports = {
  parseWageToNumber,
  collectZeiterfassungData,
  collectZeiterfassungEntriesForDb
};
