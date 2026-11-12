import { api } from './api.js';
import { mostrarToast } from './barra-lateral.js';
import {
  $, h, icono, prepararAdmin, numero, pintarEstadisticas, pintarError, abrirDialogo,
  prepararCierreDialogos, prepararContadores, confirmar, normalizar,
} from './admin-comun.js';

const sesion = prepararAdmin(['ADMIN']);

const DIFICULTADES = {
  FACIL: ['Fácil', 'insignia--ok'],
  MEDIA: ['Media', 'insignia--aviso'],
  DIFICIL: ['Difícil', 'insignia--ko'],
};
const MAXIMO_CASOS = 20;

let problemas = [];
let casos = [];

function interruptorActivo(problema) {
  const casilla = h('input', { type: 'checkbox', 'aria-label': `${problema.titulo} disponible en la Arena` });
  casilla.checked = problema.activo;
  casilla.addEventListener('change', async () => {
    casilla.disabled = true;
    try {
      await api(`/admin/problemas/${problema.id}/activo`, { metodo: 'PATCH', datos: { activo: casilla.checked } });
      mostrarToast(casilla.checked ? `«${problema.titulo}» vuelve a salir en la Arena` : `«${problema.titulo}» ya no saldrá en la Arena`, 'ok');
      await cargar();
    } catch (error) {
      casilla.checked = !casilla.checked;
      casilla.disabled = false;
      mostrarToast(error.message, 'error');
    }
  });
  return h('label', { clase: 'interruptor' }, casilla, h('span', { clase: 'interruptor__pista', 'aria-hidden': 'true' }), problema.activo ? 'Activo' : 'Desactivado');
}

function fila(problema) {
  const [textoDificultad, claseDificultad] = DIFICULTADES[problema.dificultad];
  return h('tr', { clase: problema.activo ? null : 'fila--apagada' },
    h('td', {}, h('div', { clase: 'persona__nombre' }, problema.titulo)),
    h('td', {}, h('span', { clase: 'insignia' }, problema.lenguaje)),
    h('td', {}, h('span', { clase: `insignia ${claseDificultad}` }, textoDificultad)),
    h('td', { clase: 'numero' }, `${problema.visibles} ${problema.visibles === 1 ? 'visible' : 'visibles'} · ${problema.ocultos} ${problema.ocultos === 1 ? 'oculto' : 'ocultos'}`),
    h('td', { clase: 'numero' }, numero(problema.duelos)),
    h('td', {}, interruptorActivo(problema)),
    h('td', { clase: 'acciones-fila' },
      h('button', { clase: 'accion-fila accion-fila--icono', type: 'button', 'aria-label': `Editar ${problema.titulo}`, title: 'Editar', alClick: () => editar(problema) }, icono('editar')),
      h('button', { clase: 'accion-fila accion-fila--icono accion-fila--peligro', type: 'button', 'aria-label': `Eliminar ${problema.titulo}`, title: 'Eliminar', alClick: () => eliminar(problema) }, icono('papelera'))
    )
  );
}

function pintarTabla() {
  const texto = normalizar($('buscar').value.trim());
  const lenguaje = $('filtro-lenguaje').value;
  const dificultad = $('filtro-dificultad').value;
  const visibles = problemas.filter((p) =>
    (!texto || normalizar(p.titulo).includes(texto))
    && (!lenguaje || String(p.lenguaje_id) === lenguaje)
    && (!dificultad || p.dificultad === dificultad)
  );
  if (!visibles.length) {
    $('tabla').replaceChildren(h('div', { clase: 'estado-admin' }, 'No hay ningún problema con esos filtros.'));
    return;
  }
  const cabecera = ['Problema', 'Lenguaje', 'Dificultad', 'Casos de prueba', 'Duelos', 'Arena', ''];
  $('tabla').replaceChildren(
    h('table', { clase: 'tabla-admin' },
      h('caption', { clase: 'oculto-accesible' }, 'Problemas de la Arena'),
      h('thead', {}, h('tr', {}, cabecera.map((titulo, i) =>
        h('th', { scope: 'col', clase: i === 3 || i === 4 ? 'numero' : null }, titulo || h('span', { clase: 'oculto-accesible' }, 'Acciones'))
      ))),
      h('tbody', {}, visibles.map(fila))
    )
  );
}

async function cargar() {
  try {
    const datos = await api('/admin/problemas');
    problemas = datos.problemas;
    pintarEstadisticas($('estadisticas'), [
      ['Activos en la Arena', datos.resumen.activos, 'ok'],
      ['Desactivados', datos.resumen.desactivados],
      ['Casos de prueba', datos.resumen.casos, 'acento'],
      ['Duelos jugados', datos.resumen.duelos],
    ]);
    pintarTabla();
  } catch (error) {
    pintarError($('tabla'), error.message, cargar);
  }
}

function areaCaso(indice, campo, etiqueta) {
  const id = `caso-${indice}-${campo}`;
  const area = h('textarea', { clase: 'campo__entrada campo__entrada--codigo', id, rows: 3, spellcheck: 'false', maxlength: 10000 });
  area.value = casos[indice][campo];
  area.addEventListener('input', () => {
    casos[indice][campo] = area.value;
  });
  return h('div', { clase: 'campo' }, h('label', { clase: 'campo__etiqueta', for: id }, etiqueta), area);
}

