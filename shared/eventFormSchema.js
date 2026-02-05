/**
 * Shared event form schema: section order and field definitions (keys + German labels).
 * Single source of truth for db-viewer (view/edit) and optionally Electron.
 * No React; plain data only.
 */

export const sections = [
  { id: 'uebersicht', name: 'Übersicht' },
  { id: 'rider-extras', name: 'Hospitality' },
  { id: 'tontechniker', name: 'Ton/Lichttechnik' },
  { id: 'secu', name: 'Secu' },
  { id: 'andere-mitarbeiter', name: 'Andere Mitarbeiter' },
  { id: 'gaeste', name: 'Gäste' },
  { id: 'kassen', name: 'Kassen' }
];

/** Key-value fields per section (key -> label). Order preserved by array of { key, label }. */
export const uebersichtFields = [
  { key: 'eventName', label: 'Event Name' },
  { key: 'date', label: 'Datum' },
  { key: 'eventType', label: 'Event Typ' },
  { key: 'getInTime', label: 'Get In Zeit (geplant)' },
  { key: 'getInTatsachlich', label: 'Get In Zeit (tatsächlich)' },
  { key: 'doorsTime', label: 'Doors Zeit (geplant)' },
  { key: 'doorsTatsachlich', label: 'Doors Zeit (tatsächlich)' },
  { key: 'travelPartyGetIn', label: 'Travel Party Get In' },
  { key: 'travelPartyTatsachlich', label: 'Travel Party (tatsächlich)' },
  { key: 'konzertende', label: 'Konzertende' },
  { key: 'konzertendeTatsachlich', label: 'Konzertende (tatsächlich)' },
  { key: 'backstageCurfew', label: 'Backstage Curfew' },
  { key: 'backstageCurfewTatsachlich', label: 'Backstage Curfew (tatsächlich)' },
  { key: 'nightLead', label: 'Night Lead' },
  { key: 'agentur', label: 'Agentur' },
  { key: 'agenturAPName', label: 'Agentur AP Name' },
  { key: 'veranstalterName', label: 'Veranstalter Name' },
  { key: 'veranstalterAPName', label: 'Veranstalter AP Name' },
  { key: 'vva', label: 'VVA' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'nightlinerParkplatz', label: 'Nightliner Parkplatz' },
  { key: 'notes', label: 'Notizen' }
];

export const riderExtrasItemColumns = [
  { key: 'amount', label: 'Menge' },
  { key: 'text', label: 'Bezeichnung' },
  { key: 'price', label: 'Preis' },
  { key: 'discount', label: 'Rabatt' },
  { key: 'checked', label: 'abgerechnet' }
];

export const riderExtrasSingleFields = [
  { key: 'standardbestueckung', label: 'Standardbestückung' },
  { key: 'getInCatering', label: 'Get-In Verpflegung' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'notes', label: 'Notizen' }
];

export const secuColumns = [
  { key: 'name', label: 'Name' },
  { key: 'startTime', label: 'Von' },
  { key: 'endTime', label: 'Bis' },
  { key: 'wage', label: 'Lohn' }
];

export const andereMitarbeiterColumns = [
  { key: 'name', label: 'Name' },
  { key: 'wage', label: 'Lohn' },
  { key: 'startTime', label: 'Von' },
  { key: 'endTime', label: 'Bis' },
  { key: 'category', label: 'Kategorie' }
];

export const gaesteFields = [
  { key: 'paymentType', label: 'Zahlungsart' },
  { key: 'anzahlAbendkasse', label: 'Anzahl Abendkasse' },
  { key: 'betragAbendkasse', label: 'Betrag Abendkasse' },
  { key: 'gaesteGesamt', label: 'Gäste gesamt' }
];

export const gaesteTimeSlotColumns = [
  { key: 'time', label: 'Zeit' },
  { key: 'price', label: 'Preis' },
  { key: 'count', label: 'Anzahl' }
];

/** Check if section data is empty (no meaningful values). */
export function isEmptySection(sectionId, data) {
  if (data == null || typeof data !== 'object') return true;
  if (sectionId === 'secu') {
    const list = data.securityPersonnel;
    if (!Array.isArray(list) || list.length === 0) return true;
    return list.every((p) => !(p.name || '').trim());
  }
  if (sectionId === 'andere-mitarbeiter') {
    const list = data.mitarbeiter;
    if (!Array.isArray(list) || list.length === 0) return true;
    return list.every((p) => !(p.name || '').trim());
  }
  if (sectionId === 'rider-extras') {
    const items = data.items;
    const hasItems = Array.isArray(items) && items.some((i) => (i.text || '').trim());
    const hasOther = riderExtrasSingleFields.some((f) => {
      const v = data[f.key];
      return v !== undefined && v !== null && v !== '';
    });
    return !hasItems && !hasOther;
  }
  if (sectionId === 'tontechniker') {
    const sound = data.soundEngineerEnabled !== false && (data.soundEngineerName || '').trim();
    const light = data.lightingTechEnabled && (data.lightingTechName || '').trim();
    return !sound && !light;
  }
  return Object.values(data).every((v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0));
}
