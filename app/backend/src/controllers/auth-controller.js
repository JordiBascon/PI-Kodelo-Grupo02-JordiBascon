import * as auth from '../services/auth-service.js';

export async function registro(req, res) {
  const sesion = await auth.registrar(req.body ?? {});
  res.status(201).json(sesion);
}

export async function login(req, res) {
  const sesion = await auth.iniciarSesion(req.body ?? {});
  res.json(sesion);
}
