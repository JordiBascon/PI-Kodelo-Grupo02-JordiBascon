import * as catalogo from '../models/catalog-model.js';
import * as problemas from '../models/problem-model.js';
import { HttpError } from '../utils/http-error.js';

async function conEjemplos(problema) {
  const [ejemplos, ocultos] = await Promise.all([
    problemas.casosVisibles(problema.id),
    problemas.contarCasosOcultos(problema.id),
  ]);
  return { ...problema, ejemplos, casosOcultos: ocultos };
}

export async function aleatorio(lenguaje) {
  const lenguajes = await catalogo.listarLenguajes();
  if (!lenguajes.some((l) => l.nombre === lenguaje)) {
    throw new HttpError(400, 'Ese lenguaje no existe en KODELO');
  }
  const problema = await problemas.buscarAleatorio(lenguaje);
  if (!problema) {
    throw new HttpError(404, `Todavía no hay problemas de ${lenguaje}`);
  }
  return conEjemplos(problema);
}

export async function porId(id) {
  const problema = await problemas.buscarPorId(id);
  if (!problema) {
    throw new HttpError(404, 'Ese problema no existe');
  }
  return conEjemplos(problema);
}
