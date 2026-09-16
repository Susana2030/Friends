Friends.initAudio = function () {
  const audio = document.createElement('audio');
  audio.id = 'friends-audio'; audio.src = 'audio/intro-friends.mp3';
  audio.loop = true; audio.preload = 'none'; audio.volume = 0.35;
  document.body.append(audio);
  const button = document.querySelector('#audio-toggle');
  const status = document.querySelector('.audio-status');
  const equalizer = document.querySelector('.equalizer');
  let wanted = false, saved;
  try { saved = JSON.parse(localStorage.getItem('friends.audio') || 'null'); } catch { /* Storage is optional. */ }
  function persist() {
    try { localStorage.setItem('friends.audio', JSON.stringify({ playing: wanted, time: audio.currentTime })); } catch { /* Playback remains available. */ }
  }
  function update() {
    button.setAttribute('aria-pressed', String(!audio.paused));
    button.innerHTML = `<span aria-hidden="true">${audio.paused ? '▶' : 'Ⅱ'}</span> ${audio.paused ? 'Escuchar intro' : 'Pausar intro'}`;
    equalizer.classList.toggle('playing', !audio.paused);
  }
  async function play() {
    button.disabled = true;
    try { await audio.play(); status.textContent = 'Tu canción sigue mientras recorrés Friends.'; }
    catch { status.textContent = 'Tocá Escuchar intro para retomar la canción.'; }
    finally { button.disabled = false; update(); }
  }
  button.addEventListener('click', () => { if (audio.paused) play(); else audio.pause(); });
  audio.addEventListener('play', () => { wanted = true; update(); persist(); });
  audio.addEventListener('pause', () => { wanted = false; update(); persist(); });
  audio.addEventListener('timeupdate', persist);
  audio.addEventListener('error', () => { update(); status.textContent = 'No se pudo cargar la intro. Volvé a intentarlo.'; });
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persist();
  });
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
