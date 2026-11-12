import { enTransaccion } from '../db/pool.js';
import * as problemas from '../models/admin-problem-model.js';
import * as auditoria from '../models/audit-model.js';
import { HttpError } from '../utils/http-error.js';

const DIFICULTADES = ['FACIL', 'MEDIA', 'DIFICIL'];

function entero(valor, minimo, maximo, mensaje) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new HttpError(400, mensaje);
  }
  return numero;
}

function validar(datos) {
  const titulo = typeof datos.titulo === 'string' ? datos.titulo.trim() : '';
  if (titulo.length < 3 || titulo.length > 120) {
    throw new HttpError(400, 'El título debe tener entre 3 y 120 caracteres');
  }
  const enunciado = typeof datos.enunciado === 'string' ? datos.enunciado.trim() : '';
  if (enunciado.length < 10 || enunciado.length > 5000) {
    throw new HttpError(400, 'El enunciado debe tener entre 10 y 5000 caracteres');
  }
  if (!DIFICULTADES.includes(datos.dificultad)) {
    throw new HttpError(400, 'Elige una dificultad válida');
  }
  const lenguajeId = entero(datos.lenguajeId, 1, 255, 'Elige un lenguaje');
  const limiteTiempoMs = entero(datos.limiteTiempoMs, 100, 10_000, 'El límite de tiempo debe estar entre 100 y 10 000 ms');
  const limiteMemoriaMb = entero(datos.limiteMemoriaMb, 16, 1024, 'El límite de memoria debe estar entre 16 y 1024 MB');

  if (!Array.isArray(datos.casos) || datos.casos.length < 1 || datos.casos.length > 20) {
    throw new HttpError(400, 'El problema necesita entre 1 y 20 casos de prueba');
  }
  const casos = datos.casos.map((caso, i) => {
    const entrada = typeof caso.entrada === 'string' ? caso.entrada : '';
    const salida = typeof caso.salida === 'string' ? caso.salida.trim() : '';
    if (!salida) {
      throw new HttpError(400, `El caso ${i + 1} no tiene salida esperada`);
    }
    if (entrada.length > 10_000 || salida.length > 10_000) {
      throw new HttpError(400, `El caso ${i + 1} es demasiado largo (máximo 10 000 caracteres)`);
    }
    return { entrada, salida, oculto: Boolean(caso.oculto) };
  });
  if (!casos.some((c) => !c.oculto)) {
    throw new HttpError(400, 'Al menos un caso tiene que ser visible: es el ejemplo que ve el jugador');
  }
  return { titulo, enunciado, dificultad: datos.dificultad, lenguajeId, limiteTiempoMs, limiteMemoriaMb, activo: datos.activo !== false, casos };
}

function traducir(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    return new HttpError(409, 'Ya hay un problema con ese título en ese lenguaje');
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new HttpError(400, 'Ese lenguaje no existe');
  }
  return error;
}

export async function listar() {
  const lista = await problemas.listar();
  const resumen = {
    activos: lista.filter((p) => p.activo).length,
    desactivados: lista.filter((p) => !p.activo).length,
    casos: lista.reduce((total, p) => total + p.visibles + p.ocultos, 0),
    duelos: lista.reduce((total, p) => total + p.duelos, 0),
  };
  return { resumen, problemas: lista };
}

export async function detalle(id) {
  const problema = await problemas.detalle(id);
  if (!problema) {
    throw new HttpError(404, 'Ese problema no existe');
  }
  return problema;
}

export async function crear(actor, datos) {
  const p = validar(datos);
  try {
    return await enTransaccion(async (conexion) => {
      const id = await problemas.crear(conexion, p);
      await problemas.reemplazarCasos(conexion, id, p.casos);
      await auditoria.registrar(conexion, actor.id, `Creó el problema «${p.titulo}» con ${p.casos.length} casos de prueba`);
      return { id };
    });
  } catch (error) {
    throw traducir(error);
  }
}

export async function actualizar(actor, id, datos) {
  const p = validar(datos);
  try {
    return await enTransaccion(async (conexion) => {
      if (!(await problemas.buscar(conexion, id))) {
        throw new HttpError(404, 'Ese problema no existe');
      }
      await problemas.actualizar(conexion, id, p);
      await problemas.reemplazarCasos(conexion, id, p.casos);
      await auditoria.registrar(conexion, actor.id, `Editó el problema «${p.titulo}»`);
      return { id };
    });
  } catch (error) {
    throw traducir(error);
  }
}

export function fijarActivo(actor, id, activo) {
  return enTransaccion(async (conexion) => {
    const actual = await problemas.buscar(conexion, id);
    if (!actual) {
      throw new HttpError(404, 'Ese problema no existe');
    }
    await problemas.fijarActivo(conexion, id, Boolean(activo));
    await auditoria.registrar(conexion, actor.id, `${activo ? 'Activó' : 'Desactivó'} el problema «${actual.titulo}»`);
    return { id, activo: Boolean(activo) };
  });
}

export async function eliminar(actor, id) {
  try {
    return await enTransaccion(async (conexion) => {
      const actual = await problemas.buscar(conexion, id);
      if (!actual) {
        throw new HttpError(404, 'Ese problema no existe');
      }
      await problemas.eliminar(conexion, id);
      await auditoria.registrar(conexion, actor.id, `Eliminó el problema «${actual.titulo}»`);
      return { id };
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Este problema ya se ha jugado o resuelto en práctica. Desactívalo en lugar de eliminarlo');
    }
    throw error;
  }
}
