import { api } from './api.js';
import { mostrarToast } from './barra-lateral.js';
import {
  $, h, icono, prepararAdmin, pintarEstadisticas, pintarError, abrirDialogo,
  prepararCierreDialogos, prepararContadores, confirmar, normalizar,
} from './admin-comun.js';

const sesion = prepararAdmin(['ADMIN']);
const ANIO = new Date().getFullYear();
const DIA_MS = 86_400_000;

let frases = [];
let hoy = 0;

function fechaDeDia(dia) {
  return new Date(Date.UTC(ANIO, 0, dia));
}

function diaDeFecha(diaMes, mes) {
  const fecha = new Date(Date.UTC(ANIO, mes - 1, diaMes));
  if (fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== diaMes) {
    return null;
  }
  return Math.round((fecha - Date.UTC(ANIO, 0, 1)) / DIA_MS) + 1;
}

function nombreDia(dia) {
  return fechaDeDia(dia).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

function fila(frase) {
  const esHoy = frase.diaDelAnio === hoy;
  return h('tr', { clase: esHoy ? 'fila--hoy' : null },
    h('td', {},
      h('div', { clase: 'dia-frase' },
        h('span', { clase: 'persona__nombre' }, nombreDia(frase.diaDelAnio), esHoy ? h('span', { clase: 'insignia insignia--acento' }, 'Hoy') : null),
        h('span', { clase: 'dia-frase__numero' }, `Día ${frase.diaDelAnio} del año`)
      )
    ),
    h('td', {}, h('p', { clase: 'texto-frase' }, frase.texto)),
    h('td', { clase: 'acciones-fila' },
      h('button', { clase: 'accion-fila accion-fila--icono', type: 'button', 'aria-label': `Editar la frase del ${nombreDia(frase.diaDelAnio)}`, title: 'Editar', alClick: () => abrirFormulario(frase) }, icono('editar')),
      h('button', { clase: 'accion-fila accion-fila--icono accion-fila--peligro', type: 'button', 'aria-label': `Eliminar la frase del ${nombreDia(frase.diaDelAnio)}`, title: 'Eliminar', alClick: () => eliminar(frase) }, icono('papelera'))
    )
  );
}

function pintarTabla() {
  const texto = normalizar($('buscar').value.trim());
  const mes = $('filtro-mes').value;
  const visibles = frases.filter((frase) =>
    (!texto || normalizar(frase.texto).includes(texto))
    && (!mes || fechaDeDia(frase.diaDelAnio).getUTCMonth() + 1 === Number(mes))
  );
  if (!visibles.length) {
    $('tabla').replaceChildren(h('div', { clase: 'estado-admin' }, 'No hay ninguna frase con esos filtros.'));
    return;
  }
  $('tabla').replaceChildren(
    h('table', { clase: 'tabla-admin' },
      h('caption', { clase: 'oculto-accesible' }, 'Frases del día de KODY'),
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col' }, 'Día'),
        h('th', { scope: 'col' }, 'Frase'),
        h('th', { scope: 'col' }, h('span', { clase: 'oculto-accesible' }, 'Acciones'))
      )),
      h('tbody', {}, visibles.map(fila))
    )
  );
}

function pintarFraseDeHoy() {
  const deHoy = frases.find((frase) => frase.diaDelAnio === hoy);
  $('frase-hoy-etiqueta').textContent = `Frase de hoy · ${nombreDia(hoy)}`;
  $('frase-hoy-texto').textContent = deHoy ? `«${deHoy.texto}»` : 'Hoy no hay frase. KODY mostrará la de respaldo: añade una para este día.';
  $('frase-hoy-texto').classList.toggle('frase-hoy__texto--vacia', !deHoy);
}

async function cargar() {
  try {
    const datos = await api('/admin/frases');
    frases = datos.frases;
    hoy = datos.hoy;
    const diasDelAnio = diaDeFecha(31, 12);
    const mesActual = fechaDeDia(hoy).getUTCMonth();
    pintarEstadisticas($('estadisticas'), [
      ['Frases guardadas', frases.length, 'acento'],
      ['Días sin frase', diasDelAnio - frases.filter((f) => f.diaDelAnio <= diasDelAnio).length],
      ['Próximos 7 días con frase', frases.filter((f) => f.diaDelAnio > hoy && f.diaDelAnio <= hoy + 7).length, 'ok'],
      ['Frases este mes', frases.filter((f) => fechaDeDia(f.diaDelAnio).getUTCMonth() === mesActual).length],
    ]);
    pintarFraseDeHoy();
    pintarTabla();
  } catch (error) {
    pintarError($('tabla'), error.message, cargar);
  }
}

function pintarAyudaDia() {
  const dia = diaDeFecha(Number($('frase-dia').value), Number($('frase-mes').value));
  $('frase-dia-ayuda').textContent = dia
    ? `Día ${dia} del año. Se muestra ese día todos los años.`
    : 'Esa fecha no existe.';
}

function abrirFormulario(frase) {
  $('dialogo-frase-titulo').textContent = frase ? `Editar la frase del ${nombreDia(frase.diaDelAnio)}` : 'Nueva frase';
  abrirDialogo($('dialogo-frase'), {
    alAbrir: () => {
      const libre = frase ? null : [...Array(366).keys()].map((i) => ((hoy + i) % 365) + 1).find((d) => !frases.some((f) => f.diaDelAnio === d));
      const fecha = fechaDeDia(frase?.diaDelAnio ?? libre ?? hoy);
      $('frase-dia').value = fecha.getUTCDate();
      $('frase-mes').value = String(fecha.getUTCMonth() + 1);
      $('frase-texto').value = frase?.texto ?? '';
      pintarAyudaDia();
    },
    alEnviar: async () => {
      const diaDelAnio = diaDeFecha(Number($('frase-dia').value), Number($('frase-mes').value));
      if (!diaDelAnio) {
        throw new Error('Esa fecha no existe. Revisa el día y el mes');
      }
      const datos = { texto: $('frase-texto').value, diaDelAnio };
      if (frase) {
        await api(`/admin/frases/${frase.id}`, { metodo: 'PUT', datos });
        mostrarToast(`Frase del ${nombreDia(diaDelAnio)} actualizada`, 'ok');
      } else {
        await api('/admin/frases', { metodo: 'POST', datos });
        mostrarToast(`Frase añadida para el ${nombreDia(diaDelAnio)}`, 'ok');
      }
      await cargar();
    },
  });
}

async function eliminar(frase) {
  const seguro = await confirmar({
    titulo: `¿Eliminar la frase del ${nombreDia(frase.diaDelAnio)}?`,
    mensaje: `«${frase.texto}»`,
  });
  if (!seguro) {
    return;
  }
  try {
    await api(`/admin/frases/${frase.id}`, { metodo: 'DELETE' });
    mostrarToast('Frase eliminada', 'ok');
    await cargar();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

if (sesion) {
  prepararCierreDialogos();
  prepararContadores();
  $('frase-dia').addEventListener('input', pintarAyudaDia);
  $('frase-mes').addEventListener('change', pintarAyudaDia);
  $('boton-nuevo').addEventListener('click', () => abrirFormulario(null));
  $('buscar').addEventListener('input', pintarTabla);
  $('filtro-mes').addEventListener('change', pintarTabla);
  cargar();
}
