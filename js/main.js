Friends.initMain = function (main, signal) {
  document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
  const select = main.querySelector('#season-select');
  if (select) {
    const seasons = [...main.querySelectorAll('.season-card')];
    function showSeason(id) {
      const chosen = seasons.find(season => season.id === id) || seasons[0];
      seasons.forEach(season => {
        season.hidden = season !== chosen;
      });
      select.value = chosen.id;
      document.querySelectorAll('.season-options a').forEach(link => {
        if (link.hash === '#' + chosen.id) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      main.querySelector('#season-status').textContent = `Mostrando temporada ${seasons.indexOf(chosen) + 1} de ${seasons.length}.`;
    }
    showSeason(location.hash.slice(1) || select.value);
    select.addEventListener('change', () => {
      showSeason(select.value);
      main.querySelector('.season-browser').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      if (location.protocol !== 'file:') history.replaceState(null, '', location.pathname + location.search + '#' + select.value);
    }, { signal });
    window.addEventListener('hashchange', () => showSeason(location.hash.slice(1)), { signal });
  }
  return () => {};
};
