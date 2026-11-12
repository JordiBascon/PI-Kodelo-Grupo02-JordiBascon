import { api } from './api.js';
import { mostrarToast } from './barra-lateral.js';
import {
  $, h, icono, prepararAdmin, numero, fechaCorta, fechaHora, pintarEstadisticas, pintarError,
  abrirDialogo, prepararCierreDialogos, prepararContadores,
} from './admin-comun.js';

const sesion = prepararAdmin(['ADMIN', 'MODERADOR']);
const soyAdmin = sesion?.usuario.rol === 'ADMIN';

const ROLES = {
  JUGADOR: ['Jugador', ''],
  MODERADOR: ['Moderador', 'insignia--aviso'],
  ADMIN: ['Admin', 'insignia--acento'],
};
const ESTADOS = {
  ACTIVO: ['Activa', 'insignia--ok'],
  BLOQUEADO: ['Bloqueada', 'insignia--ko'],
  SIN_VERIFICAR: ['Sin verificar', 'insignia--aviso'],
};

let temporizadorBusqueda;

function filtros() {
  const parametros = new URLSearchParams();
  const buscar = $('buscar').value.trim();
  if (buscar) parametros.set('buscar', buscar);
  if ($('filtro-rol').value) parametros.set('rol', $('filtro-rol').value);
  if ($('filtro-estado').value) parametros.set('estado', $('filtro-estado').value);
  const texto = parametros.toString();
  return texto ? `?${texto}` : '';
}

function celdaEstado(cuenta) {
  const [texto, clase] = ESTADOS[cuenta.estado];
  const celda = h('td', {}, h('span', { clase: `insignia insignia--punto ${clase}` }, texto));
  if (cuenta.estado === 'BLOQUEADO') {
    const hasta = cuenta.bloqueado_hasta ? `Hasta ${fechaHora(cuenta.bloqueado_hasta)}` : 'Permanente';
    celda.append(
      h('span', { clase: 'detalle-bloqueo' }, hasta),
      h('span', { clase: 'detalle-bloqueo', title: cuenta.motivo_bloqueo ?? '' }, cuenta.motivo_bloqueo ?? '')
    );
  }
  return celda;
}

function accion(texto, alPulsar, { peligro = false, icon = null, etiqueta = null } = {}) {
  return h('button', {
    clase: `accion-fila${peligro ? ' accion-fila--peligro' : ''}${icon ? ' accion-fila--icono' : ''}`,
    type: 'button',
    'aria-label': etiqueta,
    title: etiqueta,
    alClick: alPulsar,
  }, icon ? icono(icon) : texto);
}

function accionesDe(cuenta) {
  const celda = h('td', { clase: 'acciones-fila' });
  if (cuenta.id === sesion.usuario.id) {
    celda.append(h('span', { clase: 'persona__dato' }, 'Tu cuenta'));
    return celda;
  }
  if (!soyAdmin && cuenta.rol !== 'JUGADOR') {
    celda.append(h('span', { clase: 'persona__dato' }, 'Solo un admin'));
    return celda;
  }
  celda.append(cuenta.estado === 'BLOQUEADO'
    ? accion('Desbloquear', () => desbloquear(cuenta))
    : accion('Bloquear', () => bloquear(cuenta)));
  if (soyAdmin) {
    celda.append(
      accion('', () => cambiarRol(cuenta), { icon: 'escudo', etiqueta: `Cambiar el rol de ${cuenta.nick}` }),
      accion('', () => ajustarMonedas(cuenta), { icon: 'monedas', etiqueta: `Ajustar las monedas de ${cuenta.nick}` }),
      accion('', () => eliminar(cuenta), { peligro: true, icon: 'papelera', etiqueta: `Eliminar la cuenta de ${cuenta.nick}` })
    );
  }
  return celda;
}

function fila(cuenta) {
  const [textoRol, claseRol] = ROLES[cuenta.rol];
  const esYo = cuenta.id === sesion.usuario.id;
  return h('tr', {},
    h('td', {},
      h('div', { clase: 'persona' },
        h('span', { clase: 'avatar-inicial', 'aria-hidden': 'true' }, cuenta.nick.charAt(0).toUpperCase()),
        h('div', {},
          h('div', { clase: 'persona__nombre' }, cuenta.nick, esYo ? h('span', { clase: 'etiqueta-tu' }, 'Tú') : null),
          h('div', { clase: 'persona__dato', title: `Alta: ${fechaCorta(cuenta.fecha_registro)}` }, cuenta.email)
        )
      )
    ),
    h('td', {}, h('span', { clase: `insignia ${claseRol}` }, textoRol)),
    celdaEstado(cuenta),
    h('td', { clase: 'numero' }, numero(cuenta.elo)),
    h('td', { clase: 'numero' }, numero(cuenta.monedas)),
    h('td', { clase: 'numero' }, numero(cuenta.duelos)),
    accionesDe(cuenta)
  );
}

function pintarTabla(cuentas) {
  if (!cuentas.length) {
    $('tabla').replaceChildren(h('div', { clase: 'estado-admin' }, 'No hay ninguna cuenta con esos filtros.'));
    return;
  }
  const cabecera = ['Usuario', 'Rol', 'Estado', 'ELO', 'Monedas', 'Duelos', ''];
  const numericas = new Set([3, 4, 5]);
  $('tabla').replaceChildren(
    h('table', { clase: 'tabla-admin' },
      h('caption', { clase: 'oculto-accesible' }, 'Cuentas de KODELO'),
      h('thead', {}, h('tr', {}, cabecera.map((texto, i) =>
        h('th', { scope: 'col', clase: numericas.has(i) ? 'numero' : null }, texto || h('span', { clase: 'oculto-accesible' }, 'Acciones'))
      ))),
      h('tbody', {}, cuentas.map(fila))
    )
  );
}

