import { enTransaccion, pool } from '../db/pool.js';
import * as auditoria from '../models/audit-model.js';
import { HttpError } from '../utils/http-error.js';

function validar({ texto, diaDelAnio }) {
  const limpio = typeof texto === 'string' ? texto.trim() : '';
  if (limpio.length < 3 || limpio.length > 280) {
    throw new HttpError(400, 'La frase debe tener entre 3 y 280 caracteres');
  }
  const dia = Number(diaDelAnio);
  if (!Number.isInteger(dia) || dia < 1 || dia > 366) {
    throw new HttpError(400, 'El día del año debe estar entre 1 y 366');
  }
  return { texto: limpio, dia };
}

function traducir(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    return new HttpError(409, 'Ya hay una frase para ese día');
  }
  return error;
}

async function buscar(conexion, id) {
  const [[fila]] = await conexion.query('SELECT id, dia_del_anio FROM frase WHERE id = ? FOR UPDATE', [id]);
  if (!fila) {
    throw new HttpError(404, 'Esa frase no existe');
  }
  return fila;
}

export async function listar() {
  const [frases] = await pool.query('SELECT id, texto, dia_del_anio AS diaDelAnio FROM frase ORDER BY dia_del_anio');
  const [[{ hoy }]] = await pool.query('SELECT DAYOFYEAR(CURDATE()) AS hoy');
  return { hoy, frases };
}

export async function crear(actor, datos) {
  const { texto, dia } = validar(datos);
  try {
    return await enTransaccion(async (conexion) => {
      const [resultado] = await conexion.query('INSERT INTO frase (texto, dia_del_anio) VALUES (?, ?)', [texto, dia]);
      await auditoria.registrar(conexion, actor.id, `Añadió la frase de KODY del día ${dia}`);
      return { id: resultado.insertId };
    });
  } catch (error) {
    throw traducir(error);
  }
}

export async function actualizar(actor, id, datos) {
  const { texto, dia } = validar(datos);
  try {
    return await enTransaccion(async (conexion) => {
      await buscar(conexion, id);
      await conexion.query('UPDATE frase SET texto = ?, dia_del_anio = ? WHERE id = ?', [texto, dia, id]);
      await auditoria.registrar(conexion, actor.id, `Editó la frase de KODY del día ${dia}`);
      return { id };
    });
  } catch (error) {
    throw traducir(error);
  }
}

export function eliminar(actor, id) {
  return enTransaccion(async (conexion) => {
    const frase = await buscar(conexion, id);
    await conexion.query('DELETE FROM frase WHERE id = ?', [id]);
    await auditoria.registrar(conexion, actor.id, `Eliminó la frase de KODY del día ${frase.dia_del_anio}`);
    return { id };
  });
}
