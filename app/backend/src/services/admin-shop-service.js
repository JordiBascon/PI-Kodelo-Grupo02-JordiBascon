import { enTransaccion } from '../db/pool.js';
import * as tienda from '../models/admin-shop-model.js';
import * as auditoria from '../models/audit-model.js';
import { HttpError } from '../utils/http-error.js';

const TIPOS = ['AVATAR', 'MARCO', 'TEMA_EDITOR', 'FONDO'];
const RAREZAS = ['COMUN', 'RARO', 'EPICO', 'LEGENDARIO'];
const PATRON_IMAGEN = /^img\/tienda\/[a-z0-9-]+\.(svg|png|webp)$/;

function validar(datos) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (nombre.length < 2 || nombre.length > 60) {
    throw new HttpError(400, 'El nombre debe tener entre 2 y 60 caracteres');
  }
  if (!TIPOS.includes(datos.tipo)) {
    throw new HttpError(400, 'Elige una categoría válida');
  }
  if (!RAREZAS.includes(datos.rareza)) {
    throw new HttpError(400, 'Elige una rareza válida');
  }
  const precio = Number(datos.precio);
  if (!Number.isInteger(precio) || precio < 0 || precio > 100_000) {
    throw new HttpError(400, 'El precio debe ser un número entero entre 0 y 100 000 (0 = gratis)');
  }
  const descripcion = typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';
  if (descripcion.length > 140) {
    throw new HttpError(400, 'La descripción no puede pasar de 140 caracteres');
  }
  const imagen = datos.imagen || null;
  if (imagen !== null && !PATRON_IMAGEN.test(imagen)) {
    throw new HttpError(400, 'La imagen elegida no es válida');
  }
  return { nombre, tipo: datos.tipo, rareza: datos.rareza, precio, descripcion: descripcion || null, imagen, activo: datos.activo !== false };
}

function traducirDuplicado(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    return new HttpError(409, 'Ya hay un producto con ese nombre');
  }
  return error;
}

export async function listar() {
  const items = await tienda.listar();
  const resumen = {
    aLaVenta: items.filter((i) => i.activo).length,
    ocultos: items.filter((i) => !i.activo).length,
    vendidos: items.reduce((total, i) => total + i.vendidos, 0),
    monedas: items.reduce((total, i) => total + i.vendidos * i.precio, 0),
  };
  return { resumen, items };
}

export async function crear(actor, datos) {
  const item = validar(datos);
  try {
    return await enTransaccion(async (conexion) => {
      const id = await tienda.crear(conexion, item);
      await auditoria.registrar(conexion, actor.id, `Creó el producto «${item.nombre}» (${item.precio} monedas)`);
      return { id, ...item };
    });
  } catch (error) {
    throw traducirDuplicado(error);
  }
}

export async function actualizar(actor, id, datos) {
  const item = validar(datos);
  try {
    return await enTransaccion(async (conexion) => {
      const actual = await tienda.buscar(conexion, id);
      if (!actual) {
        throw new HttpError(404, 'Ese producto no existe');
      }
      await tienda.actualizar(conexion, id, item);
      await auditoria.registrar(conexion, actor.id, `Editó el producto «${item.nombre}»`);
      return { id, ...item };
    });
  } catch (error) {
    throw traducirDuplicado(error);
  }
}

export function fijarActivo(actor, id, activo) {
  return enTransaccion(async (conexion) => {
    const actual = await tienda.buscar(conexion, id);
    if (!actual) {
      throw new HttpError(404, 'Ese producto no existe');
    }
    await tienda.fijarActivo(conexion, id, Boolean(activo));
    await auditoria.registrar(conexion, actor.id, `${activo ? 'Puso a la venta' : 'Retiró de la venta'} el producto «${actual.nombre}»`);
    return { id, activo: Boolean(activo) };
  });
}

export async function eliminar(actor, id) {
  try {
    return await enTransaccion(async (conexion) => {
      const actual = await tienda.buscar(conexion, id);
      if (!actual) {
        throw new HttpError(404, 'Ese producto no existe');
      }
      await tienda.eliminar(conexion, id);
      await auditoria.registrar(conexion, actor.id, `Eliminó el producto «${actual.nombre}»`);
      return { id };
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Algún jugador ya tiene este producto. Retíralo de la venta en lugar de eliminarlo');
    }
    throw error;
  }
}
