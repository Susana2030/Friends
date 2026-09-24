// Confirmación local: el proyecto no envía datos a un servidor.
Friends.initContacto = function (main, signal) {
  const form = main.querySelector('#contact-form');
  if (!form) return () => {};
  const dialog = main.querySelector('#contact-success');
  const countdown = dialog.querySelector('[data-countdown]');
  const submit = form.querySelector('[type="submit"]');
  const label = submit.querySelector('.submit-label');
  const originalLabel = label.textContent;
  let closeTimer, ticker;
  function clearTimers() { clearTimeout(closeTimer); clearInterval(ticker); }
  form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    submit.classList.remove('is-success');
    label.textContent = originalLabel;
  }, { signal });
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const field of form.querySelectorAll('[required]')) {
      const length = field.value.trim().length;
      field.setCustomValidity(!length ? 'Completá este campo.' : length < field.minLength ? `Escribí al menos ${field.minLength} caracteres.` : '');
    }
    if (!form.reportValidity()) return;
    clearTimers();
    submit.classList.add('is-success');
    label.textContent = 'Mensaje recibido';
    countdown.textContent = '5';
    dialog.showModal();
    Friends.audioManager?.play('laugh');
    const deadline = performance.now() + 5000;
    ticker = setInterval(() => {
      countdown.textContent = String(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
    }, 250);
    closeTimer = setTimeout(() => { clearTimers(); if (dialog.open) dialog.close(); }, 5000);
  }, { signal });
  dialog.addEventListener('close', clearTimers, { signal });
  dialog.querySelector('button').addEventListener('click', () => { clearTimers(); dialog.close(); }, { signal });
  return () => { clearTimers(); if (dialog.open) dialog.close(); };
};
