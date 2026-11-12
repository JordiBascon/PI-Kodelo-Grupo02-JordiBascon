import { api, exigirSesion } from './api.js';
import { iniciarBarraLateral, mostrarToast } from './barra-lateral.js';

const CLAVE_LENGUAJE = 'kodelo.lenguaje';
const SIGLAS = { Python: 'PY', JavaScript: 'JS', Java: 'JAVA', PHP: 'PHP', SQL: 'SQL', HTML: 'HTML', CSS: 'CSS' };

const $ = (id) => document.getElementById(id);

const estado = {
  perfil: null,
  lenguajes: [],
  seleccionado: null,
};

function conSigno(numero) {
  if (numero > 0) return `+${numero}`;
  if (numero < 0) return `−${Math.abs(numero)}`;
  return '0';
}

function claseTendencia(numero, base) {
  if (numero > 0) return `${base}--sube`;
  if (numero < 0) return `${base}--baja`;
  return '';
}

function datosDe(nombre) {
  const stats = estado.perfil.lenguajes.find((l) => l.lenguaje === nombre);
  const info = estado.lenguajes.find((l) => l.nombre === nombre);
  return { ...stats, problemas: info?.problemas ?? 0 };
}

function pintarCabecera() {
  const { nick, monedas, racha, eloSemana, duelos, victorias, fraseDelDia } = estado.perfil;

  $('saludo').textContent = `Hola, ${nick}. ¿Listo para el siguiente duelo?`;
  if (fraseDelDia) {
    $('frase-del-dia').textContent = `KODY dice: «${fraseDelDia}»`;
    $('frase-del-dia').hidden = false;
  }

  $('chip-racha').textContent = racha > 0 ? `Racha: ${racha} V` : 'Sin racha';
  const chipSemana = $('chip-semana');
  chipSemana.textContent = `${conSigno(eloSemana)} ELO esta semana`;
  chipSemana.className = `chip ${claseTendencia(eloSemana, 'chip')}`;

  $('monedas').textContent = `${monedas.toLocaleString('es-ES')} monedas`;
  $('avatar').textContent = nick.charAt(0).toUpperCase();
  $('avatar').title = nick;

  $('valor-victorias').textContent = duelos > 0 ? `${Math.round((victorias / duelos) * 100)}%` : '—';
  $('detalle-victorias').textContent = `${victorias} de ${duelos} duelos`;
}

function pintarSeleccion() {
  const nombre = estado.seleccionado;
  const datos = datosDe(nombre);
  const hayProblemas = datos.problemas > 0;
  const enlace = `/arena?lenguaje=${encodeURIComponent(nombre)}`;

  $('titulo-elo').textContent = `ELO en ${nombre}`;
  $('valor-elo').textContent = datos.elo;
  const detalleElo = $('detalle-elo');
  detalleElo.textContent = `${conSigno(datos.eloSemana)} esta semana`;
  detalleElo.className = `estadistica__detalle ${claseTendencia(datos.eloSemana, 'estadistica__detalle')}`;

  $('titulo-posicion').textContent = `Posición en ${nombre}`;
  $('valor-posicion').textContent = `#${datos.posicion}`;
  $('detalle-posicion').textContent = `de ${datos.jugadores} jugadores`;

  $('titulo-duelo').textContent = `Buscar rival de ${nombre}`;
  $('texto-duelo').textContent = `Te emparejamos con alguien que también ha elegido ${nombre} y tiene un ELO parecido (±100). 10 minutos, un problema.`;

  for (const boton of [$('boton-buscar'), $('boton-buscar-hero')]) {
    if (hayProblemas) {
      boton.href = enlace;
      boton.removeAttribute('aria-disabled');
    } else {
      boton.removeAttribute('href');
      boton.setAttribute('aria-disabled', 'true');
    }
  }
  $('boton-buscar').textContent = hayProblemas ? 'Buscar partida' : 'Sin problemas todavía';
  $('boton-buscar-hero').textContent = `Buscar partida de ${nombre}`;
  $('estado-duelo').textContent = hayProblemas
    ? `${datos.problemas} ${datos.problemas === 1 ? 'problema disponible' : 'problemas disponibles'} en ${nombre}`
    : `Todavía no hay problemas de ${nombre}`;

  document.querySelectorAll('.lenguaje').forEach((boton) => {
    const activo = boton.dataset.lenguaje === nombre;
    boton.setAttribute('aria-checked', String(activo));
    boton.tabIndex = activo ? 0 : -1;
  });
}

