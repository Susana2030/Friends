// Los gestos de inclinación están centralizados en visualEffects.js.
Friends.initPersonajes = function (main, signal) {
  main.querySelectorAll('.portrait-toggle').forEach(button => {
    button.addEventListener('click', () => {
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
    }, { signal });
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape') button.setAttribute('aria-pressed', 'false');
    }, { signal });
  });
  return () => {};
};
