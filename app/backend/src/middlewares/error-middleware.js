import { HttpError } from '../utils/http-error.js';

export function rutaNoEncontrada(req, res, next) {
  next(new HttpError(404, 'Ruta no encontrada'));
}

export function manejarErrores(error, req, res, next) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  const estado = error.estado ?? 500;
  if (estado === 500) {
    console.error(error);
  }
  res.status(estado).json({ error: estado === 500 ? 'Error interno del servidor' : error.message });
}
