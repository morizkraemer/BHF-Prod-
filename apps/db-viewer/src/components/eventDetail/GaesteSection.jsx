const PAYMENT_MAP = { selbstzahler: 'Selbstzahler', pauschale: 'Pauschale' };

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  return String(value);
}

export default function GaesteSection({ data, pauschalePrices = {} }) {
  const safe = data && typeof data === 'object' ? data : {};
  const prices = pauschalePrices && typeof pauschalePrices === 'object' ? pauschalePrices : {};
  const paymentType = safe.paymentType;
  const showPauschale = paymentType === 'pauschale' && safe.pauschaleOptions;
  const slots = Array.isArray(safe.abendkasseTimeSlots) ? safe.abendkasseTimeSlots : [];
  const useTimeBasedPricing = safe.useTimeBasedPricing && slots.length > 0 && slots.some((s) => s.time != null || s.price != null || s.count != null);
  const showTable = safe.anzahlAbendkasse != null || safe.betragAbendkasse != null || useTimeBasedPricing || safe.gaesteGesamt != null;

  const paymentTypeValue = paymentType ? (PAYMENT_MAP[paymentType] || paymentType) : '–';

  let pauschaleOptions = '–';
  let pauschalePricesDisplay = '–';
  if (showPauschale) {
    const options = [];
    const priceStrs = [];
    if (safe.pauschaleOptions.standard) {
      options.push('Standard');
      if (prices.standard != null && String(prices.standard).trim() !== '') {
        const p = parseFloat(prices.standard) || 0;
        if (p > 0) priceStrs.push(`Standard: €${p.toFixed(2)}`);
      }
    }
    if (safe.pauschaleOptions.longdrinks) {
      options.push('Longdrinks');
      if (prices.longdrinks != null && String(prices.longdrinks).trim() !== '') {
        const p = parseFloat(prices.longdrinks) || 0;
        if (p > 0) priceStrs.push(`Longdrinks: €${p.toFixed(2)}`);
      }
    }
    if (safe.pauschaleOptions.shots) {
      options.push('Shots');
      if (prices.shots != null && String(prices.shots).trim() !== '') {
        const p = parseFloat(prices.shots) || 0;
        if (p > 0) priceStrs.push(`Shots: €${p.toFixed(2)}`);
      }
    }
    pauschaleOptions = options.length > 0 ? options.join(', ') : '–';
    if (priceStrs.length > 0) {
      const total = priceStrs.reduce((sum, str) => {
        const m = str.match(/€(\d+\.?\d*)/);
        return sum + (m ? parseFloat(m[1]) : 0);
      }, 0);
      pauschalePricesDisplay = `${priceStrs.join(', ')} (Gesamt: €${total.toFixed(2)})`;
    }
  }

  return (
    <div className="section-blocks">
      <div className="section-block">
        <table className="section-table">
          <tbody>
            <tr><th>Zahlungsart</th><td>{paymentTypeValue}</td></tr>
            {showPauschale && (
              <>
                <tr><th>Pauschale Optionen</th><td>{pauschaleOptions}</td></tr>
                <tr><th>Pauschale Preise</th><td>{pauschalePricesDisplay}</td></tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {showTable && (
        <div className="section-block">
          <h3 className="section-subtitle">Abendkasse / Gäste</h3>
          <table className="section-table">
            <thead>
              <tr>
                <th>Kategorie</th>
                <th style={{ textAlign: 'right' }}>Wert</th>
              </tr>
            </thead>
            <tbody>
              {useTimeBasedPricing ? (
                <>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <td colSpan={2} style={{ fontWeight: 600 }}>Zeitbasierte Preise Abendkasse</td>
                  </tr>
                  {slots.filter((s) => s.time != null || s.price != null || s.count != null).map((slot, i) => {
                    const price = parseFloat(slot.price || 0);
                    const count = parseFloat(slot.count || 0);
                    const slotTotal = price * count;
                    return (
                      <tr key={i}>
                        <td>Abendkasse {slot.time ?? '–'} ({slot.count ?? 0} × €{slot.price ?? 0})</td>
                        <td style={{ textAlign: 'right' }}>€{slotTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {slots.filter((s) => s.time != null || s.price != null || s.count != null).reduce((sum, s) => sum + parseFloat(s.price || 0) * parseFloat(s.count || 0), 0) > 0 && (
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ fontWeight: 600 }}>Total Abendkasse:</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        €{slots
                          .filter((s) => s.time != null || s.price != null || s.count != null)
                          .reduce((sum, s) => sum + parseFloat(s.price || 0) * parseFloat(s.count || 0), 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <>
                  {safe.anzahlAbendkasse != null && (
                    <tr>
                      <td>Anzahl Abendkasse</td>
                      <td style={{ textAlign: 'right' }}>{formatValue(safe.anzahlAbendkasse)}</td>
                    </tr>
                  )}
                  {safe.betragAbendkasse != null && (
                    <tr>
                      <td>Betrag Abendkasse</td>
                      <td style={{ textAlign: 'right' }}>€{formatValue(safe.betragAbendkasse)}</td>
                    </tr>
                  )}
                  {safe.anzahlAbendkasse != null && safe.betragAbendkasse != null && (
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ fontWeight: 600 }}>Total:</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        €{(parseFloat(safe.anzahlAbendkasse) * parseFloat(safe.betragAbendkasse)).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </>
              )}
              {safe.gaesteGesamt != null && (
                <tr>
                  <td>Gäste Gesamt</td>
                  <td style={{ textAlign: 'right' }}>{formatValue(safe.gaesteGesamt)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
