import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

export function verificarToken(token) {
  const datos = jwt.verify(token, config.jwt.secreto);
  return { id: Number(datos.sub), rol: datos.rol };
}

export function requiereSesion(req, res, next) {
  const [tipo, token] = (req.get('Authorization') ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Tienes que iniciar sesión'));
  }
  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    next(new HttpError(401, 'La sesión no es válida o ha caducado. Vuelve a iniciar sesión'));
  }
}
