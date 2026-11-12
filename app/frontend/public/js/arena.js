import { api, exigirSesion } from './api.js';

const DURACION_MS = 10 * 60 * 1000;
const CLAVE_PARTIDA = 'kodelo.arena';
const FACTOR_K = 32;

const SIGLAS = { Python: 'PY', JavaScript: 'JS', Java: 'JAVA', PHP: 'PHP', SQL: 'SQL', HTML: 'HTML', CSS: 'CSS' };
const ARCHIVOS = { Python: 'solucion.py', JavaScript: 'solucion.js', Java: 'Main.java', PHP: 'solucion.php', SQL: 'solucion.sql', HTML: 'index.html', CSS: 'estilos.css' };
const PLANTILLAS = {
  Python: 'datos = input()\n',
  JavaScript: "const entrada = require('fs').readFileSync(0, 'utf8').trim();\n",
  Java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n',
  PHP: '<?php\n$entrada = trim(stream_get_contents(STDIN));\n',
  SQL: 'SELECT\n',
};
const DIFICULTADES = {
  FACIL: ['Fácil', 'dificultad--facil'],
  MEDIA: ['Media', 'dificultad--media'],
  DIFICIL: ['Difícil', 'dificultad--dificil'],
};

const $ = (id) => document.getElementById(id);

function cambioElo(propio, rival, resultado) {
  const esperado = 1 / (1 + 10 ** ((rival - propio) / 400));
  return Math.round(FACTOR_K * (resultado - esperado));
}

function leerPartida() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_PARTIDA));
  } catch {
    return null;
  }
}

function guardarPartida(partida) {
  sessionStorage.setItem(CLAVE_PARTIDA, JSON.stringify(partida));
}

async function obtenerProblema(lenguaje) {
  const partida = leerPartida();
  if (partida?.lenguaje === lenguaje) {
    try {
      return { problema: await api(`/problemas/${partida.problemaId}`), inicio: partida.inicio };
    } catch {
      sessionStorage.removeItem(CLAVE_PARTIDA);
    }
  }
  const problema = await api(`/problemas/aleatorio?lenguaje=${encodeURIComponent(lenguaje)}`);
  const inicio = Date.now();
  guardarPartida({ lenguaje, problemaId: problema.id, inicio });
  return { problema, inicio };
}

function crearEjemplo({ entrada, salida_esperada: salida }, indice, total) {
  const bloque = document.createElement('div');
  bloque.className = 'ejemplo';
  const titulo = document.createElement('h2');
  titulo.className = 'ejemplo__titulo';
  titulo.textContent = total > 1 ? `EJEMPLO ${indice + 1}` : 'EJEMPLO';
  const caja = document.createElement('div');
  caja.className = 'ejemplo__caja';
  for (const [etiqueta, valor] of [['Entrada', entrada], ['Salida', salida]]) {
    const fila = document.createElement('div');
    const nombre = document.createElement('span');
    nombre.className = 'ejemplo__etiqueta';
    nombre.textContent = etiqueta;
    const contenido = document.createElement('pre');
    contenido.className = 'ejemplo__valor';
    contenido.textContent = valor;
    fila.append(nombre, contenido);
    caja.append(fila);
  }
  bloque.append(titulo, caja);
  return bloque;
}

function pintarProblema(problema) {
  const [texto, clase] = DIFICULTADES[problema.dificultad] ?? [problema.dificultad, ''];
  $('dificultad').textContent = texto;
  $('dificultad').className = `dificultad ${clase}`;
  $('titulo-problema').textContent = problema.titulo;
  $('enunciado').textContent = problema.enunciado;
  document.title = `${problema.titulo} · Arena · KODELO`;

  const limites = $('limites');
  limites.replaceChildren(
    ...[`${problema.lenguaje}`, `${problema.limite_tiempo_ms / 1000} s por test`, `${problema.limite_memoria_mb} MB`].map((t) => {
      const etiqueta = document.createElement('span');
      etiqueta.textContent = t;
      return etiqueta;
    })
  );

  $('ejemplos').replaceChildren(...problema.ejemplos.map((e, i) => crearEjemplo(e, i, problema.ejemplos.length)));

  const total = problema.ejemplos.length + problema.casosOcultos;
  const lista = $('lista-tests');
  lista.replaceChildren();
  problema.ejemplos.forEach((_, i) => {
    const item = document.createElement('li');
    item.className = 'prueba';
    item.textContent = `Ejemplo ${i + 1}`;
    lista.append(item);
  });
  for (let i = 0; i < problema.casosOcultos; i += 1) {
    const item = document.createElement('li');
    item.className = 'prueba prueba--oculta';
    item.textContent = `Oculto ${i + 1}`;
    lista.append(item);
  }
  $('contador-tests').textContent = `0 / ${total} superados`;
  $('progreso-propio-texto').textContent = `0/${total}`;
}

function pintarJugador(perfil, lenguaje) {
  const eloLenguaje = perfil.lenguajes.find((l) => l.lenguaje === lenguaje)?.elo ?? perfil.elo;
  $('avatar-propio').textContent = perfil.nick.charAt(0).toUpperCase();
  $('nick-propio').textContent = perfil.nick;
  $('elo-propio').textContent = eloLenguaje;
  $('si-ganas').textContent = `+${cambioElo(eloLenguaje, eloLenguaje, 1)} ELO`;
  $('si-pierdes').textContent = `−${Math.abs(cambioElo(eloLenguaje, eloLenguaje, 0))} ELO`;
}

