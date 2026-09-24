// Pruebas de lógica con APIs del navegador simuladas; ejecutar: node --test tests/premium.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function element() {
  const events = new Map(), attributes = new Map(), classes = new Set();
  return {
    hidden: false, disabled: false, textContent: '', dataset: {},
    classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n), toggle(n, value) { if (value ?? !classes.has(n)) classes.add(n); else classes.delete(n); } },
    setAttribute: (k, v) => attributes.set(k, v), getAttribute: k => attributes.get(k),
    removeAttribute: k => attributes.delete(k),
    addEventListener(type, fn) { events.set(type, [...(events.get(type) || []), fn]); },
    emit(type, event = {}) { return Promise.all((events.get(type) || []).map(fn => fn(event))); },
    focus() { this.focused = true; },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
}
function clock() {
  let now = 0, id = 0;
  const jobs = new Map();
  const add = (fn, delay, repeat = 0) => { jobs.set(++id, { fn, at: now + delay, repeat }); return id; };
  return {
    get now() { return now; }, jobs,
    setTimeout: (fn, delay) => add(fn, delay), clearTimeout: id => jobs.delete(id),
    setInterval: (fn, delay) => add(fn, delay, delay), clearInterval: id => jobs.delete(id),
    tick(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...jobs].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [key, job] = next;
        now = job.at;
        if (job.repeat) job.at += job.repeat; else jobs.delete(key);
        job.fn();
      }
      now = end;
    }
  };
}
function load(file, globals = {}) {
  const context = vm.createContext({ Friends: {}, ...globals });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
  return context;
}

test('audio: opt-in, persistencia, límite de voces y mute inmediato', async () => {
  const document = element(), controls = [], oscillators = [], contexts = [], storage = new Map();
  document.body = { append: node => controls.push(node) };
  document.createElement = element;
  const parameter = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; contexts.push(this); }
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    createGain() { return { gain: parameter(), connect() {}, disconnect() {} }; }
    createOscillator() {
      const oscillator = { frequency: parameter(), connect() {}, disconnect() {}, start() {}, stop(at) { if (at === undefined) this.stopped = true; } };
      oscillators.push(oscillator); return oscillator;
    }
  }
  const context = load('audioManager.js', {
    window: { AudioContext }, document, performance: { now: () => 1000 },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) }
  });
  const manager = context.Friends.initAudioManager();
  manager.play('laugh'); assert.equal(contexts.length, 0);
  assert.equal(manager.enabled, false);
  await controls[0].emit('click');
  assert.equal(manager.enabled, true);
  assert.equal(storage.get('friends.sound.enabled'), 'true');
  for (let i = 0; i < 20; i++) manager.play('laugh');
  assert.equal(oscillators.length, 24);
  await controls[0].emit('click');
  assert.ok(oscillators.every(voice => voice.stopped));
  assert.equal(contexts[0].state, 'suspended');
  assert.equal(manager.enabled, false);
  assert.equal(context.Friends.initAudioManager(), manager);
  assert.equal(controls.length, 1);
});

test('audio: almacenamiento y Web Audio no disponibles no bloquean el sitio', async () => {
  const document = element(), controls = [];
  document.body = { append: node => controls.push(node) }; document.createElement = element;
  const context = load('audioManager.js', { window: {}, document, performance: { now: () => 0 }, localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } } });
  const manager = context.Friends.initAudioManager();
  await controls[0].emit('click'); assert.equal(manager.enabled, false);
});

function quizFixture() {
  const timer = clock(), quiz = element(), progress = element(), meter = element(), feedback = element(), result = element(), restart = element(), sounds = [];
  const questions = Array.from({ length: 8 }, (_, i) => {
    const question = element(), heading = element(); question.dataset.answer = String(i % 3);
    question.inputs = Array.from({ length: 3 }, (_, index) => {
      const label = element(); label.textContent = `Respuesta ${index}`;
      return { value: String(index), closest: () => label, matches: () => true };
    });
    question.contains = input => question.inputs.includes(input);
    question.querySelector = selector => selector === 'legend' ? heading : question.inputs.find(input => selector.includes(`"${input.value}"`));
    question.querySelectorAll = () => question.inputs.map(input => input.closest());
    return question;
  });
  quiz.querySelectorAll = () => questions; quiz.reset = () => {};
  quiz.querySelector = selector => ({ '#quiz-progress': progress, progress: meter, '#quiz-feedback': feedback, '#quiz-result': result, '#quiz-restart': restart })[selector];
  const context = load('quiz.js', { ...timer, matchMedia: () => ({ matches: false }) });
  context.Friends.audioManager = { play: name => sounds.push(name) };
  const cleanup = context.Friends.initQuiz({ querySelector: () => quiz }, {});
  return { timer, quiz, questions, result, restart, progress, sounds, cleanup };
}
for (const score of [0, 5, 6, 8]) test(`quiz: ${score}/8, umbral del 75%, doble clic y reinicio`, async () => {
  const fixture = quizFixture();
  const { timer, quiz, questions, result, restart, progress, sounds, cleanup } = fixture;
  for (let i = 0; i < questions.length; i++) {
    assert.equal(questions.filter(q => !q.hidden).length, 1);
    const answer = Number(questions[i].dataset.answer);
    const event = { target: questions[i].inputs[i < score ? answer : (answer + 1) % 3] };
    await quiz.emit('change', event); await quiz.emit('change', event);
    timer.tick(1110);
  }
  assert.match(result.textContent, new RegExp(`${score} de 8`));
  assert.equal(sounds.filter(sound => sound === 'laugh').length, score >= 6 ? 1 : 0);
  await restart.emit('click');
  assert.equal(progress.textContent, 'Pregunta 1 de 8'); assert.equal(result.hidden, true);
  assert.ok(questions.every(q => q.inputs.every(input => !input.closest().classList.contains('is-correct'))));
  await quiz.emit('change', { target: questions[0].inputs[0] }); cleanup(); timer.tick(5000);
  assert.equal(progress.textContent, 'Pregunta 1 de 8'); assert.equal(timer.jobs.size, 0);
});

