import { api } from './api.js';
import { mostrarToast } from './barra-lateral.js';
import {
  $, h, icono, prepararAdmin, numero, pintarEstadisticas, pintarError, abrirDialogo,
  prepararCierreDialogos, prepararContadores, confirmar, normalizar,
} from './admin-comun.js';

const sesion = prepararAdmin(['ADMIN']);

const TIPOS = { AVATAR: 'Avatar', MARCO: 'Marco', TEMA_EDITOR: 'Tema del editor', FONDO: 'Fondo' };
const RAREZAS = {
  COMUN: ['Común', ''],
  RARO: ['Raro', 'insignia--acento'],
  EPICO: ['Épico', 'insignia--ko'],
  LEGENDARIO: ['Legendario', 'insignia--aviso'],
};
const IMAGENES = [
  ['kody-clasico', 'KODY clásico'],
  ['kody-neon', 'KODY neón'],
  ['marco-indigo', 'Marco índigo'],
  ['marco-dorado', 'Marco dorado'],
  ['marco-halloween', 'Marco Halloween'],
  ['tema-medianoche', 'Tema medianoche'],
  ['tema-retro', 'Tema retro'],
  ['fondo-cuadricula', 'Fondo cuadrícula'],
  ['fondo-constelacion', 'Fondo constelación'],
];

let items = [];

function miniatura(imagen, tamano = 44) {
  if (!imagen) {
    return h('span', { clase: 'miniatura miniatura--vacia', 'aria-hidden': 'true' }, 'Sin imagen');
  }
  return h('img', { clase: 'miniatura', src: `/${imagen}`, width: tamano, height: tamano, alt: '' });
}

function precio(valor) {
  if (valor === 0) {
    return h('span', { clase: 'insignia insignia--ok' }, 'Gratis');
  }
  return h('span', { clase: 'precio-admin' }, h('img', { src: '/img/iconos/moneda.svg', width: 14, height: 14, alt: '' }), numero(valor));
}

function interruptorVenta(item) {
  const casilla = h('input', { type: 'checkbox', 'aria-label': `${item.nombre} a la venta` });
  casilla.checked = item.activo;
  casilla.addEventListener('change', async () => {
    casilla.disabled = true;
    try {
      await api(`/admin/tienda/${item.id}/activo`, { metodo: 'PATCH', datos: { activo: casilla.checked } });
      mostrarToast(casilla.checked ? `«${item.nombre}» vuelve a estar a la venta` : `«${item.nombre}» retirado de la tienda`, 'ok');
      await cargar();
    } catch (error) {
      casilla.checked = !casilla.checked;
      casilla.disabled = false;
      mostrarToast(error.message, 'error');
    }
  });
  return h('label', { clase: 'interruptor' }, casilla, h('span', { clase: 'interruptor__pista', 'aria-hidden': 'true' }), item.activo ? 'A la venta' : 'Retirado');
}

function fila(item) {
  const [textoRareza, claseRareza] = RAREZAS[item.rareza];
  return h('tr', { clase: item.activo ? null : 'fila--apagada' },
    h('td', {},
      h('div', { clase: 'persona' },
        miniatura(item.imagen),
        h('div', {},
          h('div', { clase: 'persona__nombre' }, item.nombre),
          h('div', { clase: 'persona__dato' }, item.descripcion ?? 'Sin descripción')
        )
      )
    ),
    h('td', {}, TIPOS[item.tipo]),
    h('td', {}, h('span', { clase: `insignia ${claseRareza}` }, textoRareza)),
    h('td', { clase: 'numero' }, precio(item.precio)),
    h('td', { clase: 'numero' }, numero(item.vendidos)),
    h('td', {}, interruptorVenta(item)),
    h('td', { clase: 'acciones-fila' },
      h('button', { clase: 'accion-fila accion-fila--icono', type: 'button', 'aria-label': `Editar ${item.nombre}`, title: 'Editar', alClick: () => editar(item) }, icono('editar')),
      h('button', { clase: 'accion-fila accion-fila--icono accion-fila--peligro', type: 'button', 'aria-label': `Eliminar ${item.nombre}`, title: 'Eliminar', alClick: () => eliminar(item) }, icono('papelera'))
    )
  );
}

function pintarTabla() {
  const texto = normalizar($('buscar').value.trim());
  const tipo = $('filtro-tipo').value;
  const venta = $('filtro-estado').value;
  const visibles = items.filter((item) =>
    (!texto || normalizar(`${item.nombre} ${item.descripcion ?? ''}`).includes(texto))
    && (!tipo || item.tipo === tipo)
    && (!venta || String(Number(item.activo)) === venta)
  );
  if (!visibles.length) {
    $('tabla').replaceChildren(h('div', { clase: 'estado-admin' }, 'No hay ningún producto con esos filtros.'));
    return;
  }
  const cabecera = ['Producto', 'Categoría', 'Rareza', 'Precio', 'Vendidos', 'Estado', ''];
  $('tabla').replaceChildren(
    h('table', { clase: 'tabla-admin' },
      h('caption', { clase: 'oculto-accesible' }, 'Productos de la tienda'),
      h('thead', {}, h('tr', {}, cabecera.map((titulo, i) =>
        h('th', { scope: 'col', clase: i === 3 || i === 4 ? 'numero' : null }, titulo || h('span', { clase: 'oculto-accesible' }, 'Acciones'))
      ))),
      h('tbody', {}, visibles.map(fila))
    )
  );
}

