Friends.initMain = function (main, signal) {
  const select = main.querySelector('#season-select');
  if (select) {
    const seasons = [...main.querySelectorAll('.season-card')];
    function showSeason(id) {
      const chosen = seasons.find(season => season.id === id) || seasons[0];
      seasons.forEach(season => {
        season.hidden = season !== chosen;
      });
      select.value = chosen.id;
      document.querySelectorAll('.season-options a').forEach(link => {
        if (link.hash === '#' + chosen.id) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      main.querySelector('#season-status').textContent = `Mostrando temporada ${seasons.indexOf(chosen) + 1} de ${seasons.length}.`;
    }
    showSeason(location.hash.slice(1) || select.value);
    select.addEventListener('change', () => {
      showSeason(select.value);
      if (location.protocol !== 'file:') history.replaceState(null, '', location.pathname + location.search + '#' + select.value);
    }, { signal });
    window.addEventListener('hashchange', () => showSeason(location.hash.slice(1)), { signal });
  }
  const quiz = main.querySelector('#friends-quiz');
  if (quiz) quiz.addEventListener('submit', event => {
    event.preventDefault();
    const questions = [...quiz.querySelectorAll('fieldset')];
    const score = questions.filter(question => question.querySelector('input:checked')?.value === question.dataset.answer).length;
    const result = quiz.querySelector('#quiz-result');
    result.textContent = `Acertaste ${score} de ${questions.length}. ${score === questions.length ? '¡Conocés muy bien a estos amigos!' : 'Podés cambiar tus respuestas y volver a intentar.'}`;
    result.focus();
  }, { signal });
  return () => {};
};
