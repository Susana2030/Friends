Friends.initAudio = function () {
  const audio = document.createElement('audio');
  audio.id = 'friends-audio';
  audio.src = 'audio/intro-friends.mp3';
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0.35;
  document.body.append(audio);
  const button = document.querySelector('#audio-toggle');
  const label = button.querySelector('.player-text');
  const symbol = button.querySelector('.player-symbol');
  const status = document.querySelector('.audio-status');
  let wanted = false, saved, lastSaved = 0;
  try { saved = JSON.parse(localStorage.getItem('friends.audio') || 'null'); } catch { /* Persistencia opcional. */ }
  function persist() {
    try { localStorage.setItem('friends.audio', JSON.stringify({ playing: wanted, time: audio.currentTime })); } catch { /* La reproducción sigue disponible. */ }
  }
  function update() {
    const playing = !audio.paused;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Pausar intro de Friends' : 'Reproducir intro de Friends');
    button.classList.toggle('is-playing', playing);
    label.textContent = playing ? 'Pausar intro' : 'Escuchar intro';
    symbol.textContent = playing ? 'Ⅱ' : '▶';
  }
  async function play() {
    button.disabled = true;
    try { await audio.play(); status.textContent = 'La intro está sonando.'; }
    catch { status.textContent = 'Tocá Escuchar intro para retomar la canción.'; }
    finally { button.disabled = false; update(); }
  }
  button.addEventListener('click', () => { if (audio.paused) play(); else audio.pause(); });
  audio.addEventListener('play', () => { wanted = true; update(); persist(); });
  audio.addEventListener('pause', () => { wanted = false; update(); persist(); });
  // Guardar como máximo cada cinco segundos, no en cada actualización de audio.
  audio.addEventListener('timeupdate', () => {
    const now = performance.now();
    if (now - lastSaved >= 5000) { lastSaved = now; persist(); }
  });
  audio.addEventListener('error', () => { update(); status.textContent = 'No se pudo cargar la intro. Volvé a intentarlo.'; });
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  if (saved && typeof saved === 'object') {
    wanted = saved.playing === true;
    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(saved.time) && saved.time >= 0 && Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = saved.time % audio.duration;
      if (wanted) play();
    }, { once: true });
    audio.preload = 'metadata';
    audio.load();
  }
};
