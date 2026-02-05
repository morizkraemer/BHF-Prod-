(function () {
  const form = document.getElementById('secu-form');
  const messageEl = document.getElementById('message');
  const submitBtn = document.getElementById('submit-btn');
  const nameInput = document.getElementById('name');
  const datalist = document.getElementById('secu-names');

  function loadSecuNames() {
    fetch('/api/secu-names')
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (names) {
        if (!Array.isArray(names) || !datalist) return;
        datalist.innerHTML = '';
        names.forEach(function (name) {
          if (name && String(name).trim()) {
            var opt = document.createElement('option');
            opt.value = String(name).trim();
            datalist.appendChild(opt);
          }
        });
      })
      .catch(function () {});
  }

  loadSecuNames();
  if (nameInput) nameInput.addEventListener('focus', loadSecuNames);

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + (type === 'error' ? 'error' : 'success');
  }

  function clearMessage() {
    messageEl.textContent = '';
    messageEl.className = 'message';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearMessage();

    const name = (form.name && form.name.value || '').trim();
    const startTime = form.startTime && form.startTime.value || '';
    const endTime = form.endTime && form.endTime.value || '';

    if (!name) {
      showMessage('Bitte Name eingeben.', 'error');
      return;
    }
    if (!startTime) {
      showMessage('Bitte Startzeit eingeben.', 'error');
      return;
    }
    if (!endTime) {
      showMessage('Bitte Endzeit eingeben.', 'error');
      return;
    }

    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/secu-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startTime, endTime }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: res.statusText || 'Server-Fehler' };
      }

      if (!res.ok) {
        showMessage(data.error || 'Speichern fehlgeschlagen.', 'error');
        return;
      }

      showMessage('Gespeichert.');
      form.reset();
    } catch (err) {
      showMessage('Netzwerkfehler. Bitte erneut versuchen.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
