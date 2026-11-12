(function () {
  var tema = null;
  try {
    tema = localStorage.getItem('kodelo.tema');
  } catch (e) {}
  if (!tema && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    tema = 'oscuro';
  }
  if (tema) {
    document.documentElement.dataset.tema = tema;
  }
})();
