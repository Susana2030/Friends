// Una pregunta visible, bloqueo de respuestas duplicadas y temporizadores cancelables.
Friends.initQuiz = function (main, signal) {
  const quiz = main.querySelector('#friends-quiz');
  if (!quiz) return () => {};
  const questions = [...quiz.querySelectorAll('fieldset')];
  const progress = quiz.querySelector('#quiz-progress');
  const meter = quiz.querySelector('progress');
  const feedback = quiz.querySelector('#quiz-feedback');
  const result = quiz.querySelector('#quiz-result');
  const restart = quiz.querySelector('#quiz-restart');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, score = 0, locked = false, timer;
  function showQuestion(focus = false) {
    questions.forEach((question, index) => {
      question.hidden = index !== current;
      question.disabled = index !== current;
    });
    feedback.textContent = '';
    progress.textContent = `Pregunta ${current + 1} de ${questions.length}`;
    meter.value = current;
    const heading = questions[current].querySelector('legend');
    heading.tabIndex = -1;
    if (focus) heading.focus({ preventScroll: true });
  }
  function advance(question) {
    question.classList.remove('is-leaving');
    current++;
    if (current < questions.length) showQuestion(true);
    else {
      question.hidden = true;
      feedback.textContent = '';
      meter.value = questions.length;
      progress.textContent = '¡Episodio completado!';
      result.hidden = false;
      result.textContent = `Acertaste ${score} de ${questions.length}. ${score === questions.length ? '¡Conocés muy bien a estos amigos!' : 'Siempre hay una excusa para volver a Central Perk.'}`;
      result.dataset.celebrate = String(score / questions.length >= 0.75);
      if (score / questions.length >= 0.75) Friends.audioManager?.play('laugh');
      restart.hidden = false;
      result.focus({ preventScroll: true });
    }
    locked = false;
  }
  quiz.addEventListener('submit', event => event.preventDefault(), { signal });
  quiz.addEventListener('change', event => {
    const input = event.target;
    const question = questions[current];
    if (locked || !question || !input.matches('input[type="radio"]') || !question.contains(input)) return;
    locked = true;
    const correct = input.value === question.dataset.answer;
    if (correct) score++;
    question.disabled = true;
    const answer = question.querySelector(`input[value="${question.dataset.answer}"]`);
    answer.closest('label').classList.add('is-correct');
    if (!correct) input.closest('label').classList.add('is-incorrect');
    feedback.textContent = correct ? '¡Correcto!' : `La respuesta correcta es ${answer.closest('label').textContent.trim()}.`;
    Friends.audioManager?.play(correct ? 'success' : 'error');
    // Se mantiene el feedback el tiempo suficiente para verlo antes de avanzar.
    timer = setTimeout(() => {
      if (reduced.matches) advance(question);
      else {
        question.classList.add('is-leaving');
        timer = setTimeout(() => advance(question), 260);
      }
    }, 850);
  }, { signal });
  restart.addEventListener('click', () => {
    clearTimeout(timer);
    quiz.reset();
    current = 0; score = 0; locked = false;
    questions.forEach(question => {
      question.classList.remove('is-leaving');
      question.querySelectorAll('label').forEach(label => label.classList.remove('is-correct', 'is-incorrect'));
    });
    result.hidden = true; restart.hidden = true;
    Friends.audioManager?.play('click');
    showQuestion(true);
  }, { signal });
  showQuestion();
  return () => clearTimeout(timer);
};
