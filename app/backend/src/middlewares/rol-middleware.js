import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';

export function requiereRol(...roles) {
  return async (req, res, next) => {
    const [[usuario]] = await pool.query(
      'SELECT nick, rol, estado, bloqueado_hasta FROM usuario WHERE id = ?',
      [req.usuario.id]
    );
    if (!usuario) {
      throw new HttpError(401, 'La sesión no es válida. Vuelve a iniciar sesión');
    }
    const bloqueado = usuario.estado === 'BLOQUEADO'
      && (!usuario.bloqueado_hasta || new Date(usuario.bloqueado_hasta) > new Date());
    if (bloqueado) {
      throw new HttpError(403, 'Tu cuenta está bloqueada');
    }
    if (!roles.includes(usuario.rol)) {
      throw new HttpError(403, 'No tienes permiso para entrar en esta sección');
    }
    req.usuario.rol = usuario.rol;
    req.usuario.nick = usuario.nick;
    next();
  };
}
