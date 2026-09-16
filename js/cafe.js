Friends.initCafe = function (main, signal) {
  const form = main.querySelector('.cafe-page form');
  if (!form) return () => {};
  const on = (element, type, listener) => element.addEventListener(type, listener, { signal });
  const status = form.querySelector('.form-status');
  let draft = '';
  on(form, 'input', event => { event.target.setCustomValidity?.(''); status.replaceChildren(); draft = ''; });
  on(form, 'submit', event => {
    event.preventDefault();
    for (const field of form.querySelectorAll('[required]')) {
      if (field.matches(':disabled')) continue;
      field.setCustomValidity(!field.value.trim() ? 'Completá este campo.' : field.minLength > 0 && field.value.trim().length < field.minLength ? `Escribí al menos ${field.minLength} caracteres.` : '');
    }
    if (!form.reportValidity()) return;
    draft = ['Mensaje para Friends', ...[...new FormData(form)].map(([key, value]) => `${key}: ${String(value).trim()}`)].join('\n');
    status.innerHTML = '<p>Borrador preparado. No se envió ningún mensaje.</p><button class="text-button" type="button">Descargar mensaje ↓</button>';
    status.focus();
  });
  on(status, 'click', event => {
    if (!event.target.closest('button') || !draft) return;
    const url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'friends-mensaje.txt'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return () => {};
};
