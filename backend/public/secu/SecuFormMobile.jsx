const { useState, useEffect } = React;
const PersonNameSelect = window.PersonNameSelect;

function getSecuNames() {
  return fetch('/api/secu-names').then(function (r) { return r.json(); });
}

function addSecuName(name) {
  return fetch('/api/secu-add-name', {
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

/** Returns time string (HH:MM) that is `minutesBefore` minutes before the given time (HH:MM or HH:MM:SS). */
function minutesBeforeTime(timeStr, minutesBefore) {
  const s = (timeStr || '').trim();
  if (!s) return '';
  const parts = s.split(':');
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10) || 0;
  if (isNaN(hours)) return '';
  let totalMins = hours * 60 + minutes - minutesBefore;
  if (totalMins < 0) totalMins += 24 * 60;
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function newPersonRow(doorsTime) {
  return {
    id: Date.now() + Math.random(),
    name: '',
    startTime: doorsTime ? minutesBeforeTime(doorsTime, 15) : '',
    endTime: '',
  };
}

function SecuFormMobile() {
  const [eventInfo, setEventInfo] = useState({ eventName: '', date: '', doorsTime: '' });
  const [persons, setPersons] = useState([{ id: 1, name: '', startTime: '', endTime: '' }]);
  const [getickert, setGetickert] = useState('');
  const [vorfalle, setVorfalle] = useState('');
  const [einlassbereichAbgeraeumt, setEinlassbereichAbgeraeumt] = useState(false);
  const [sachenZurueckgebracht, setSachenZurueckgebracht] = useState(false);
  const [arbeitsplatzHinterlassen, setArbeitsplatzHinterlassen] = useState(false);
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
    function onFocus() {
      fetchCurrentEvent();
    }
    window.addEventListener('focus', onFocus);
    return function () { window.removeEventListener('focus', onFocus); };
  }, []);

  useEffect(function () {
    setPersons(function (prev) {
      if (prev.length !== 1 || prev[0].name !== '' || prev[0].startTime !== '' || prev[0].endTime !== '') return prev;
      const defaultStart = eventInfo.doorsTime ? minutesBeforeTime(eventInfo.doorsTime, 15) : '';
      if (!defaultStart) return prev;
      return [{ ...prev[0], startTime: defaultStart }];
    });
  }, [eventInfo.doorsTime]);

  // Init SignaturePad when canvas is mounted
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

  function addPerson() {
    setPersons(function (prev) {
      return [...prev, newPersonRow(eventInfo.doorsTime)];
    });
  }

  function removePerson(id) {
    setPersons(function (prev) {
      if (prev.length <= 1) return prev;
      return prev.filter(function (p) { return p.id !== id; });
    });
  }

  function updatePerson(id, field, value) {
    setPersons(function (prev) {
      return prev.map(function (p) {
        if (p.id !== id) return p;
        return { ...p, [field]: value };
      });
    });
  }

  function clearMessage() {
    setMessage('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearMessage();
    const vf = (vorfalle || '').trim();
    if (!vf) {
      setMessage('Bitte Vorfälle ausfüllen.');
      setMessageType('error');
      return;
    }
    const pad = signaturePadRef.current;
    if (!pad || pad.isEmpty()) {
      setMessage('Bitte unterschreiben.');
      setMessageType('error');
      return;
    }
    const people = persons.map(function (p) {
      return {
        name: (p.name || '').trim(),
        startTime: (p.startTime || '').trim(),
        endTime: (p.endTime || '').trim(),
      };
    });
    for (let i = 0; i < people.length; i++) {
      if (!people[i].name) {
        setMessage('Bitte bei allen Personen den Namen eingeben.');
        setMessageType('error');
        return;
      }
      if (!people[i].startTime) {
        setMessage('Bitte bei allen Personen die Startzeit eingeben.');
        setMessageType('error');
        return;
      }
      if (!people[i].endTime) {
        setMessage('Bitte bei allen Personen die Endzeit eingeben.');
        setMessageType('error');
        return;
      }
    }
    let signatureBase64 = '';
    try {
      const dataUrl = pad.toDataURL('image/png');
      if (dataUrl && dataUrl.indexOf('base64,') !== -1) signatureBase64 = dataUrl.split('base64,')[1] || '';
    } catch (_) {}
    setSubmitting(true);
    fetch('/api/secu-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        people: people,
        getickert: getickert === '' || getickert == null ? '' : String(getickert).trim(),
        vorfalle: vf,
        signature: signatureBase64,
        einlassbereichAbgeraeumt: !!einlassbereichAbgeraeumt,
        sachenZurueckgebracht: !!sachenZurueckgebracht,
        arbeitsplatzHinterlassen: !!arbeitsplatzHinterlassen,
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
          setPersons([newPersonRow(eventInfo.doorsTime)]);
          setGetickert('');
          setVorfalle('');
          setEinlassbereichAbgeraeumt(false);
          setSachenZurueckgebracht(false);
          setArbeitsplatzHinterlassen(false);
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
      <h1>Secuzettel</h1>
      <div className="secu-form-event-info">
        <div className="secu-form-event-header">
          <span className="secu-form-event-title">Aktuelle Schicht</span>
          <button type="button" className="secu-form-event-refresh" onClick={fetchCurrentEvent} title="Aktualisieren">
            Aktualisieren
          </button>
        </div>
        <div className="secu-form-event-row">
          <span className="secu-form-event-label">Event</span>
          <span className="secu-form-event-value">{eventInfo.eventName || '–'}</span>
        </div>
        <div className="secu-form-event-row">
          <span className="secu-form-event-label">Datum</span>
          <span className="secu-form-event-value">{eventInfo.date ? formatDateDisplay(eventInfo.date) : '–'}</span>
        </div>
        <div className="secu-form-event-row">
          <span className="secu-form-event-label">Doors</span>
          <span className="secu-form-event-value">{eventInfo.doorsTime || '–'}</span>
        </div>
        {!eventInfo.eventName && !eventInfo.date && !eventInfo.doorsTime && (
          <p className="secu-form-event-hint">
            Schicht in der App (Übersicht) starten und Event/Datum/Doors ausfüllen, dann hier &quot;Aktualisieren&quot; tippen.
          </p>
        )}
      </div>
      <form id="secu-form" className="secu-form-mobile" onSubmit={handleSubmit} noValidate>
        <p className="secu-form-required-hint">Pflichtfelder mit *</p>
        {persons.map(function (person, index) {
          return (
            <div key={person.id} className="secu-form-person-row">
              <div className="secu-form-person-header">
                <span className="secu-form-person-title">Person {index + 1}</span>
                {persons.length > 1 && (
                  <button
                    type="button"
                    className="secu-form-person-remove"
                    onClick={function () { removePerson(person.id); }}
                    title="Person entfernen"
                  >
                    Entfernen
                  </button>
                )}
              </div>
              <label>Name *</label>
              <div className="secu-form-mobile-name">
                {PersonNameSelect ? (
                  <PersonNameSelect
                    value={person.name}
                    onChange={function (v) { updatePerson(person.id, 'name', v); }}
                    getNames={getSecuNames}
                    addName={addSecuName}
                    placeholder="Name eingeben"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={person.name}
                    onChange={function (e) { updatePerson(person.id, 'name', e.target.value); }}
                    placeholder="Name eingeben"
                    required
                  />
                )}
              </div>
              <label>Start *</label>
              <input
                type="time"
                value={person.startTime}
                onChange={function (e) { updatePerson(person.id, 'startTime', e.target.value); }}
                required
              />
              <label>Ende *</label>
              <input
                type="time"
                value={person.endTime}
                onChange={function (e) { updatePerson(person.id, 'endTime', e.target.value); }}
                required
              />
            </div>
          );
        })}
        <button type="button" className="secu-form-add-person" onClick={addPerson}>
          Person hinzufügen
        </button>
        <label htmlFor="getickert">Getickert</label>
        <input
          type="number"
          id="getickert"
          name="getickert"
          min={0}
          step={1}
          value={getickert}
          onChange={function (e) { setGetickert(e.target.value); }}
          placeholder="0"
        />
        <label htmlFor="vorfalle" className="secu-form-vorfalle-label">Vorfälle *</label>
        <textarea
          id="vorfalle"
          className="secu-form-vorfalle"
          value={vorfalle}
          onChange={function (e) { setVorfalle(e.target.value); }}
          placeholder="Vorfälle / Notizen …"
          rows={5}
          required
        />
        <div className="secu-form-checkboxes">
          <label className="secu-form-checkbox-label">
            <input
              type="checkbox"
              checked={einlassbereichAbgeraeumt}
              onChange={function (e) { setEinlassbereichAbgeraeumt(e.target.checked); }}
              className="secu-form-checkbox"
            />
            <span>Einlassbereich wurde abgeräumt?</span>
          </label>
          <label className="secu-form-checkbox-label">
            <input
              type="checkbox"
              checked={sachenZurueckgebracht}
              onChange={function (e) { setSachenZurueckgebracht(e.target.checked); }}
              className="secu-form-checkbox"
            />
            <span>Sachen aus anderen Läden (z.B. Sessel aus der alten Liebe) wurden zurückgebracht?</span>
          </label>
          <label className="secu-form-checkbox-label">
            <input
              type="checkbox"
              checked={arbeitsplatzHinterlassen}
              onChange={function (e) { setArbeitsplatzHinterlassen(e.target.checked); }}
              className="secu-form-checkbox"
            />
            <span>Ich habe meinen Arbeitsplatz so hinterlassen, wie ich ihn auch aufgefunden habe.</span>
          </label>
        </div>
        <label className="secu-form-signature-label">Unterschrift *</label>
        <div className="secu-form-signature-pad">
          <canvas
            ref={canvasRef}
            className="secu-form-signature-canvas"
            aria-label="Unterschrift"
          />
          <button
            type="button"
            className="secu-form-signature-clear"
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
  window.ReactDOM.createRoot(root).render(React.createElement(SecuFormMobile));
}
