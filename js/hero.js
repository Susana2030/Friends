Friends.initHero = function (main, signal) {
  main.querySelector('.hero-copy')?.classList.add('is-visible');
  if (!main.querySelector('.home-hero')) return () => {};
  const logo = document.querySelector('.brand img');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let animation, clone;
  function clean() {
    animation?.cancel();
    clone?.remove();
    logo.style.visibility = '';
  }
  function start() {
    if (signal.aborted || reduced.matches || !logo.animate) return;
    const box = logo.getBoundingClientRect();
    if (!box.width || !box.height) return;
    clone = logo.cloneNode();
    clone.alt = '';
    clone.setAttribute('aria-hidden', 'true');
    clone.className = 'logo-intro';
    Object.assign(clone.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    document.body.append(clone);
    logo.style.visibility = 'hidden';
    const scale = Math.min(3, innerWidth * .78 / box.width);
    const centered = `translate(${innerWidth / 2 - box.left - box.width / 2}px, ${innerHeight / 2 - box.top - box.height / 2}px) scale(${scale})`;
    animation = clone.animate([
      { transform: centered, opacity: 0, offset: 0 },
      { transform: centered, opacity: 1, offset: .18 },
      { transform: centered, opacity: 1, offset: .35 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 1 }
    ], { duration: 1700, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });
    animation.onfinish = clean;
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true, signal });
  window.addEventListener('resize', clean, { signal });
  window.addEventListener('scroll', clean, { signal, passive: true });
  reduced.addEventListener('change', clean, { signal });
  return clean;
};