function pintarCasos() {
  $('casos').replaceChildren(...casos.map((caso, indice) => {
    const oculto = h('input', { type: 'checkbox' });
    oculto.checked = caso.oculto;
    oculto.addEventListener('change', () => {
      caso.oculto = oculto.checked;
    });
    return h('div', { clase: 'caso' },
      h('div', { clase: 'caso__cabecera' },
        h('span', { clase: 'caso__numero' }, `Caso ${indice + 1}`),
        h('label', { clase: 'interruptor' }, oculto, h('span', { clase: 'interruptor__pista', 'aria-hidden': 'true' }), 'Oculto'),
        h('button', {
          clase: 'accion-fila accion-fila--icono accion-fila--peligro',
          type: 'button',
          'aria-label': `Quitar el caso ${indice + 1}`,
          title: 'Quitar caso',
          disabled: casos.length === 1,
          alClick: () => {
            casos.splice(indice, 1);
            pintarCasos();
          },
        }, icono('papelera'))
      ),
      h('div', { clase: 'caso__campos' }, areaCaso(indice, 'entrada', 'Entrada'), areaCaso(indice, 'salida', 'Salida esperada'))
    );
  }));
  $('anadir-caso').disabled = casos.length >= MAXIMO_CASOS;
}

async function abrirFormulario(problema) {
  let detalle = null;
  if (problema) {
    try {
      detalle = await api(`/admin/problemas/${problema.id}`);
    } catch (error) {
      mostrarToast(error.message, 'error');
      return;
    }
  }
  $('dialogo-problema-titulo').textContent = detalle ? `Editar «${detalle.titulo}»` : 'Nuevo problema';
  abrirDialogo($('dialogo-problema'), {
    alAbrir: () => {
      $('problema-titulo').value = detalle?.titulo ?? '';
      $('problema-lenguaje').value = detalle?.lenguaje_id ?? $('filtro-lenguaje').value ?? '';
      if (!$('problema-lenguaje').value) {
        $('problema-lenguaje').selectedIndex = 0;
      }
      $('problema-dificultad').value = detalle?.dificultad ?? 'FACIL';
      $('problema-tiempo').value = detalle?.limite_tiempo_ms ?? 2000;
      $('problema-memoria').value = detalle?.limite_memoria_mb ?? 256;
      $('problema-enunciado').value = detalle?.enunciado ?? '';
      $('problema-activo').checked = detalle?.activo ?? true;
      casos = detalle
        ? detalle.casos.map((c) => ({ entrada: c.entrada, salida: c.salida_esperada, oculto: c.oculto }))
        : [{ entrada: '', salida: '', oculto: false }, { entrada: '', salida: '', oculto: true }];
      pintarCasos();
    },
    alEnviar: async () => {
      const datos = {
        titulo: $('problema-titulo').value,
        lenguajeId: Number($('problema-lenguaje').value),
        dificultad: $('problema-dificultad').value,
        limiteTiempoMs: Number($('problema-tiempo').value),
        limiteMemoriaMb: Number($('problema-memoria').value),
        enunciado: $('problema-enunciado').value,
        activo: $('problema-activo').checked,
        casos,
      };
      if (detalle) {
        await api(`/admin/problemas/${detalle.id}`, { metodo: 'PUT', datos });
        mostrarToast(`«${datos.titulo.trim()}» actualizado`, 'ok');
      } else {
        await api('/admin/problemas', { metodo: 'POST', datos });
        mostrarToast(`«${datos.titulo.trim()}» creado`, 'ok');
      }
      await cargar();
    },
  });
}

function editar(problema) {
  abrirFormulario(problema);
}

async function eliminar(problema) {
  const seguro = await confirmar({
    titulo: `¿Eliminar «${problema.titulo}»?`,
    mensaje: problema.duelos > 0
      ? `Ya se ha jugado en ${problema.duelos === 1 ? '1 duelo' : `${problema.duelos} duelos`}, así que no se puede borrar sin romper el historial. Desactívalo en su lugar.`
      : 'Se borrarán también sus casos de prueba. Esta acción no se puede deshacer.',
  });
  if (!seguro) {
    return;
  }
  try {
    await api(`/admin/problemas/${problema.id}`, { metodo: 'DELETE' });
    mostrarToast(`«${problema.titulo}» eliminado`, 'ok');
    await cargar();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

async function cargarLenguajes() {
  try {
    const lenguajes = await api('/lenguajes');
    const opciones = () => lenguajes.map((l) => h('option', { value: l.id }, l.nombre));
    $('filtro-lenguaje').append(...opciones());
    $('problema-lenguaje').replaceChildren(...opciones());
  } catch {
    mostrarToast('No se han podido cargar los lenguajes', 'error');
  }
}

if (sesion) {
  prepararCierreDialogos();
  prepararContadores();
  $('anadir-caso').addEventListener('click', () => {
    casos.push({ entrada: '', salida: '', oculto: true });
    pintarCasos();
    $(`caso-${casos.length - 1}-entrada`).focus();
  });
  $('boton-nuevo').addEventListener('click', () => abrirFormulario(null));
  $('buscar').addEventListener('input', pintarTabla);
  $('filtro-lenguaje').addEventListener('change', pintarTabla);
  $('filtro-dificultad').addEventListener('change', pintarTabla);
  cargarLenguajes();
  cargar();
}
