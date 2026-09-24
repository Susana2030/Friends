/* Un motor por vista. El router llama a cleanup al reemplazar el contenido. */
Friends.initVisualEffects = function (main, signal) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
  const tiltSelector = '.card, .character-card, .gallery-item, .scene-index button, .memory-frame';
  const cards = [...main.querySelectorAll(tiltSelector)];
  const stickers = [...main.querySelectorAll('.theme-sticker')];
  let stickerBounds;
  // Hit-test decorative images without making them intercept links or taps.
  function stickerAt(x, y) {
    stickerBounds ||= stickers.map(node => ({ node, rect: node.getBoundingClientRect() }));
    return stickerBounds.find(({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)?.node;
  }
  const characters = [...main.querySelectorAll('.character-card')];
  const targets = [...new Set([...cards, ...main.querySelectorAll('.perk-stats, .actor-section, .season-media, .contact-note')])];
  const animations = new Map();
  let observer, frame = 0;
  let activeCard, bounds, pointer, tiltDirty = false;
  const canMove = () => desktop.matches && !reduced.matches && !document.hidden;

  // Reveal con translate independiente: no compite con el transform del tilt.
  if (!reduced.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
    observer = new IntersectionObserver(entries => {
      if (signal.aborted || reduced.matches) return;
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        const lateral = target.matches('.season-media');
        target.classList.remove('motion-pending');
        animations.get(target)?.cancel();
        const animation = target.animate([
          { opacity: 0, translate: lateral ? '24px 0' : '0 20px' },
          { opacity: 1, translate: '0 0' }
        ], { duration: 550, delay: Math.max(0, characters.indexOf(target)) * 75, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards' });
        animations.set(target, animation);
        animation.onfinish = () => animations.delete(target);
        if (!lateral) observer.unobserve(target);
      });
    }, { threshold: 0.08 });
    targets.forEach(target => { target.classList.add('motion-pending'); observer.observe(target); });
  }
  function stopReveals() {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    targets.forEach(target => target.classList.remove('motion-pending'));
  }
  function resetTilt() {
    if (activeCard) {
      activeCard.classList.remove('is-tilting');
      activeCard.style.removeProperty('--tilt-x');
      activeCard.style.removeProperty('--tilt-y');
    }
    activeCard = null;
    bounds = null;
    tiltDirty = false;
  }
  // Un frame por movimiento del puntero; sin canvas ni bucle continuo.
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function render() {
    frame = 0;
    if (!canMove()) { stopMotion(); return; }
    if (activeCard && tiltDirty) {
      const x = Math.max(-1, Math.min(1, (pointer.x - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (pointer.y - bounds.top) / bounds.height * 2 - 1));
      activeCard.style.setProperty('--tilt-x', `${-y * 4}deg`);
      activeCard.style.setProperty('--tilt-y', `${x * 4}deg`);
      activeCard.classList.add('is-tilting');
      tiltDirty = false;
    }
  }
  function stopMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    resetTilt();
  }
  if (!cards.length && !stickers.length) {
    reduced.addEventListener('change', () => { if (reduced.matches) stopReveals(); }, { signal });
    return stopReveals;
  }
  [...cards, ...stickers].forEach(card => card.classList.add('premium-tilt'));
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !canMove()) return;
    const candidate = event.target.closest?.(tiltSelector);
    const card = candidate && main.contains(candidate) ? candidate : stickerAt(event.clientX, event.clientY);
    if (card !== activeCard) {
      resetTilt();
      activeCard = card;
      if (card) bounds = card.getBoundingClientRect();
    }
    pointer = { x: event.clientX, y: event.clientY };
    tiltDirty = !!activeCard;
    if (tiltDirty) schedule();
  }, { signal, passive: true });
  document.addEventListener('pointerout', event => {
    if (activeCard && !activeCard.contains(event.relatedTarget)) resetTilt();
    if (!event.relatedTarget) stopMotion();
  }, { signal, passive: true });
  window.addEventListener('scroll', () => { stickerBounds = null; resetTilt(); }, { signal, passive: true });
  window.addEventListener('resize', () => { stickerBounds = null; stopMotion(); }, { signal, passive: true });
  window.addEventListener('blur', stopMotion, { signal });
  desktop.addEventListener('change', stopMotion, { signal });
  reduced.addEventListener('change', () => { stopMotion(); if (reduced.matches) stopReveals(); }, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMotion(); }, { signal });
  return () => {
    stopMotion(); stopReveals();
    [...cards, ...stickers].forEach(card => card.classList.remove('premium-tilt'));
  };
};
