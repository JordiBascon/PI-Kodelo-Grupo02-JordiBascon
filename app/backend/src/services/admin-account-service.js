import { enTransaccion } from '../db/pool.js';
import * as cuentas from '../models/admin-account-model.js';
import * as auditoria from '../models/audit-model.js';
import { HttpError } from '../utils/http-error.js';

const ROLES = ['JUGADOR', 'MODERADOR', 'ADMIN'];
const ESTADOS = ['ACTIVO', 'BLOQUEADO', 'SIN_VERIFICAR'];
const DURACIONES = { '24h': 1, '7d': 7, '30d': 30, permanente: null };

function texto(valor, minimo, maximo, mensaje) {
  const limpio = typeof valor === 'string' ? valor.trim() : '';
  if (limpio.length < minimo || limpio.length > maximo) {
    throw new HttpError(400, mensaje);
  }
  return limpio;
}

function fechaSql(fecha) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00`;
}

function fechaLegible(fechaSqlTexto) {
  const [dia, hora] = fechaSqlTexto.split(' ');
  const [anio, mes, numero] = dia.split('-');
  return `${numero}/${mes}/${anio} ${hora.slice(0, 5)}`;
}

async function conObjetivo(actor, id, trabajo) {
  return enTransaccion(async (conexion) => {
    const objetivo = await cuentas.bloquearFila(conexion, id);
    if (!objetivo) {
      throw new HttpError(404, 'Esa cuenta no existe');
    }
    if (objetivo.id === actor.id) {
      throw new HttpError(409, 'No puedes hacer esto con tu propia cuenta');
    }
    if (actor.rol === 'MODERADOR' && objetivo.rol !== 'JUGADOR') {
      throw new HttpError(403, 'Un moderador solo puede gestionar cuentas de jugadores');
    }
    return trabajo(conexion, objetivo);
  });
}

export async function listar(filtros) {
  const buscar = typeof filtros.buscar === 'string' ? filtros.buscar.trim().slice(0, 60) : '';
  const rol = ROLES.includes(filtros.rol) ? filtros.rol : '';
  const estado = ESTADOS.includes(filtros.estado) ? filtros.estado : '';
  await cuentas.levantarBloqueosCaducados();
  const [lista, resumen] = await Promise.all([cuentas.listar({ buscar, rol, estado }), cuentas.resumen()]);
  return { resumen, cuentas: lista };
}

export function cambiarRol(actor, id, rol) {
  if (!ROLES.includes(rol)) {
    throw new HttpError(400, 'Rol no válido');
  }
  return conObjetivo(actor, id, async (conexion, objetivo) => {
    if (objetivo.rol === rol) {
      return { nick: objetivo.nick, rol };
    }
    if (objetivo.rol === 'ADMIN' && (await cuentas.contarAdmins(conexion)) <= 1) {
      throw new HttpError(409, 'Debe quedar al menos un administrador');
    }
    await cuentas.cambiarRol(conexion, objetivo.id, rol);
    await auditoria.registrar(conexion, actor.id, `Cambió el rol de ${objetivo.nick} de ${objetivo.rol} a ${rol}`);
    return { nick: objetivo.nick, rol };
  });
}

export function fijarMonedas(actor, id, { monedas, motivo }) {
  const cantidad = Number(monedas);
  if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > 1_000_000) {
    throw new HttpError(400, 'Las monedas deben ser un número entero entre 0 y 1 000 000');
  }
  const razon = texto(motivo, 5, 150, 'Escribe el motivo del cambio de monedas (entre 5 y 150 caracteres)');
  return conObjetivo(actor, id, async (conexion, objetivo) => {
    await cuentas.fijarMonedas(conexion, objetivo.id, cantidad);
    await auditoria.registrar(conexion, actor.id, `Cambió las monedas de ${objetivo.nick} de ${objetivo.monedas} a ${cantidad}: ${razon}`);
    return { nick: objetivo.nick, monedas: cantidad };
  });
}

export function bloquear(actor, id, { duracion, motivo }) {
  if (!(duracion in DURACIONES)) {
    throw new HttpError(400, 'Elige una duración: 24h, 7d, 30d o permanente');
  }
  const razon = texto(motivo, 5, 200, 'Escribe el motivo del bloqueo (entre 5 y 200 caracteres)');
  const dias = DURACIONES[duracion];
  const hasta = dias === null ? null : fechaSql(new Date(Date.now() + dias * 86_400_000));
  return conObjetivo(actor, id, async (conexion, objetivo) => {
    await cuentas.bloquear(conexion, objetivo.id, hasta, razon);
    const cuando = hasta ? `hasta el ${fechaLegible(hasta)}` : 'de forma permanente';
    await auditoria.registrar(conexion, actor.id, `Bloqueó a ${objetivo.nick} ${cuando}: ${razon}`);
    return { nick: objetivo.nick, bloqueadoHasta: hasta };
  });
}

export function desbloquear(actor, id) {
  return conObjetivo(actor, id, async (conexion, objetivo) => {
    if (objetivo.estado !== 'BLOQUEADO') {
      throw new HttpError(409, `${objetivo.nick} no está bloqueado`);
    }
    await cuentas.desbloquear(conexion, objetivo.id);
    await auditoria.registrar(conexion, actor.id, `Desbloqueó a ${objetivo.nick}`);
    return { nick: objetivo.nick };
  });
}

export async function eliminar(actor, id, confirmacion) {
  try {
    return await conObjetivo(actor, id, async (conexion, objetivo) => {
      if (confirmacion !== objetivo.nick) {
        throw new HttpError(400, 'Escribe el nombre de usuario exacto para confirmar');
      }
      await auditoria.registrar(conexion, actor.id, `Eliminó la cuenta de ${objetivo.nick}`);
      await cuentas.eliminar(conexion, objetivo.id);
      return { nick: objetivo.nick };
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Esta cuenta tiene duelos o acciones registradas y no se puede borrar sin romper el historial. Bloquéala en su lugar');
    }
    throw error;
  }
}

export function registro() {
  return auditoria.ultimas();
}