test('contacto: validación, cuenta atrás de 5 segundos y limpieza al salir', async () => {
  const timer = clock(), form = element(), dialog = element(), submit = element(), label = element(), close = element(), countdown = element(), sounds = [];
  let valid = false; label.textContent = 'Enviar';
  const field = { value: 'Joey', minLength: 2, setCustomValidity(message) { this.error = message; } };
  submit.querySelector = () => label; form.querySelector = () => submit; form.querySelectorAll = () => [field]; form.reportValidity = () => valid && !field.error;
  dialog.querySelector = selector => selector === '[data-countdown]' ? countdown : close;
  dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; void dialog.emit('close'); };
  const context = load('contacto.js', { ...timer, performance: { now: () => timer.now } });
  context.Friends.audioManager = { play: name => sounds.push(name) };
  const cleanup = context.Friends.initContacto({ querySelector: selector => selector === '#contact-form' ? form : dialog }, {});
  await form.emit('submit', { preventDefault() {} }); assert.ok(!dialog.open); assert.equal(sounds.length, 0);
  valid = true;
  await form.emit('submit', { preventDefault() {} }); assert.equal(countdown.textContent, '5'); assert.equal(dialog.open, true);
  timer.tick(4000); assert.equal(countdown.textContent, '1');
  timer.tick(999); assert.equal(dialog.open, true);
  timer.tick(1); assert.equal(dialog.open, false); assert.equal(timer.jobs.size, 0);
  await form.emit('input', { target: field }); assert.equal(label.textContent, 'Enviar');
  await form.emit('submit', { preventDefault() {} }); cleanup();
  assert.equal(dialog.open, false); assert.equal(timer.jobs.size, 0); assert.deepEqual(sounds, ['laugh', 'laugh']);
});

test('visual: desactiva el tilt en móvil y con movimiento reducido', async () => {
  for (const mobile of [true, false]) {
    const document = element(), window = element();
    document.createElement = () => { throw Error('No se debe crear canvas'); };
    const media = matches => ({ matches, addEventListener() {} });
    const context = load('visualEffects.js', {
      document, window, Element: { prototype: {} },
      matchMedia: query => media(query.includes('reduced') ? !mobile : !mobile),
      cancelAnimationFrame() {}, requestAnimationFrame() { throw Error('No debe iniciar render'); }
    });
    const cleanup = context.Friends.initVisualEffects({ querySelectorAll: () => [] }, {});
    await document.emit('pointermove', { pointerType: 'mouse', target: {}, clientX: 10, clientY: 20 }); cleanup();
  }
});

test('visual: tilt en escritorio sin crear overlays, un frame por evento y retorno suave', async () => {
  const document = element(), window = element(), card = element(), styles = new Map(), jobs = new Map();
  let id = 0;
  document.createElement = () => { throw Error('El cursor no debe crear elementos'); };
  card.style = { setProperty: (k, v) => styles.set(k, v), removeProperty: k => styles.delete(k) };
  card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
  card.contains = target => target === card;
  const context = load('visualEffects.js', {
    document, window, Element: { prototype: {} },
    matchMedia: query => ({ matches: !query.includes('reduced'), addEventListener() {} }),
    requestAnimationFrame(fn) { jobs.set(++id, fn); return id; },
    cancelAnimationFrame(key) { jobs.delete(key); }
  });
  const cleanup = context.Friends.initVisualEffects({ querySelectorAll: () => [card], contains: target => target === card }, {});
  const event = { pointerType: 'mouse', target: { closest: () => card }, clientX: 100, clientY: 50 };
  await document.emit('pointermove', event);
  await document.emit('pointermove', event);
  assert.equal(jobs.size, 1);
  const [key, draw] = [...jobs][0]; jobs.delete(key); draw();
  assert.equal(styles.get('--tilt-y'), '4deg');
  assert.equal(jobs.size, 0);
  await document.emit('pointerout', { relatedTarget: null });
  assert.equal(styles.size, 0);
  await document.emit('pointermove', event); cleanup();
  assert.equal(jobs.size, 0); assert.equal(styles.size, 0);
});

