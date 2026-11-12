const CLAVE_TEMA = 'kodelo.tema';

export function temaActual() {
  return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
}

export function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {}
  document.dispatchEvent(new CustomEvent('cambio-tema', { detail: tema }));
}

export function iniciarBotonTema(boton) {
  const icono = boton.querySelector('img');
  const pintar = () => {
    const oscuro = temaActual() === 'oscuro';
    icono.src = oscuro ? '/img/icono-sol.svg' : '/img/icono-luna.svg';
    boton.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  };
  boton.addEventListener('click', () => {
    aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro');
    pintar();
  });
  pintar();
}
