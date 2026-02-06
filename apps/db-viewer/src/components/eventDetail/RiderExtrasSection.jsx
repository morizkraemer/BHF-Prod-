
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

/** Build catering invoice items (same logic as report-template.js). Only show table when length > 0. */
function buildCateringInvoiceItems(riderExtras, uebersicht, cateringPrices, bestueckungTotalPrices, bestueckungPricingTypes) {
  const items = [];
  const travelParty = parseFloat(uebersicht?.travelPartyTatsachlich) || parseFloat(uebersicht?.travelPartyGetIn) || 0;
  const catering = cateringPrices && typeof cateringPrices === 'object' ? cateringPrices : {};
  const bestueckungPrices = bestueckungTotalPrices && typeof bestueckungTotalPrices === 'object' ? bestueckungTotalPrices : {};
  const bestueckungTypes = bestueckungPricingTypes && typeof bestueckungPricingTypes === 'object' ? bestueckungPricingTypes : {};

  if ((riderExtras?.getInCatering === 'warm' || riderExtras?.getInCatering === 'kalt') && travelParty > 0) {
    let pricePerPerson = 0;
    let description = '';
    if (riderExtras.getInCatering === 'warm' && catering.warmPerPerson && String(catering.warmPerPerson).trim() !== '') {
      pricePerPerson = parseFloat(catering.warmPerPerson) || 0;
      description = 'Get In Catering (Warm)';
    } else if (riderExtras.getInCatering === 'kalt' && catering.coldPerPerson && String(catering.coldPerPerson).trim() !== '') {
      pricePerPerson = parseFloat(catering.coldPerPerson) || 0;
      description = 'Get In Catering (Kalt)';
    }
    if (pricePerPerson > 0) {
      items.push({ description, quantity: travelParty, unitPrice: pricePerPerson, total: travelParty * pricePerPerson });
    }
  }

  if (riderExtras?.dinner === 'warm' && travelParty > 0 && catering.warmPerPerson && String(catering.warmPerPerson).trim() !== '') {
    const pricePerPerson = parseFloat(catering.warmPerPerson) || 0;
    if (pricePerPerson > 0) {
      items.push({ description: 'Dinner (Warm)', quantity: travelParty, unitPrice: pricePerPerson, total: travelParty * pricePerPerson });
    }
  }

  const bestueckungKeys = ['leer', 'abgeschlossen', 'standard-konzert', 'standard-tranzit'];
  if (riderExtras?.standardbestueckung && bestueckungKeys.includes(riderExtras.standardbestueckung)) {
    const key = riderExtras.standardbestueckung;
    const pricingType = bestueckungTypes[key] || 'pauschale';
    const priceStr = bestueckungPrices[key];
    if (priceStr && String(priceStr).trim() !== '') {
      const unitPrice = parseFloat(priceStr) || 0;
      if (unitPrice > 0) {
        const names = { leer: 'Leer', abgeschlossen: 'Abgeschlossen', 'standard-konzert': 'Standard Konzert', 'standard-tranzit': 'Standard Tranzit' };
        const name = names[key] || key;
        const description = `Backstage Kühlschrank ${name}`;
        if (pricingType === 'perPerson' && travelParty > 0) {
          items.push({ description: `${description} (Pro Person)`, quantity: travelParty, unitPrice, total: travelParty * unitPrice });
        } else if (pricingType === 'pauschale') {
          items.push({ description: `${description} (Pauschale)`, quantity: 1, unitPrice, total: unitPrice });
        }
      }
    }
  }

  return items;
}

const CATERING_MAP = { no: 'Nein', kalt: 'Kalt', 'nur-snacks': 'Nur Snacks', warm: 'Warm', buyout: 'Buyout' };
const DINNER_MAP = { no: 'Nein', warm: 'Warm', buyout: 'Buyout', caterer: 'Caterer' };
const BUYOUT_PROVIDER_MAP = { 'uber-bahnhof-pauli': 'Bahnhof Pauli', 'uber-agentur': 'Agentur' };
const BESTUECKUNG_MAP = { leer: 'Leer', abgeschlossen: 'Abgeschlossen', 'standard-konzert': 'Standard Konzert', 'standard-tranzit': 'Standard Tranzit' };
const DISCOUNT_MAP = { '50': '50%', '75': '75%', '100': '100%', EK: 'EK' };