test('temporadas: selección, enlace profundo y desplazamiento al selector', async () => {
  const select = element(), status = element(), browser = element(), year = element(), window = element();
  const seasons = Array.from({ length: 10 }, (_, i) => Object.assign(element(), { id: `temporada${i + 1}` }));
  const links = seasons.map(season => Object.assign(element(), { hash: '#' + season.id }));
  const location = { hash: '#temporada4', pathname: '/temporadas.html', search: '', protocol: 'http:' };
  let destination, scroll;
  browser.scrollIntoView = options => { scroll = options; };
  const context = load('main.js', {
    document: { querySelectorAll: selector => selector === '[data-current-year]' ? [year] : links },
    location, window, history: { replaceState(_state, _title, url) { destination = url; } },
    matchMedia: () => ({ matches: false })
  });
  context.Friends.initMain({
    querySelector: selector => ({ '#season-select': select, '#season-status': status, '.season-browser': browser })[selector],
    querySelectorAll: () => seasons
  }, {});
  assert.equal(select.value, 'temporada4');
  assert.equal(seasons.filter(season => !season.hidden).length, 1);
  assert.equal(links[3].getAttribute('aria-current'), 'page');
  select.value = 'temporada10'; await select.emit('change');
  assert.equal(seasons[9].hidden, false); assert.equal(scroll.block, 'start');
  assert.equal(destination, '/temporadas.html#temporada10');
  location.hash = '#inexistente'; await window.emit('hashchange');
  assert.equal(select.value, 'temporada1'); assert.match(year.textContent, /^\d{4}$/);
});

test('intro: reproducir/pausar conserva su markup y limita las escrituras de progreso', async () => {
  const document = element(), window = element(), button = element(), label = element(), symbol = element(), status = element(), audio = element();
  let now = 0, writes = 0;
  audio.paused = true; audio.currentTime = 0;
  audio.play = async () => { audio.paused = false; await audio.emit('play'); };
  audio.pause = () => { audio.paused = true; void audio.emit('pause'); };
  button.querySelector = selector => selector === '.player-text' ? label : symbol;
  document.createElement = () => audio; document.body = { append() {} };
  document.querySelector = selector => selector === '#audio-toggle' ? button : status;
  const context = load('audio.js', { document, window, performance: { now: () => now }, localStorage: { getItem: () => null, setItem() { writes++; } } });
  context.Friends.initAudio();
  await button.emit('click'); await new Promise(setImmediate);
  assert.equal(button.getAttribute('aria-pressed'), 'true'); assert.equal(label.textContent, 'Pausar intro');
  assert.equal(button.classList.contains('is-playing'), true);
  const initial = writes;
  for (let i = 0; i < 4; i++) { now += 1000; await audio.emit('timeupdate'); }
  assert.equal(writes, initial);
  now = 5000; await audio.emit('timeupdate'); assert.equal(writes, initial + 1);
  await button.emit('click');
  assert.equal(button.getAttribute('aria-pressed'), 'false'); assert.equal(label.textContent, 'Escuchar intro');
  assert.equal(button.innerHTML, undefined);
});


test('visual: decorative tilt uses coordinates without intercepting pointer targets', async () => {
  const document = element(), window = element(), sticker = element(), styles = new Map(), jobs = new Map();
  let id = 0;
  sticker.style = { setProperty: (k, v) => styles.set(k, v), removeProperty: k => styles.delete(k) };
  sticker.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 });
  const context = load('visualEffects.js', {
    document, window, Element: { prototype: {} },
    matchMedia: query => ({ matches: !query.includes('reduced'), addEventListener() {} }),
    requestAnimationFrame(fn) { jobs.set(++id, fn); return id; }, cancelAnimationFrame(key) { jobs.delete(key); }
  });
  const cleanup = context.Friends.initVisualEffects({ querySelectorAll: selector => selector === '.theme-sticker' ? [sticker] : [], contains: () => false }, {});
  await document.emit('pointermove', { pointerType: 'mouse', target: {}, clientX: 90, clientY: 50 });
  assert.equal(jobs.size, 1);
  const [key, draw] = [...jobs][0]; jobs.delete(key); draw();
  assert.equal(styles.get('--tilt-y'), '3.2deg');
  await document.emit('pointermove', { pointerType: 'mouse', target: {}, clientX: 200, clientY: 200 });
  assert.equal(styles.size, 0);
  cleanup();
  assert.equal(sticker.classList.contains('premium-tilt'), false);
});