function iniciarEditor(problema) {
  const editor = $('codigo');
  const numeros = $('numeros');
  const claveBorrador = `kodelo.borrador.${problema.id}`;
  let borrador = null;
  try {
    borrador = localStorage.getItem(claveBorrador);
  } catch {}
  editor.value = borrador ?? PLANTILLAS[problema.lenguaje] ?? '';
  $('nombre-archivo').textContent = ARCHIVOS[problema.lenguaje] ?? 'solucion.txt';

  const actualizarNumeros = () => {
    const lineas = editor.value.split('\n').length;
    numeros.textContent = Array.from({ length: lineas }, (_, i) => i + 1).join('\n');
  };
  const guardar = () => {
    try {
      localStorage.setItem(claveBorrador, editor.value);
    } catch {}
  };

  editor.addEventListener('input', () => {
    actualizarNumeros();
    guardar();
  });
  editor.addEventListener('scroll', () => {
    numeros.scrollTop = editor.scrollTop;
  });
  editor.addEventListener('keydown', (evento) => {
    const { selectionStart: inicio, selectionEnd: fin, value } = editor;
    if (evento.key === 'Tab') {
      evento.preventDefault();
      editor.setRangeText('    ', inicio, fin, 'end');
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const lineaActual = value.slice(value.lastIndexOf('\n', inicio - 1) + 1, inicio);
      const sangria = lineaActual.match(/^\s*/)[0];
      const extra = /[:{([]\s*$/.test(lineaActual) ? '    ' : '';
      editor.setRangeText(`\n${sangria}${extra}`, inicio, fin, 'end');
    } else {
      return;
    }
    actualizarNumeros();
    guardar();
  });

  actualizarNumeros();
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
}

function iniciarReloj(inicio, alTerminar) {
  const reloj = $('reloj');
  const pintar = () => {
    const restante = Math.max(0, DURACION_MS - (Date.now() - inicio));
    const segundos = Math.ceil(restante / 1000);
    reloj.textContent = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
    reloj.classList.toggle('reloj--urgente', segundos <= 60);
    if (restante === 0) {
      clearInterval(intervalo);
      alTerminar();
    }
  };
  const intervalo = setInterval(pintar, 1000);
  pintar();
}

function avisar(texto) {
  $('aviso-tests').textContent = texto;
}

function iniciarAcciones() {
  const comprobar = (accion) => {
    const codigo = $('codigo').value.trim();
    if (!codigo || Object.values(PLANTILLAS).some((p) => p.trim() === codigo)) {
      avisar(`Escribe tu solución antes de ${accion}la.`);
      return;
    }
    avisar('Tu código está guardado. El juez que ejecuta las soluciones en un entorno aislado llega en la siguiente revisión: entonces aquí verás qué tests superas.');
  };
  $('boton-ejecutar').addEventListener('click', () => comprobar('ejecutar'));
  $('boton-enviar').addEventListener('click', () => comprobar('enviar'));

  document.querySelectorAll('[data-ayuda]').forEach((boton) => {
    boton.addEventListener('click', () => {
      $('mensaje-kody').textContent = boton.dataset.ayuda === 'pista'
        ? 'Las pistas con IA llegan en la siguiente revisión. De momento: vuelve a leer el ejemplo y piensa en los casos límite.'
        : 'La revisión de código con IA llega en la siguiente revisión. De momento: comprueba que lees la entrada y escribes la salida exactamente como en el ejemplo.';
    });
  });

  const dialogo = $('dialogo-rendirse');
  $('boton-rendirse').addEventListener('click', () => dialogo.showModal());
  $('boton-seguir').addEventListener('click', () => dialogo.close());
  $('boton-confirmar-rendirse').addEventListener('click', () => {
    sessionStorage.removeItem(CLAVE_PARTIDA);
    window.location.replace('/inicio');
  });
}

function terminarTiempo() {
  $('codigo').readOnly = true;
  $('boton-ejecutar').disabled = true;
  $('boton-enviar').disabled = true;
  avisar('Se acabó el tiempo. Tu código queda guardado.');
}

function mostrarError(mensaje) {
  const cuerpo = document.querySelector('.arena__cuerpo');
  const caja = document.createElement('div');
  caja.className = 'arena__error';
  const kody = document.createElement('img');
  kody.src = '/img/kody.svg';
  kody.width = 88;
  kody.height = 88;
  kody.alt = '';
  const texto = document.createElement('h1');
  texto.className = 'problema__titulo';
  texto.textContent = mensaje;
  const volver = document.createElement('a');
  volver.className = 'boton boton--principal';
  volver.href = '/inicio';
  volver.textContent = 'Volver a inicio';
  caja.append(kody, texto, volver);
  cuerpo.replaceChildren(caja);
  $('nombre-duelo').textContent = 'Sin duelo';
  $('boton-rendirse').hidden = true;
}

async function cargar() {
  const lenguaje = new URLSearchParams(location.search).get('lenguaje');
  if (!lenguaje) {
    mostrarError('Elige un lenguaje en inicio para entrar a la Arena');
    return;
  }
  $('sigla-lenguaje').textContent = SIGLAS[lenguaje] ?? lenguaje.slice(0, 4).toUpperCase();
  $('nombre-duelo').textContent = `Duelo de ${lenguaje}`;

  try {
    const [perfil, { problema, inicio }] = await Promise.all([api('/usuarios/yo'), obtenerProblema(lenguaje)]);
    pintarJugador(perfil, problema.lenguaje);
    pintarProblema(problema);
    iniciarEditor(problema);
    iniciarAcciones();
    iniciarReloj(inicio, terminarTiempo);
  } catch (error) {
    mostrarError(error.message);
  }
}

if (exigirSesion()) {
  cargar().finally(() => document.querySelector('.arena__cuerpo').removeAttribute('aria-busy'));
}
