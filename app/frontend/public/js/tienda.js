import { api, exigirSesion } from './api.js';
import { iniciarBarraLateral, mostrarToast } from './barra-lateral.js';

const RAREZAS = {
  COMUN: ['COMÚN', ''],
  RARO: ['RARO', 'item__rareza--raro'],
  EPICO: ['ÉPICO', 'item__rareza--epico'],
  LEGENDARIO: ['LEGENDARIO', 'item__rareza--legendario'],
};
const VACIOS = {
  AVATAR: 'No hay avatares a la venta ahora mismo.',
  MARCO: 'No hay marcos a la venta ahora mismo.',
  TEMA_EDITOR: 'No hay temas del editor a la venta ahora mismo.',
  FONDO: 'No hay fondos a la venta ahora mismo.',
  INVENTARIO: 'Todavía no tienes ningún cosmético. ¡Compra el primero!',
};

const $ = (id) => document.getElementById(id);

const estado = {
  items: [],
  monedas: 0,
  filtro: 'AVATAR',
};

function pintarMonedas() {
  $('monedas').textContent = `${estado.monedas.toLocaleString('es-ES')} monedas`;
}

function crearBoton(texto, clase, alPulsar) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `boton item__accion ${clase}`;
  boton.textContent = texto;
  if (alPulsar) {
    boton.addEventListener('click', () => alPulsar(boton));
  } else {
    boton.disabled = true;
    boton.setAttribute('aria-disabled', 'true');
  }
  return boton;
}

function crearPrecio(precio) {
  const etiqueta = document.createElement('span');
  etiqueta.className = precio === 0 ? 'precio precio--gratis' : 'precio';
  if (precio > 0) {
    const moneda = document.createElement('img');
    moneda.src = '/img/iconos/moneda.svg';
    moneda.width = 14;
    moneda.height = 14;
    moneda.alt = '';
    etiqueta.append(moneda);
  }
  etiqueta.append(precio === 0 ? 'Gratis' : precio.toLocaleString('es-ES'));
  etiqueta.setAttribute('aria-label', precio === 0 ? 'Gratis' : `${precio} monedas`);
  return etiqueta;
}

function crearTarjeta(item) {
  const tarjeta = document.createElement('article');
  tarjeta.className = `item${item.equipado ? ' item--equipado' : ''}`;

  const vista = document.createElement('div');
  vista.className = 'item__vista';
  const imagen = document.createElement('img');
  imagen.src = `/${item.imagen ?? 'img/kody.svg'}`;
  imagen.width = 72;
  imagen.height = 72;
  imagen.alt = '';
  vista.append(imagen);

  const nombre = document.createElement('h2');
  nombre.className = 'item__nombre';
  nombre.textContent = item.nombre;

  const [textoRareza, claseRareza] = RAREZAS[item.rareza] ?? [item.rareza, ''];
  const rareza = document.createElement('p');
  rareza.className = `item__rareza ${claseRareza}`;
  rareza.textContent = textoRareza;

  const descripcion = document.createElement('p');
  descripcion.className = 'item__descripcion';
  descripcion.textContent = item.descripcion ?? '';

  const pie = document.createElement('div');
  pie.className = 'item__pie';
  if (item.equipado) {
    pie.append(crearBoton('Equipado', 'item__accion--equipado'));
  } else if (item.comprado) {
    pie.append(crearBoton('Equipar', 'item__accion--equipar', (boton) => equipar(item, boton)));
  } else if (item.activo) {
    pie.append(crearPrecio(item.precio), crearBoton('Comprar', 'boton--principal', (boton) => comprar(item, boton)));
  } else {
    pie.append(crearBoton('Retirado de la venta', 'item__accion--retirado'));
  }

  tarjeta.append(vista, nombre, rareza, descripcion, pie);
  return tarjeta;
}

function pintarRejilla() {
  const visibles = estado.filtro === 'INVENTARIO'
    ? estado.items.filter((item) => item.comprado)
    : estado.items.filter((item) => item.tipo === estado.filtro && (item.activo || item.comprado));
  $('rejilla').replaceChildren(...visibles.map(crearTarjeta));
  $('vacia').textContent = VACIOS[estado.filtro];
  $('vacia').hidden = visibles.length > 0;
}

async function recargarItems() {
  estado.items = await api('/tienda');
  pintarRejilla();
}

async function comprar(item, boton) {
  boton.disabled = true;
  boton.textContent = 'Comprando…';
  try {
    const resultado = await api(`/tienda/${item.id}/comprar`, { metodo: 'POST' });
    estado.monedas = resultado.monedas;
    pintarMonedas();
    await recargarItems();
    mostrarToast(`¡Comprado! ${resultado.item} ya está en tu inventario. Te quedan ${resultado.monedas} monedas.`, 'ok');
  } catch (error) {
    mostrarToast(error.message, 'error');
    boton.disabled = false;
    boton.textContent = 'Comprar';
  }
}

async function equipar(item, boton) {
  boton.disabled = true;
  boton.textContent = 'Equipando…';
  try {
    await api(`/tienda/${item.id}/equipar`, { metodo: 'POST' });
    await recargarItems();
    mostrarToast(`${item.nombre} equipado`, 'ok');
  } catch (error) {
    mostrarToast(error.message, 'error');
    boton.disabled = false;
    boton.textContent = 'Equipar';
  }
}

function iniciarPestanas() {
  const pestanas = [...document.querySelectorAll('.pestanas-tienda__boton')];
  const activar = (pestana, enfocar) => {
    pestanas.forEach((p) => {
      const activa = p === pestana;
      p.setAttribute('aria-selected', String(activa));
      p.tabIndex = activa ? 0 : -1;
    });
    estado.filtro = pestana.dataset.filtro;
    if (enfocar) pestana.focus();
    pintarRejilla();
  };
  pestanas.forEach((pestana) => pestana.addEventListener('click', () => activar(pestana)));
  document.querySelector('.pestanas-tienda').addEventListener('keydown', (evento) => {
    const paso = { ArrowRight: 1, ArrowLeft: -1 }[evento.key];
    if (!paso) return;
    const actual = pestanas.findIndex((p) => p.getAttribute('aria-selected') === 'true');
    activar(pestanas.at((actual + paso) % pestanas.length), true);
  });
}

async function cargar() {
  const [perfil, items] = await Promise.all([api('/usuarios/yo'), api('/tienda')]);
  estado.monedas = perfil.monedas;
  estado.items = items;
  $('avatar').textContent = perfil.nick.charAt(0).toUpperCase();
  $('avatar').title = perfil.nick;
  pintarMonedas();
  pintarRejilla();
}

if (exigirSesion()) {
  iniciarBarraLateral();
  iniciarPestanas();
  cargar()
    .catch((error) => mostrarToast(error.message, 'error'))
    .finally(() => document.querySelector('.contenido').removeAttribute('aria-busy'));
}