async function cargar() {
  try {
    const datos = await api('/admin/tienda');
    items = datos.items;
    pintarEstadisticas($('estadisticas'), [
      ['A la venta', datos.resumen.aLaVenta, 'ok'],
      ['Retirados', datos.resumen.ocultos],
      ['Unidades vendidas', datos.resumen.vendidos, 'acento'],
      ['Monedas gastadas', datos.resumen.monedas, 'moneda'],
    ]);
    pintarTabla();
  } catch (error) {
    pintarError($('tabla'), error.message, cargar);
  }
}

function pintarVistaPrevia() {
  const imagen = $('item-imagen').value;
  const [textoRareza, claseRareza] = RAREZAS[$('item-rareza').value];
  const valorPrecio = Math.max(0, Number($('item-precio').value) || 0);
  $('vista-previa').replaceChildren(
    miniatura(imagen || null, 96),
    h('div', {},
      h('p', { clase: 'vista-previa__nombre' }, $('item-nombre').value.trim() || 'Nombre del producto'),
      h('p', { clase: 'vista-previa__descripcion' }, $('item-descripcion').value.trim() || TIPOS[$('item-tipo').value]),
      h('div', { clase: 'vista-previa__pie' }, h('span', { clase: `insignia ${claseRareza}` }, textoRareza), precio(valorPrecio))
    )
  );
}

function abrirFormulario(item) {
  $('dialogo-item-titulo').textContent = item ? `Editar «${item.nombre}»` : 'Nuevo producto';
  abrirDialogo($('dialogo-item'), {
    alAbrir: () => {
      $('item-nombre').value = item?.nombre ?? '';
      $('item-tipo').value = item?.tipo ?? 'AVATAR';
      $('item-rareza').value = item?.rareza ?? 'COMUN';
      $('item-precio').value = item?.precio ?? 100;
      $('item-descripcion').value = item?.descripcion ?? '';
      $('item-imagen').value = item?.imagen ?? '';
      $('item-activo').checked = item?.activo ?? true;
      pintarVistaPrevia();
    },
    alEnviar: async () => {
      const datos = {
        nombre: $('item-nombre').value,
        tipo: $('item-tipo').value,
        rareza: $('item-rareza').value,
        precio: Number($('item-precio').value),
        descripcion: $('item-descripcion').value,
        imagen: $('item-imagen').value || null,
        activo: $('item-activo').checked,
      };
      if (item) {
        await api(`/admin/tienda/${item.id}`, { metodo: 'PUT', datos });
        mostrarToast(`«${datos.nombre.trim()}» actualizado`, 'ok');
      } else {
        await api('/admin/tienda', { metodo: 'POST', datos });
        mostrarToast(`«${datos.nombre.trim()}» añadido a la tienda`, 'ok');
      }
      await cargar();
    },
  });
}

function editar(item) {
  abrirFormulario(item);
}

async function eliminar(item) {
  const seguro = await confirmar({
    titulo: `¿Eliminar «${item.nombre}»?`,
    mensaje: item.vendidos > 0
      ? `${item.vendidos === 1 ? 'Lo tiene 1 jugador' : `Lo tienen ${item.vendidos} jugadores`}, así que no se puede borrar. Retíralo de la venta en su lugar.`
      : 'Desaparecerá de la tienda para siempre. Si solo quieres ocultarlo, retíralo de la venta.',
  });
  if (!seguro) {
    return;
  }
  try {
    await api(`/admin/tienda/${item.id}`, { metodo: 'DELETE' });
    mostrarToast(`«${item.nombre}» eliminado`, 'ok');
    await cargar();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

if (sesion) {
  prepararCierreDialogos();
  prepararContadores();
  $('item-imagen').append(
    h('option', { value: '' }, 'Sin imagen'),
    ...IMAGENES.map(([archivo, nombre]) => h('option', { value: `img/tienda/${archivo}.svg` }, nombre))
  );
  ['item-nombre', 'item-tipo', 'item-rareza', 'item-precio', 'item-descripcion', 'item-imagen'].forEach((id) => {
    $(id).addEventListener('input', pintarVistaPrevia);
  });
  $('boton-nuevo').addEventListener('click', () => abrirFormulario(null));
  $('buscar').addEventListener('input', pintarTabla);
  $('filtro-tipo').addEventListener('change', pintarTabla);
  $('filtro-estado').addEventListener('change', pintarTabla);
  cargar();
}
