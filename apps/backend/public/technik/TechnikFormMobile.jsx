const { useState, useEffect } = React;
const PersonNameSelect = window.PersonNameSelect;

function getTechNames() {
  return fetch('/api/tech-names').then(function (r) { return r.json(); });
}

function addTechName(name) {
  return fetch('/api/tech-add-name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name }),
  }).then(function (r) { return r.json(); });
}

function formatDateDisplay(dateStr) {
  if (!dateStr || !dateStr.trim()) return '';
  const parts = String(dateStr).trim().split('-');
  if (parts.length >= 3) return parts[2] + '.' + parts[1] + '.' + parts[0];
  return dateStr;
}

function TechnikFormMobile() {
  const [eventInfo, setEventInfo] = useState({ eventName: '', date: '', doorsTime: '' });
  const [name, setName] = useState('');
  const [getInTechniker, setGetInTechniker] = useState('');
  const [technikEndeAbbauBis, setTechnikEndeAbbauBis] = useState('');
  const [soundcheck, setSoundcheck] = useState('');
  const [doors, setDoors] = useState('');
  const [kostenpflichtigeZusatztechnik, setKostenpflichtigeZusatztechnik] = useState('');
  const [anmerkungen, setAnmerkungen] = useState('');
  const [showfileDlive, setShowfileDlive] = useState(false);
  const [showfileDot2, setShowfileDot2] = useState(false);
  const [hazerAus, setHazerAus] = useState(false);
  const [arbeitsplatzVerlassen, setArbeitsplatzVerlassen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = React.useRef(null);
  const signaturePadRef = React.useRef(null);

  function fetchCurrentEvent() {
    return fetch('/api/current-event')
      .then(function (r) {
        if (!r.ok) return { eventName: '', date: '', doorsTime: '' };
        return r.json();
      })
      .then(function (data) {
        var e = (data && data.currentEvent) ? data.currentEvent : data;
        var dateVal = (e && (e.eventDate != null ? e.eventDate : e.date) != null) ? String(e.eventDate != null ? e.eventDate : e.date) : '';
        setEventInfo({
          eventName: (e && e.eventName != null ? String(e.eventName) : '').trim(),
          date: dateVal.trim(),
          doorsTime: (e && e.doorsTime != null ? String(e.doorsTime) : '').trim(),
        });
      })
      .catch(function () {
        setEventInfo({ eventName: '', date: '', doorsTime: '' });
      });
  }

  useEffect(function () {
    fetchCurrentEvent();
  }, []);

  useEffect(function () {
    if (eventInfo.doorsTime) setDoors(eventInfo.doorsTime);
  }, [eventInfo.doorsTime]);

  useEffect(function () {
    function onFocus() {
      fetchCurrentEvent();
    }
    window.addEventListener('focus', onFocus);
    return function () { window.removeEventListener('focus', onFocus); };
  }, []);

  useEffect(function () {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.SignaturePad !== 'function') return;
    const pad = new window.SignaturePad(canvas);
    signaturePadRef.current = pad;
    const parent = canvas.parentElement;
    if (parent) {
      const w = parent.clientWidth;
      const h = 120;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.getContext('2d').scale(ratio, ratio);
    }
    return function () { signaturePadRef.current = null; };
  }, []);

  function clearMessage() {
    setMessage('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearMessage();
    if (!(name || '').trim()) {
      setMessage('Bitte Name ausfüllen.');
      setMessageType('error');
      return;
    }
    if (!(getInTechniker || '').trim()) {
      setMessage('Bitte Get In ausfüllen.');
      setMessageType('error');
      return;
    }
    if (!(technikEndeAbbauBis || '').trim()) {
      setMessage('Bitte Technik Ende / Abbau bis ausfüllen.');
      setMessageType('error');
      return;
    }
    if (!(soundcheck || '').trim()) {
      setMessage('Bitte Soundcheck ausfüllen.');
      setMessageType('error');
      return;
    }
    if (!(doors || '').trim()) {
      setMessage('Bitte Doors ausfüllen.');
      setMessageType('error');
      return;
    }
    const pad = signaturePadRef.current;
    if (!pad || pad.isEmpty()) {
      setMessage('Bitte unterschreiben.');
      setMessageType('error');
      return;
    }
    let signatureBase64 = '';
    try {
      const dataUrl = pad.toDataURL('image/png');
      if (dataUrl && dataUrl.indexOf('base64,') !== -1) signatureBase64 = dataUrl.split('base64,')[1] || '';
    } catch (_) {}
    setSubmitting(true);
    fetch('/api/technik-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: (name || '').trim(),
        getInTechniker: (getInTechniker || '').trim(),
        technikEndeAbbauBis: (technikEndeAbbauBis || '').trim(),
        kostenpflichtigeZusatztechnik: (kostenpflichtigeZusatztechnik || '').trim(),
        anmerkungen: (anmerkungen || '').trim(),
        showfileDlive: !!showfileDlive,
        showfileDot2: !!showfileDot2,
        hazerAus: !!hazerAus,
        arbeitsplatzVerlassen: !!arbeitsplatzVerlassen,
        soundcheck: (soundcheck || '').trim(),
        doors: (doors || '').trim(),
        signature: signatureBase64,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        }).catch(function () {
          return { ok: res.ok, data: { error: res.statusText || 'Fehler' } };
        });
      })
      .then(function (result) {
        if (result.ok) {
          setMessage('Gespeichert.');
          setMessageType('success');
          setName('');
          setGetInTechniker('');
          setTechnikEndeAbbauBis('');
          setKostenpflichtigeZusatztechnik('');
          setAnmerkungen('');
          setShowfileDlive(false);
          setShowfileDot2(false);
          setHazerAus(false);
          setArbeitsplatzVerlassen(false);
          setSoundcheck('');
          setDoors(eventInfo.doorsTime || '');
          if (signaturePadRef.current) signaturePadRef.current.clear();
        } else {
          setMessage((result.data && result.data.error) || 'Speichern fehlgeschlagen.');
          setMessageType('error');
        }
      })
      .catch(function () {
        setMessage('Netzwerkfehler. Bitte erneut versuchen.');
        setMessageType('error');
      })
      .finally(function () {
        setSubmitting(false);
      });
  }

  return (
    <main>
      <h1>Technik-Feedback</h1>
      <div className="technik-form-event-info">
        <div className="technik-form-event-header">
          <span className="technik-form-event-title">Aktuelle Schicht</span>
          <button type="button" className="technik-form-event-refresh" onClick={fetchCurrentEvent} title="Aktualisieren">
            Aktualisieren
          </button>
        </div>
        <div className="technik-form-event-row">
          <span className="technik-form-event-label">Veranstaltung</span>
          <span className="technik-form-event-value">{eventInfo.eventName || '–'}</span>
        </div>
        <div className="technik-form-event-row">
          <span className="technik-form-event-label">Datum</span>
          <span className="technik-form-event-value">{eventInfo.date ? formatDateDisplay(eventInfo.date) : '–'}</span>
        </div>
        <div className="technik-form-event-row">
          <span className="technik-form-event-label">Doors</span>
          <span className="technik-form-event-value">{eventInfo.doorsTime || '–'}</span>
        </div>
        {!eventInfo.eventName && !eventInfo.date && !eventInfo.doorsTime && (
          <p className="technik-form-event-hint">
            Schicht in der App (Übersicht) starten und Event/Datum/Doors ausfüllen, dann hier &quot;Aktualisieren&quot; tippen.
          </p>
        )}
      </div>
      <form id="technik-form" className="technik-form-mobile" onSubmit={handleSubmit} noValidate>
        <p className="technik-form-required-hint">Pflichtfelder mit *</p>
        <div className="technik-form-top-row">
          <label htmlFor="name">Name *</label>
          <div className="technik-form-name-wrap">
            {PersonNameSelect ? (
              <PersonNameSelect
                value={name}
                onChange={setName}
                getNames={getTechNames}
                addName={addTechName}
                placeholder="Name (Get-In Techniker)"
              />
            ) : (
              <input
                type="text"
                id="name"
                className="technik-form-input"
                value={name}
                onChange={function (e) { setName(e.target.value); }}
                placeholder="Name (Get-In Techniker)"
              />
            )}
          </div>
        </div>
        <div className="technik-form-row-pair">
          <div className="technik-form-top-row">
            <label htmlFor="getInTechniker">Get In *</label>
            <input
              type="time"
              id="getInTechniker"
              className="technik-form-input technik-form-time"
              value={getInTechniker}
              onChange={function (e) { setGetInTechniker(e.target.value); }}
              required
            />
          </div>
          <div className="technik-form-top-row">
            <label htmlFor="technikEndeAbbauBis">Technik Ende / Abbau bis *</label>
            <input
              type="time"
              id="technikEndeAbbauBis"
              className="technik-form-input technik-form-time"
              value={technikEndeAbbauBis}
              onChange={function (e) { setTechnikEndeAbbauBis(e.target.value); }}
              required
            />
          </div>
        </div>
        <div className="technik-form-row-pair">
          <div className="technik-form-top-row">
            <label htmlFor="soundcheck">Soundcheck *</label>
            <input
              type="time"
              id="soundcheck"
              className="technik-form-input technik-form-time"
              value={soundcheck}
              onChange={function (e) { setSoundcheck(e.target.value); }}
              required
            />
          </div>
          <div className="technik-form-top-row">
            <label htmlFor="doors">Doors *</label>
            <input
              type="time"
              id="doors"
              className="technik-form-input technik-form-time"
              value={doors}
              onChange={function (e) { setDoors(e.target.value); }}
              required
            />
          </div>
        </div>
        <div className="technik-form-zusatz-section">
          <label htmlFor="kostenpflichtigeZusatztechnik">Kostenpflichtige Zusatztechnik (bitte der Schichtleitung melden)</label>
          <input
            type="text"
            id="kostenpflichtigeZusatztechnik"
            className="technik-form-input"
            value={kostenpflichtigeZusatztechnik}
            onChange={function (e) { setKostenpflichtigeZusatztechnik(e.target.value); }}
            placeholder="Kostenpflichtige Zusatztechnik …"
          />
          <label htmlFor="anmerkungen">Anmerkungen</label>
        <textarea
          id="anmerkungen"
          className="technik-form-textarea"
          value={anmerkungen}
          onChange={function (e) { setAnmerkungen(e.target.value); }}
          placeholder="Anmerkungen …"
          rows={4}
        />
        </div>
        <div className="technik-form-checkboxes">
          <label className="technik-form-checkbox-label">
            <input
              type="checkbox"
              checked={showfileDlive}
              onChange={function (e) { setShowfileDlive(e.target.checked); }}
              className="technik-form-checkbox"
            />
            <span>&quot;AA Club Standard&quot; Showfile geladen (DLIVE)</span>
          </label>
          <label className="technik-form-checkbox-label">
            <input
              type="checkbox"
              checked={showfileDot2}
              onChange={function (e) { setShowfileDot2(e.target.checked); }}
              className="technik-form-checkbox"
            />
            <span>&quot;Besichtigung&quot; Showfile geladen (dot2)</span>
          </label>
          <label className="technik-form-checkbox-label">
            <input
              type="checkbox"
              checked={hazerAus}
              onChange={function (e) { setHazerAus(e.target.checked); }}
              className="technik-form-checkbox"
            />
            <span>Hazer/Nebelmaschine aus</span>
          </label>
          <label className="technik-form-checkbox-label">
            <input
              type="checkbox"
              checked={arbeitsplatzVerlassen}
              onChange={function (e) { setArbeitsplatzVerlassen(e.target.checked); }}
              className="technik-form-checkbox"
            />
            <span>Ich habe den Arbeitsplatz so verlassen, wie ich ihn auch gerne wieder auffinden würde.</span>
          </label>
        </div>
        <label className="technik-form-signature-label">Unterschrift *</label>
        <div className="technik-form-signature-pad">
          <canvas
            ref={canvasRef}
            className="technik-form-signature-canvas"
            aria-label="Unterschrift"
          />
          <button
            type="button"
            className="technik-form-signature-clear"
            onClick={function () { if (signaturePadRef.current) signaturePadRef.current.clear(); }}
          >
            Löschen
          </button>
        </div>
        <button type="submit" id="submit-btn" disabled={submitting}>
          {submitting ? 'Wird gespeichert…' : 'Absenden'}
        </button>
      </form>
      {message && (
        <div className={'message ' + messageType} aria-live="polite">
          {message}
        </div>
      )}
    </main>
  );
}

const root = document.getElementById('root');
if (root && window.React && window.ReactDOM) {
  window.ReactDOM.createRoot(root).render(React.createElement(TechnikFormMobile));
}