function seleccionar(nombre, enfocar = false) {
  estado.seleccionado = nombre;
  try {
    localStorage.setItem(CLAVE_LENGUAJE, nombre);
  } catch {}
  pintarSeleccion();
  if (enfocar) {
    document.querySelector(`.lenguaje[data-lenguaje="${nombre}"]`).focus();
  }
}

function crearBotonLenguaje({ lenguaje, elo }) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'lenguaje';
  boton.setAttribute('role', 'radio');
  boton.dataset.lenguaje = lenguaje;

  const sigla = document.createElement('span');
  sigla.className = 'lenguaje__sigla';
  sigla.textContent = SIGLAS[lenguaje] ?? lenguaje.slice(0, 4).toUpperCase();

  const nombre = document.createElement('span');
  nombre.className = 'lenguaje__nombre';
  nombre.textContent = lenguaje;

  const meta = document.createElement('span');
  meta.className = 'lenguaje__meta';
  const problemas = estado.lenguajes.find((l) => l.nombre === lenguaje)?.problemas ?? 0;
  meta.textContent = problemas > 0 ? `ELO ${elo}` : `ELO ${elo} · sin problemas`;

  boton.append(sigla, nombre, meta);
  boton.addEventListener('click', () => seleccionar(lenguaje));
  return boton;
}

function pintarLenguajes() {
  const lista = $('lista-lenguajes');
  lista.replaceChildren(...estado.perfil.lenguajes.map(crearBotonLenguaje));
  lista.addEventListener('keydown', (evento) => {
    const orden = estado.perfil.lenguajes.map((l) => l.lenguaje);
    const actual = orden.indexOf(estado.seleccionado);
    const pasos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (evento.key in pasos) {
      evento.preventDefault();
      seleccionar(orden.at((actual + pasos[evento.key]) % orden.length), true);
    }
  });
}

function lenguajeInicial() {
  let guardado = null;
  try {
    guardado = localStorage.getItem(CLAVE_LENGUAJE);
  } catch {}
  const nombres = estado.perfil.lenguajes.map((l) => l.lenguaje);
  return nombres.includes(guardado) ? guardado : nombres[0];
}

function iniciarSala() {
  $('formulario-sala').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const campo = $('codigo-sala');
    const codigo = campo.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(codigo)) {
      campo.setAttribute('aria-invalid', 'true');
      mostrarToast('El código de sala tiene 6 letras o números', 'error');
      return;
    }
    campo.removeAttribute('aria-invalid');
    mostrarToast('Las salas privadas llegarán en la próxima versión de KODELO');
  });
  $('boton-crear-sala').addEventListener('click', () => {
    mostrarToast('Las salas privadas llegarán en la próxima versión de KODELO');
  });
}

async function cargar() {
  const [perfil, lenguajes] = await Promise.all([api('/usuarios/yo'), api('/lenguajes')]);
  estado.perfil = perfil;
  estado.lenguajes = lenguajes;
  pintarCabecera();
  pintarLenguajes();
  seleccionar(lenguajeInicial());
}

if (exigirSesion()) {
  iniciarBarraLateral();
  iniciarSala();
  cargar()
    .catch((error) => mostrarToast(error.message, 'error'))
    .finally(() => document.querySelector('.contenido').removeAttribute('aria-busy'));
}
