import { enTransaccion } from '../db/pool.js';
import * as tienda from '../models/shop-model.js';
import { HttpError } from '../utils/http-error.js';

export function listar(usuarioId) {
  return tienda.listarParaUsuario(usuarioId);
}

export function comprar(usuarioId, itemId) {
  return enTransaccion(async (conexion) => {
    const saldo = await tienda.bloquearSaldo(conexion, usuarioId);
    if (saldo === null) {
      throw new HttpError(404, 'El usuario no existe');
    }

    const item = await tienda.buscarItem(conexion, itemId);
    if (!item || !item.activo) {
      throw new HttpError(404, 'Ese ítem no está a la venta');
    }
    if (await tienda.loTiene(conexion, usuarioId, itemId)) {
      throw new HttpError(409, 'Ya tienes este ítem');
    }
    if (saldo < item.precio) {
      throw new HttpError(409, `Te faltan ${item.precio - saldo} monedas para comprar ${item.nombre}`);
    }

    await tienda.cobrar(conexion, usuarioId, item.precio);
    await tienda.anadirAlInventario(conexion, usuarioId, itemId);

    return { item: item.nombre, monedas: saldo - item.precio };
  });
}

export function equipar(usuarioId, itemId) {
  return enTransaccion(async (conexion) => {
    const item = await tienda.buscarItem(conexion, itemId);
    if (!item || !(await tienda.loTiene(conexion, usuarioId, itemId))) {
      throw new HttpError(404, 'No tienes este ítem');
    }
    await tienda.equiparSoloEste(conexion, usuarioId, itemId, item.tipo);
    return { item: item.nombre, tipo: item.tipo };
  });
}
