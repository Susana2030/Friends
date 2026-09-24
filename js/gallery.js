Friends.initGallery = function (main, signal) {
  const carousel = main.querySelector(".memory-carousel");
  if (!carousel) return () => {};
  const scenes = Friends.scenes,
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const image = main.querySelector(".memory-slide"),
    caption = main.querySelector("#memory-caption");
  const dialog = main.querySelector("dialog"),
    large = dialog.querySelector(".lightbox-slide");
  const buttons = [...main.querySelectorAll(".scene-index button")];
  const [automaticButton, opener] = main.querySelectorAll(
    ".carousel-actions button",
  );
  const frame = main.querySelector(".memory-frame");
  const stage = main.querySelector('.gallery-stage');
  const featuredBadge = stage.querySelector('.gallery-featured-badge');
  let returnFocus = opener;
  let current = 0,
    automatic = false,
    hovered = false;
  let rendered = false;
  const on = (element, type, listener) =>
    element.addEventListener(type, (e) => {
      if (type === "click") e.stopPropagation();
      listener(e);
    }, { signal });
  // Las mismas escenas alimentan las miniaturas y el visor.
  buttons.forEach((button, index) => {
    const thumbnail = document.createElement('img');
    thumbnail.src = scenes[index].src;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    thumbnail.width = 320;
    thumbnail.height = 200;
    const crop = document.createElement('span');
    crop.className = 'scene-thumbnail';
    crop.append(thumbnail);
    button.prepend(crop);
    if (index === 0) {
      button.classList.add('gallery-featured-item');
      const badge = document.createElement('span');
      badge.className = 'gallery-featured-badge';
      badge.textContent = '★ Momento Icónico';
      button.append(badge);
    }
    on(thumbnail, 'error', () => { thumbnail.hidden = true; });
  });
  const placeholder = document.createElement('div');
  placeholder.className = 'memory-placeholder';
  placeholder.hidden = true;
  placeholder.setAttribute('role', 'img');
  image.after(placeholder);
  const largePlaceholder = placeholder.cloneNode();
  large.after(largePlaceholder);
  [[image, placeholder], [large, largePlaceholder]].forEach(([photo, fallback]) => {
    on(photo, 'error', () => {
      photo.hidden = true;
      fallback.hidden = false;
    });
  });
function render() {
    const scene = scenes[current];
    // El distintivo pertenece a la puerta, no a las otras fotos del carrusel.
    stage.classList.toggle('gallery-featured-item', current === 0);
    featuredBadge.hidden = current !== 0;
    const src = scene.src || `img/galeria/${scene.file}`;
    image.classList.toggle("fade-out", rendered);
    large.classList.toggle("fade-out", rendered);
    if (rendered) {
      image.getBoundingClientRect();
      large.getBoundingClientRect();
    }
    image.src = large.src = src;
    image.hidden = large.hidden = false;
    placeholder.hidden = largePlaceholder.hidden = true;
    [placeholder, largePlaceholder].forEach(fallback => {
      fallback.textContent = '☕ ' + scene.title;
      fallback.setAttribute('aria-label', scene.title + ' · Imagen no disponible');
    });
    image.alt = large.alt = scene.alt;
    image.classList.remove("fade-out");
    large.classList.remove("fade-out");
    caption.textContent = `${String(current + 1).padStart(2, "0")} / 06 · ${scene.title}`;
    caption.setAttribute("aria-live", automatic ? "off" : "polite");
    dialog.querySelector("figcaption").textContent = scene.title;
    buttons.forEach((button, index) =>
      button.setAttribute("aria-pressed", String(index === current)),
    );
    automaticButton.textContent = automatic
      ? "Ⅱ Pausar carrusel"
      : "▶ Reproducir carrusel";
    automaticButton.setAttribute("aria-pressed", String(automatic));
    rendered = true;
  }
  function select(index, manual = true) {
    current = (index + scenes.length) % scenes.length;
    if (manual) { automatic = false; Friends.audioManager?.play('click'); }
    render();
  }
  on(main.querySelector('[aria-label="Foto anterior"]'), "click", () =>
    select(current - 1),
  );
  on(main.querySelector('[aria-label="Foto siguiente"]'), "click", () =>
    select(current + 1),
  );
  on(dialog.querySelector(".lightbox-prev"), "click", () =>
    select(current - 1),
  );
  on(dialog.querySelector(".lightbox-next"), "click", () =>
    select(current + 1),
  );
  buttons.forEach((button, index) => on(button, "click", () => select(index)));
  on(automaticButton, "click", () => {
    automatic = !automatic;
    render();
  });
  const openLightbox = (event) => {
    returnFocus = event.currentTarget;
    automatic = false;
    render();
    dialog.showModal();
    Friends.audioManager?.play('door');
    document.body.classList.add("modal-open");
  };
  on(opener, "click", openLightbox);
  on(frame, "click", openLightbox);
  on(dialog.querySelector(".lightbox-close"), "click", () => dialog.close());
  on(dialog, "click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  on(dialog, "close", () => {
    document.body.classList.remove("modal-open");
    Friends.audioManager?.play('door');
    if (returnFocus.isConnected) returnFocus.focus();
  });
  const keyboard = (event) => {
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      select(current + (event.key === "ArrowLeft" ? -1 : 1));
    }
  };
  on(carousel, "keydown", keyboard);
  on(dialog, "keydown", keyboard);
  on(carousel, "mouseenter", () => {
    hovered = true;
  });
  on(carousel, "mouseleave", () => {
    hovered = false;
  });
  on(reduced, "change", () => {
    if (reduced.matches) {
      automatic = false;
      render();
    }
  });
  const timer = setInterval(() => {
    if (
      automatic &&
      !document.hidden &&
      !hovered &&
      !carousel.contains(document.activeElement) &&
      !dialog.open
    )
      select(current + 1, false);
  }, 5000);
  render();
  return () => {
    clearInterval(timer);
    if (dialog.open) dialog.close();
    document.body.classList.remove("modal-open");
  };
};
