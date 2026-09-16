Friends.initHero = function (main, signal) {
  const hero = main.querySelector('.home-hero');
  if (!hero) return () => {};
  const image = hero.querySelector('.hero-background');
  const logo = main.querySelector('.flying-logo');
  const target = document.querySelector('.brand img');
  const copy = hero.querySelector('.hero-copy');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = [], animations = [];
  let finished = false, started = false;
  copy.classList.remove('is-visible');
  const phase = value => {
    hero.dataset.intro = value;
    hero.classList.toggle('is-monochrome', value !== 'color');
  };
  const cleanup = () => {
    timers.forEach(clearTimeout);
    animations.forEach(animation => animation.cancel());
    logo.hidden = true;
    target.style.opacity = '';
  };
  const finish = () => {
    finished = true;
    cleanup();
    phase('finished');
    copy.classList.add('is-visible');
  };
  async function play() {
    if (signal.aborted || finished) return;
    if (reduced.matches || document.hidden || scrollY > 80) return finish();
    phase('flying'); logo.hidden = false; target.style.opacity = '0';
    timers.push(setTimeout(() => copy.classList.add('is-visible'), 600));
    const animate = (frames, options) => {
      const animation = logo.animate(frames, { fill: 'forwards', ...options });
      animations.push(animation);
      return animation.finished;
    };
    try {
      await animate([
        { transform: 'translate(calc(-50% - 85vw), calc(-50% + 30vh)) rotate(-18deg) scale(.7)', opacity: 0 },
        { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 }
      ], { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' });
      if (finished || signal.aborted) return;
      await animate([{ opacity: 1 }, { opacity: 1 }], { duration: 550 });
      if (finished || signal.aborted) return;
      const from = logo.getBoundingClientRect(), to = target.getBoundingClientRect();
      const dx = to.x + to.width / 2 - from.x - from.width / 2;
      const dy = to.y + to.height / 2 - from.y - from.height / 2;
      phase('docking');
      await animate([{ transform: 'translate(-50%, -50%) scale(1)' }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${to.width / from.width})` }], { duration: 1050, easing: 'cubic-bezier(.65,0,.35,1)' });
      if (!signal.aborted) finish();
    } catch { if (!signal.aborted) finish(); }
  }
  function start() {
    if (started || finished) return;
    started = true;
    if (reduced.matches) finish(); else timers.push(setTimeout(play, 1500));
  }
  image.addEventListener('load', start, { signal });
  image.addEventListener('error', finish, { signal });
  window.addEventListener('scroll', () => { if (scrollY > 80) finish(); }, { passive: true, signal });
  window.addEventListener('resize', () => { if (!logo.hidden) finish(); }, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, { signal });
  reduced.addEventListener('change', () => { if (reduced.matches) finish(); }, { signal });
  if (image.complete) start();
  return cleanup;
};
