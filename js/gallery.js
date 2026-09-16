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
  let returnFocus = opener;
  let current = 0,
    automatic = !reduced.matches,
    hovered = false;
  let rendered = false;
  const on = (element, type, listener) =>
    element.addEventListener(type, (e) => {
      if (type === "click") e.stopPropagation();
      listener(e);
    }, { signal });
  scenes.forEach((scene) => {
    const preloaded = new Image();
    preloaded.src = scene.src || `img/galeria/${scene.file}`;
  });
  function render() {
    const scene = scenes[current];
    const src = scene.src || `img/galeria/${scene.file}`;
    image.classList.toggle("fade-out", rendered);
    large.classList.toggle("fade-out", rendered);
    if (rendered) {
      image.getBoundingClientRect();
      large.getBoundingClientRect();
    }
    image.src = large.src = src;
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
    if (manual) automatic = false;
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