export default function RiderExtrasSection({ data, uebersicht = {}, cateringPrices, bestueckungTotalPrices, bestueckungPricingTypes, riderItems = [] }) {
  const safe = data && typeof data === 'object' ? data : {};
  const ueb = uebersicht && typeof uebersicht === 'object' ? uebersicht : {};
  const items = Array.isArray(safe.items) ? safe.items : [];
  const buyoutGroups = Array.isArray(safe.buyoutGroups) ? safe.buyoutGroups : [];
  const showBuyoutGroups = safe.buyoutProvider === 'uber-bahnhof-pauli' && buyoutGroups.length > 0 && buyoutGroups.some((g) => g.people != null || g.perPerson != null);

  const cateringInvoiceItems = buildCateringInvoiceItems(safe, ueb, cateringPrices, bestueckungTotalPrices, bestueckungPricingTypes);
  const showCateringRechnung = cateringInvoiceItems.length > 0;

  const resolveRow = (item) => {
    if (!item.riderItemId || !riderItems.length) return { name: '', price: 0, ekPrice: null, category: '' };
    const cat = riderItems.find((c) => c.id === item.riderItemId);
    if (!cat) return { name: '', price: 0, ekPrice: null, category: '' };
    return { name: cat.name, price: cat.price ?? 0, ekPrice: cat.ekPrice ?? null, category: cat.category === 'Karte' ? 'Karte' : 'Extra' };
  };

  const extrasRows = items
    .filter((item) => item.riderItemId)
    .map((item) => {
      const resolved = resolveRow(item);
      const price = computedPrice(resolved, item);
      return {
        amount: item.amount,
        name: resolved.name,
        price: Number.isFinite(price) ? price.toFixed(2) : '–',
        discount: item.discount ? (DISCOUNT_MAP[item.discount] || item.discount) : '–',
        status: item.checked ? '✓ Eingebongt' : '–',
      };
    });

  const nightlinerValue = ueb.nightlinerParkplatz === 'yes' ? 'Ja' : ueb.nightlinerParkplatz === 'no' ? 'Nein' : '–';
  const getInCateringValue = safe.getInCatering ? (CATERING_MAP[safe.getInCatering] || safe.getInCatering) : '–';
  let dinnerValue = safe.dinner ? (DINNER_MAP[safe.dinner] || safe.dinner) : '–';
  if (safe.dinner === 'caterer') dinnerValue += ' (Nicht Standard)';
  const bestueckungValue = safe.standardbestueckung ? (BESTUECKUNG_MAP[safe.standardbestueckung] || safe.standardbestueckung) : '–';
  const backstageDisplay = bestueckungValue !== '–' ? `Backstage Kühlschrank: ${bestueckungValue}` : '–';

  return (
    <div className="section-blocks">
      <div className="section-block">
        <table className="section-table">
          <tbody>
            <tr><th>Travel Party Get In</th><td>{formatValue(ueb.travelPartyGetIn)}</td></tr>
            <tr><th>Travel Party Tatsächlich</th><td>{formatValue(ueb.travelPartyTatsachlich)}</td></tr>
            <tr><th>Nightliner Parkplatz</th><td>{nightlinerValue}</td></tr>
            <tr><th>Get In Catering</th><td>{getInCateringValue}</td></tr>
            <tr><th>Dinner</th><td>{dinnerValue}</td></tr>
          </tbody>
        </table>
      </div>

      {showCateringRechnung && (
        <div className="section-block" style={{ marginTop: 16 }}>
          <h3 className="section-subtitle">Catering Rechnung</h3>
          <table className="section-table">
            <thead>
              <tr>
                <th>Beschreibung</th>
                <th style={{ textAlign: 'right' }}>Menge</th>
                <th style={{ textAlign: 'right' }}>Einzelpreis</th>
                <th style={{ textAlign: 'right' }}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {cateringInvoiceItems.map((row, i) => (
                <tr key={i}>
                  <td>{row.description}</td>
                  <td style={{ textAlign: 'right' }}>{row.quantity}</td>
                  <td style={{ textAlign: 'right' }}>€{row.unitPrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>€{row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #ddd' }}>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Gesamtsumme:</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  €{cateringInvoiceItems.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {safe.buyoutProvider && (
        <div className="section-block">
          <table className="section-table">
            <tbody>
              <tr>
                <th>Buyout Provider</th>
                <td>{BUYOUT_PROVIDER_MAP[safe.buyoutProvider] || safe.buyoutProvider}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showBuyoutGroups && (
        <div className="section-block">
          <h3 className="section-subtitle">Buyout Gruppen</h3>
          <table className="section-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'right' }}>Personen</th>
                <th style={{ textAlign: 'right' }}>Pro Person</th>
                <th style={{ textAlign: 'right' }}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {buyoutGroups.filter((g) => g.people != null || g.perPerson != null).map((g, i) => {
                const people = parseFloat(g.people) || 0;
                const perPerson = parseFloat(g.perPerson) || 0;
                const total = people * perPerson;
                return (
                  <tr key={i}>
                    <td style={{ textAlign: 'right' }}>{g.people ?? '–'}</td>
                    <td style={{ textAlign: 'right' }}>€{perPerson.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>€{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #ddd' }}>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600 }}>Gesamtsumme:</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  €{buyoutGroups
                    .filter((g) => g.people != null || g.perPerson != null)
                    .reduce((sum, g) => sum + (parseFloat(g.people) || 0) * (parseFloat(g.perPerson) || 0), 0)
                    .toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="section-block">
        <table className="section-table">
          <tbody>
            <tr><th>Backstage Kühlschrank</th><td>{backstageDisplay}</td></tr>
          </tbody>
        </table>
      </div>

      {extrasRows.length > 0 && (
        <div className="section-block">
          <h3 className="section-subtitle">Extras</h3>
          <table className="section-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Menge</th>
                <th style={{ textAlign: 'right' }}>Preis</th>
                <th style={{ textAlign: 'center' }}>Rabatt</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {extrasRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.name || '–'}</td>
                  <td style={{ textAlign: 'right' }}>{formatValue(row.amount)}</td>
                  <td style={{ textAlign: 'right' }}>€{row.price}</td>
                  <td style={{ textAlign: 'center' }}>{row.discount}</td>
                  <td style={{ textAlign: 'center' }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {safe.notes != null && String(safe.notes).trim() !== '' && (
        <div className="section-block">
          <div className="notes-label" style={{ fontWeight: 600, marginBottom: 4 }}>Notizen:</div>
          <div className="notes-content" style={{ whiteSpace: 'pre-wrap' }}>{safe.notes}</div>
        </div>
      )}
    </div>
  );
}
