(() => {
  'use strict';
  const pages = new Set(['index.html', 'personajes.html', 'temporadas.html', 'galeria.html', 'contacto.html', 'quiz.html']);
  const main = document.querySelector('#contenido');
  const header = document.querySelector('.site-header');
  const nav = header.querySelector('.navigation');
  const measureHeader = () => document.documentElement.style.setProperty('--header-offset', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  measureHeader();
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);
  else window.addEventListener('resize', measureHeader, { passive: true });
  const toggle = header.querySelector('.menu-toggle');
  const seasonLink = nav.querySelector('a[href="temporadas.html"]');
  const seasonDropdown = document.createElement('details');
  seasonDropdown.className = 'season-dropdown';
  const seasonSummary = document.createElement('summary');
  seasonSummary.textContent = 'Temporadas';
  const seasonOptions = document.createElement('div');
  seasonOptions.className = 'season-options';
  for (let number = 1; number <= 10; number++) {
    const link = document.createElement('a');
    link.href = `temporadas.html#temporada${number}`;
    link.textContent = `Temporada ${number}`;
    seasonOptions.append(link);
  }
  seasonDropdown.append(seasonSummary, seasonOptions);
  seasonLink.replaceWith(seasonDropdown);
  document.addEventListener('pointerdown', event => {
    if (!seasonDropdown.contains(event.target)) seasonDropdown.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && seasonDropdown.open) {
      seasonDropdown.open = false;
      seasonSummary.focus();
    }
  });
  const pageName = url => url.pathname.split('/').pop() || 'index.html';
  Friends.isInternal = url => url.origin === location.origin && pages.has(pageName(url)) && url.pathname.slice(0, url.pathname.lastIndexOf('/') + 1) === location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
  let pageController, dispose = [], requestController;
  function menu(open) {
    if ((toggle.getAttribute('aria-expanded') === 'true') !== open) Friends.audioManager?.play('door');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    toggle.textContent = open ? '×' : '☰';
  }
  toggle.addEventListener('click', () => menu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { menu(false); toggle.focus(); }
  });
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) menu(false); });
  matchMedia('(min-width: 900px)').addEventListener('change', () => {
    menu(false);
    seasonDropdown.open = false;
  });
  function mount() {
    pageController = new AbortController();
    dispose = [Friends.initHero, Friends.initGallery, Friends.initQuiz, Friends.initContacto, Friends.initPersonajes, Friends.initMain, Friends.initVisualEffects].map(init => init(main, pageController.signal));
    const page = pageName(new URL(location.href));
    document.querySelector('.app').classList.toggle('home-page', page === 'index.html');
    nav.querySelectorAll('a').forEach(link => {
      const url = new URL(link.href);
      const active = pageName(url) === page && (!url.hash || url.hash === (location.hash || '#temporada1'));
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    if (page === 'temporadas.html') seasonDropdown.setAttribute('aria-current', 'page');
    else seasonDropdown.removeAttribute('aria-current');
    seasonDropdown.open = false;
    menu(false);
  }
  function scrollToContent(focus) {
    let anchor;
    try { anchor = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* Ignore malformed anchors. */ }
    if (anchor?.matches('.season-card')) anchor = main.querySelector('.season-browser') || anchor;
    if (anchor) anchor.scrollIntoView({ block: 'start' });
    else { window.scrollTo({ top: 0, behavior: 'instant' }); if (focus) main.focus({ preventScroll: true }); }
  }
  async function navigate(url, push = true) {
    requestController?.abort();
    const request = new AbortController(); requestController = request;
    main.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url.pathname + url.search, { signal: request.signal });
      if (!response.ok) throw new Error('Página no disponible');
      const documentNext = new DOMParser().parseFromString(await response.text(), 'text/html');
      const content = documentNext.querySelector('#contenido');
      if (!content || request.signal.aborted) throw new Error('Contenido no disponible');
      pageController.abort(); dispose.forEach(cleanup => cleanup());
      main.replaceChildren(...content.childNodes);
      if (push) history.pushState(null, '', url.pathname + url.search + url.hash);
      document.title = documentNext.title;
      // Scroll before mounting so a previous scroll position does not skip the intro.
      window.scrollTo({ top: 0, behavior: 'instant' }); mount(); scrollToContent(true);
    } catch (error) {
      if (error.name !== 'AbortError' && !request.signal.aborted) location.assign(url.href);
    } finally { if (requestController === request) main.removeAttribute('aria-busy'); }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (!Friends.isInternal(url)) return;
    menu(false);
    if (url.pathname === location.pathname && url.search === location.search) {
      event.preventDefault(); requestController?.abort();
      if (url.href !== location.href) history.pushState(null, '', url.pathname + url.search + url.hash);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      seasonDropdown.open = false;
      scrollToContent(true); return;
    }
    // A local HTTP server permits navigation without replacing the audio element.
    if (location.protocol === 'file:') return;
    event.preventDefault(); navigate(url);
  });
  window.addEventListener('popstate', () => navigate(new URL(location.href), false));
  Friends.initAudioManager(); Friends.initAudio(); mount(); scrollToContent(false);
})();
