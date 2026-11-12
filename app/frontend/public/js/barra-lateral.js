import { cerrarSesion, leerSesion } from './api.js';
import { aplicarTema, temaActual } from './tema.js';

let temporizadorToast;

export function mostrarToast(mensaje, tipo = '') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  toast.textContent = mensaje;
  toast.className = `toast toast--visible${tipo ? ` toast--${tipo}` : ''}`;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => toast.classList.remove('toast--visible'), 3200);
}

const SECCIONES_ADMIN = [
  { href: '/admin-cuentas', texto: 'Cuentas', icono: 'cuentas', roles: ['ADMIN', 'MODERADOR'] },
  { href: '/admin-tienda', texto: 'Tienda', icono: 'etiqueta', roles: ['ADMIN'] },
  { href: '/admin-problemas', texto: 'Problemas', icono: 'problemas', roles: ['ADMIN'] },
  { href: '/admin-kody', texto: 'KODY', icono: 'kody', roles: ['ADMIN'] },
];

function crearEnlaceAdmin({ href, texto, icono }) {
  const enlace = document.createElement('a');
  enlace.className = 'nav__enlace';
  enlace.href = href;
  if (window.location.pathname.replace(/\.html$/, '') === href) {
    enlace.setAttribute('aria-current', 'page');
  }
  if (icono === 'kody') {
    const imagen = document.createElement('img');
    imagen.src = '/img/kody.svg';
    imagen.width = 24;
    imagen.height = 24;
    imagen.alt = '';
    imagen.className = 'nav__kody';
    enlace.append(imagen);
  } else {
    const simbolo = document.createElement('span');
    simbolo.className = `icono icono--${icono}`;
    simbolo.setAttribute('aria-hidden', 'true');
    enlace.append(simbolo);
  }
  const etiqueta = document.createElement('span');
  etiqueta.className = 'nav__texto';
  etiqueta.textContent = texto;
  enlace.append(etiqueta);
  const elemento = document.createElement('li');
  elemento.append(enlace);
  return elemento;
}

function pintarAdministracion() {
  const rol = leerSesion()?.usuario?.rol;
  const visibles = SECCIONES_ADMIN.filter((seccion) => seccion.roles.includes(rol));
  if (!visibles.length) {
    return;
  }
  const titulo = document.createElement('p');
  titulo.className = 'nav__grupo';
  titulo.id = 'nav-admin';
  titulo.textContent = 'Administración';
  const lista = document.createElement('ul');
  lista.className = 'navegacion navegacion--admin';
  lista.setAttribute('aria-labelledby', 'nav-admin');
  lista.append(...visibles.map(crearEnlaceAdmin));
  document.querySelector('.navegacion').after(titulo, lista);
}

export function iniciarBarraLateral() {
  pintarAdministracion();

  const botonTema = document.getElementById('boton-tema');
  const pintarTema = () => {
    const oscuro = temaActual() === 'oscuro';
    botonTema.querySelector('.icono').className = `icono icono--${oscuro ? 'sol' : 'luna'}`;
    botonTema.querySelector('.nav__texto').textContent = oscuro ? 'Modo claro' : 'Modo oscuro';
  };
  botonTema.addEventListener('click', () => {
    aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro');
    pintarTema();
  });
  pintarTema();

  document.getElementById('boton-salir').addEventListener('click', cerrarSesion);

  document.querySelectorAll('.nav__enlace--pronto').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      mostrarToast(`${enlace.dataset.seccion} llegará en una próxima versión de KODELO`);
    });
  });
}