async function cargarCuentas() {
  try {
    const { resumen, cuentas } = await api(`/admin/cuentas${filtros()}`);
    pintarEstadisticas($('estadisticas'), [
      ['Cuentas', resumen.cuentas],
      ['Activas', resumen.activas, 'ok'],
      ['Bloqueadas', resumen.bloqueadas, 'ko'],
      ['Moderadores y admins', resumen.equipo, 'acento'],
    ]);
    pintarTabla(cuentas);
  } catch (error) {
    pintarError($('tabla'), error.message, cargarCuentas);
  }
}

async function cargarRegistro() {
  try {
    const entradas = await api('/admin/auditoria');
    if (!entradas.length) {
      $('registro').replaceChildren(h('li', { clase: 'estado-admin' }, 'Todavía no hay acciones registradas.'));
      return;
    }
    $('registro').replaceChildren(...entradas.map((entrada) =>
      h('li', { clase: 'registro__entrada' },
        h('time', { clase: 'registro__fecha', datetime: entrada.fecha.replace(' ', 'T') }, fechaHora(entrada.fecha)),
        h('span', { clase: 'registro__autor' }, entrada.admin),
        h('span', { clase: 'registro__accion' }, entrada.accion)
      )
    ));
  } catch (error) {
    $('registro').replaceChildren(h('li', { clase: 'estado-admin estado-admin--error' }, error.message));
  }
}

async function recargar(mensaje) {
  mostrarToast(mensaje, 'ok');
  await Promise.all([cargarCuentas(), cargarRegistro()]);
}

function bloquear(cuenta) {
  $('dialogo-bloqueo-titulo').textContent = `Bloquear a ${cuenta.nick}`;
  $('dialogo-bloqueo-texto').textContent = 'No podrá iniciar sesión hasta que acabe el bloqueo o lo levantes tú.';
  abrirDialogo($('dialogo-bloqueo'), {
    alAbrir: (formulario) => {
      formulario.reset();
      formulario.duracion.value = '7d';
    },
    alEnviar: async (formulario) => {
      const resultado = await api(`/admin/cuentas/${cuenta.id}/bloqueo`, {
        metodo: 'POST',
        datos: { duracion: formulario.duracion.value, motivo: $('motivo-bloqueo').value },
      });
      await recargar(resultado.bloqueadoHasta ? `${cuenta.nick} bloqueado hasta el ${fechaHora(resultado.bloqueadoHasta)}` : `${cuenta.nick} bloqueado de forma permanente`);
    },
  });
}

async function desbloquear(cuenta) {
  try {
    await api(`/admin/cuentas/${cuenta.id}/bloqueo`, { metodo: 'DELETE' });
    await recargar(`${cuenta.nick} ya puede volver a jugar`);
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

function cambiarRol(cuenta) {
  $('dialogo-rol-titulo').textContent = `Cambiar el rol de ${cuenta.nick}`;
  $('dialogo-rol-texto').textContent = `Ahora es ${ROLES[cuenta.rol][0].toLowerCase()}.`;
  abrirDialogo($('dialogo-rol'), {
    alAbrir: (formulario) => {
      formulario.rol.value = cuenta.rol;
    },
    alEnviar: async (formulario) => {
      const resultado = await api(`/admin/cuentas/${cuenta.id}/rol`, { metodo: 'PATCH', datos: { rol: formulario.rol.value } });
      await recargar(`${resultado.nick} ahora es ${ROLES[resultado.rol][0].toLowerCase()}`);
    },
  });
}

function ajustarMonedas(cuenta) {
  $('dialogo-monedas-titulo').textContent = `Monedas de ${cuenta.nick}`;
  $('dialogo-monedas-texto').textContent = `Saldo actual: ${numero(cuenta.monedas)} monedas.`;
  abrirDialogo($('dialogo-monedas'), {
    alAbrir: (formulario) => {
      formulario.reset();
      $('monedas-nuevas').value = cuenta.monedas;
    },
    alEnviar: async () => {
      const resultado = await api(`/admin/cuentas/${cuenta.id}/monedas`, {
        metodo: 'PUT',
        datos: { monedas: Number($('monedas-nuevas').value), motivo: $('motivo-monedas').value },
      });
      await recargar(`${resultado.nick} tiene ahora ${numero(resultado.monedas)} monedas`);
    },
  });
}

function eliminar(cuenta) {
  $('dialogo-eliminar-titulo').textContent = `Eliminar la cuenta de ${cuenta.nick}`;
  $('dialogo-eliminar-texto').textContent = `Esta acción no se puede deshacer. Escribe «${cuenta.nick}» para confirmar.`;
  abrirDialogo($('dialogo-eliminar'), {
    alAbrir: (formulario) => formulario.reset(),
    alEnviar: async () => {
      await api(`/admin/cuentas/${cuenta.id}`, { metodo: 'DELETE', datos: { confirmacion: $('confirmacion').value.trim() } });
      await recargar(`Cuenta de ${cuenta.nick} eliminada`);
    },
  });
}

if (sesion) {
  prepararCierreDialogos();
  prepararContadores();
  $('buscar').addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(cargarCuentas, 250);
  });
  $('filtro-rol').addEventListener('change', cargarCuentas);
  $('filtro-estado').addEventListener('change', cargarCuentas);
  cargarCuentas();
  cargarRegistro();
}
