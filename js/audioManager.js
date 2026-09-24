/* Sonidos sintetizados, sin descargas. La preferencia solo habilita efectos;
   la intro musical conserva su control independiente. */
Friends.initAudioManager = function () {
  if (Friends.audioManager) return Friends.audioManager;
  const storageKey = 'friends.sound.enabled';
  let enabled = false, context, master, lastHover = 0;
  const voices = new Set();
  try { enabled = localStorage.getItem(storageKey) === 'true'; } catch { /* Almacenamiento opcional. */ }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sound-toggle';
  (document.querySelector?.('.sound-controls') || document.body).append(toggle);
  function update() {
    toggle.textContent = enabled ? '🔊' : '🔇';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido');
    toggle.title = toggle.getAttribute('aria-label');
  }
  function save() {
    try { localStorage.setItem(storageKey, String(enabled)); } catch { /* Sigue funcionando sin persistencia. */ }
  }
  function stop() {
    voices.forEach(voice => { try { voice.stop(); } catch { /* Ya finalizada. */ } });
    voices.clear();
  }
  // Solo se invoca desde gestos del usuario: respeta el bloqueo de autoplay.
  async function unlock() {
    if (!enabled || document.hidden) return false;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      if (!context) {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0.16;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') await context.resume();
      return context.state === 'running';
    } catch { return false; }
  }
  // Cada voz libera sus nodos al terminar. Se limita la polifonía a 24 voces.
  function tone(frequency, duration, offset = 0, volume = 0.3, type = 'sine', endFrequency = frequency) {
    if (voices.size >= 24) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const start = context.currentTime + offset;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.012, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  function play(name) {
    if (!enabled || !context || context.state !== 'running' || document.hidden) return;
    switch (name) {
      case 'hover': tone(740, 0.045, 0, 0.08, 'sine', 880); break;
      case 'click': tone(540, 0.065, 0, 0.2, 'triangle', 380); break;
      case 'cup':
        tone(1250, 0.2, 0, 0.22); tone(2130, 0.16, 0.015, 0.1); break;
      case 'door':
        tone(180, 0.18, 0, 0.18, 'triangle', 330); tone(460, 0.1, 0.12, 0.09); break;
      case 'success':
        [523.25, 659.25, 783.99].forEach((note, i) => tone(note, 0.2, i * 0.085, 0.2)); break;
      case 'error': tone(240, 0.14, 0, 0.14, 'sine', 170); break;
      case 'laugh':
        // Siete sílabas «ha» con tono descendente y armónicos de voz.
        for (let i = 0; i < 7; i++) {
          const pitch = 250 - i * 13 + (i % 2) * 30;
          tone(pitch, 0.13, i * 0.155, 0.23, 'triangle', pitch * 0.76);
          tone(pitch * 3, 0.09, i * 0.155 + 0.015, 0.065, 'sine', pitch * 2.7);
        }
        break;
    }
  }
  toggle.addEventListener('click', async () => {
    enabled = !enabled;
    if (!enabled) { stop(); if (context?.state === 'running') context.suspend().catch(() => {}); }
    else if (await unlock()) play('cup');
    else enabled = false;
    save(); update();
  });
  const gesture = () => { if (enabled) void unlock(); };
  document.addEventListener('pointerdown', gesture, { capture: true, passive: true });
  document.addEventListener('keydown', event => {
    if (['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) gesture();
  }, { capture: true });
  document.addEventListener('pointerover', event => {
    const target = event.target.closest?.('button, a, summary');
    if (event.pointerType !== 'mouse' || !target || target === toggle || target.contains(event.relatedTarget)) return;
    const now = performance.now();
    if (now - lastHover > 140) { play('hover'); lastHover = now; }
  }, { passive: true });
  document.addEventListener('click', event => {
    const target = event.target.closest?.('button, a, summary');
    if (!target || target === toggle || target.closest('.quiz-form, .contact-form, .memory-carousel, .lightbox') || target.matches('.menu-toggle')) return;
    play(target.matches('.cafe-nav-link, .portrait-toggle') ? 'cup' : target.matches('summary') ? 'door' : 'click');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); if (context?.state === 'running') context.suspend().catch(() => {}); }
  });
  update();
  Friends.audioManager = { play, unlock, get enabled() { return enabled; } };
  return Friends.audioManager;
};
