import * as usuarios from '../services/user-service.js';

export async function yo(req, res) {
  res.json(await usuarios.perfilPropio(req.usuario.id));
}
