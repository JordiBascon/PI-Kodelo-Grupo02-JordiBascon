import * as problemas from '../services/problem-service.js';
import { HttpError } from '../utils/http-error.js';
import { validarId } from '../utils/validacion.js';

export async function aleatorio(req, res) {
  const lenguaje = req.query.lenguaje;
  if (typeof lenguaje !== 'string' || !lenguaje) {
    throw new HttpError(400, 'Indica el lenguaje: /api/problemas/aleatorio?lenguaje=Python');
  }
  res.json(await problemas.aleatorio(lenguaje));
}

export async function porId(req, res) {
  res.json(await problemas.porId(validarId(req.params.id)));
}
