import * as tienda from '../services/shop-service.js';
import { validarId } from '../utils/validacion.js';

export async function listar(req, res) {
  res.json(await tienda.listar(req.usuario.id));
}

export async function comprar(req, res) {
  res.status(201).json(await tienda.comprar(req.usuario.id, validarId(req.params.id)));
}

export async function equipar(req, res) {
  res.json(await tienda.equipar(req.usuario.id, validarId(req.params.id)));
}
