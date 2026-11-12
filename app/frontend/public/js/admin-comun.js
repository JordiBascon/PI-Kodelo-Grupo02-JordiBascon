import { exigirSesion } from './api.js';
import { iniciarBarraLateral } from './barra-lateral.js';

export const $ = (id) => document.getElementById(id);

export function h(etiqueta, atributos = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) {
      continue;
    }
    if (clave === 'clase') {
      elemento.className = valor;
    } else if (/^al[A-Z]/.test(clave)) {
      elemento.addEventListener(clave.slice(2).toLowerCase(), valor);
    } else if (valor === true) {
      elemento.setAttribute(clave, '');
    } else {
      elemento.setAttribute(clave, valor);
    }
  }
  elemento.append(...hijos.flat().filter((hijo) => hijo !== null && hijo !== undefined && hijo !== false));
  return elemento;
}

export function icono(nombre) {
  return h('span', { clase: `icono icono--${nombre}`, 'aria-hidden': 'true' });
}

export function prepararAdmin(rolesPermitidos) {
  const sesion = exigirSesion();
  if (!sesion) {
    return null;
  }
  if (!rolesPermitidos.includes(sesion.usuario?.rol)) {
    window.location.replace('/inicio');
    return null;
  }
  iniciarBarraLateral();
  $('avatar').textContent = sesion.usuario.nick.charAt(0).toUpperCase();
  $('rol-actual').textContent = sesion.usuario.rol === 'ADMIN' ? 'Administrador' : 'Moderador';
  return sesion;
}

export function numero(valor) {
  return Number(valor).toLocaleString('es-ES');
}

export function fechaCorta(fechaSql) {
  if (!fechaSql) {
    return '—';
  }
  const [dia] = fechaSql.split(' ');
  const [anio, mes, numeroDia] = dia.split('-');
  return `${numeroDia}/${mes}/${anio}`;
}

export function fechaHora(fechaSql) {
  if (!fechaSql) {
    return '—';
  }
  return `${fechaCorta(fechaSql)} ${fechaSql.split(' ')[1].slice(0, 5)}`;
}

export function pintarEstadisticas(contenedor, datos) {
  contenedor.replaceChildren(
    ...datos.map(([etiqueta, valor, tono]) =>
      h('div', { clase: `estadistica-admin${tono ? ` estadistica-admin--${tono}` : ''}` },
        h('span', { clase: 'estadistica-admin__valor' }, numero(valor)),
        h('span', { clase: 'estadistica-admin__etiqueta' }, etiqueta)
      )
    )
  );
}

export function pintarError(contenedor, mensaje, reintentar) {
  contenedor.replaceChildren(
    h('div', { clase: 'estado-admin estado-admin--error', role: 'alert' },
      h('p', {}, mensaje),
      reintentar ? h('button', { clase: 'boton boton--secundario boton--pequeno', type: 'button', alClick: reintentar }, 'Reintentar') : null
    )
  );
}

export function abrirDialogo(dialogo, { alEnviar, alAbrir } = {}) {
  const formulario = dialogo.querySelector('form');
  const error = dialogo.querySelector('.dialogo__error');
  const enviar = dialogo.querySelector('[type="submit"]');
  const textoEnviar = enviar?.textContent;
  error.hidden = true;
  error.textContent = '';
  alAbrir?.(formulario);
  actualizarContadores(dialogo);

  formulario.onsubmit = async (evento) => {
    evento.preventDefault();
    error.hidden = true;
    enviar.disabled = true;
    enviar.textContent = 'Guardando…';
    try {
      await alEnviar(formulario);
      dialogo.close();
    } catch (fallo) {
      error.textContent = fallo.message;
      error.hidden = false;
    } finally {
      enviar.disabled = false;
      enviar.textContent = textoEnviar;
    }
  };
  dialogo.showModal();
  dialogo.querySelector('[autofocus]')?.focus();
}

export function prepararCierreDialogos() {
  document.querySelectorAll('dialog.dialogo').forEach((dialogo) => {
    dialogo.querySelectorAll('[data-cerrar]').forEach((boton) => boton.addEventListener('click', () => dialogo.close()));
    dialogo.addEventListener('click', (evento) => {
      if (evento.target === dialogo) {
        dialogo.close();
      }
    });
  });
}

export function confirmar({ titulo, mensaje, textoAceptar = 'Eliminar', peligro = true }) {
  const dialogo = $('dialogo-confirmar');
  dialogo.querySelector('.dialogo__titulo').textContent = titulo;
  dialogo.querySelector('.dialogo__texto').textContent = mensaje;
  const aceptar = dialogo.querySelector('[type="submit"]');
  aceptar.textContent = textoAceptar;
  aceptar.className = `boton boton--pequeno ${peligro ? 'boton--peligro' : 'boton--principal'}`;
  return new Promise((resolver) => {
    dialogo.onclose = () => resolver(dialogo.returnValue === 'si');
    dialogo.returnValue = '';
    dialogo.showModal();
  });
}

export function actualizarContadores(raiz = document) {
  raiz.querySelectorAll('[data-contador]').forEach((contador) => {
    const campo = document.getElementById(contador.dataset.contador);
    contador.textContent = `${campo.value.length} / ${campo.maxLength}`;
  });
}

export function prepararContadores() {
  document.querySelectorAll('[data-contador]').forEach((contador) => {
    document.getElementById(contador.dataset.contador).addEventListener('input', () => actualizarContadores(contador.parentElement));
  });
}

export function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
