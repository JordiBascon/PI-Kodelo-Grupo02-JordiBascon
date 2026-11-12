import * as cuentas from '../services/admin-account-service.js';
import * as tienda from '../services/admin-shop-service.js';
import * as problemas from '../services/admin-problem-service.js';
import * as frases from '../services/admin-phrase-service.js';
import { validarId } from '../utils/validacion.js';

const actor = (req) => ({ id: req.usuario.id, rol: req.usuario.rol });
const id = (req) => validarId(req.params.id);
const cuerpo = (req) => req.body ?? {};

export async function listarCuentas(req, res) {
  res.json(await cuentas.listar(req.query));
}

export async function cambiarRol(req, res) {
  res.json(await cuentas.cambiarRol(actor(req), id(req), cuerpo(req).rol));
}

export async function fijarMonedas(req, res) {
  res.json(await cuentas.fijarMonedas(actor(req), id(req), cuerpo(req)));
}

export async function bloquear(req, res) {
  res.json(await cuentas.bloquear(actor(req), id(req), cuerpo(req)));
}

export async function desbloquear(req, res) {
  res.json(await cuentas.desbloquear(actor(req), id(req)));
}

export async function eliminarCuenta(req, res) {
  res.json(await cuentas.eliminar(actor(req), id(req), cuerpo(req).confirmacion));
}

export async function auditoria(req, res) {
  res.json(await cuentas.registro());
}

export async function listarTienda(req, res) {
  res.json(await tienda.listar());
}

export async function crearItem(req, res) {
  res.status(201).json(await tienda.crear(actor(req), cuerpo(req)));
}

export async function actualizarItem(req, res) {
  res.json(await tienda.actualizar(actor(req), id(req), cuerpo(req)));
}

export async function activarItem(req, res) {
  res.json(await tienda.fijarActivo(actor(req), id(req), cuerpo(req).activo === true));
}

export async function eliminarItem(req, res) {
  res.json(await tienda.eliminar(actor(req), id(req)));
}

export async function listarProblemas(req, res) {
  res.json(await problemas.listar());
}

export async function detalleProblema(req, res) {
  res.json(await problemas.detalle(id(req)));
}

export async function crearProblema(req, res) {
  res.status(201).json(await problemas.crear(actor(req), cuerpo(req)));
}

export async function actualizarProblema(req, res) {
  res.json(await problemas.actualizar(actor(req), id(req), cuerpo(req)));
}

export async function activarProblema(req, res) {
  res.json(await problemas.fijarActivo(actor(req), id(req), cuerpo(req).activo === true));
}

export async function eliminarProblema(req, res) {
  res.json(await problemas.eliminar(actor(req), id(req)));
}

export async function listarFrases(req, res) {
  res.json(await frases.listar());
}

export async function crearFrase(req, res) {
  res.status(201).json(await frases.crear(actor(req), cuerpo(req)));
}

export async function actualizarFrase(req, res) {
  res.json(await frases.actualizar(actor(req), id(req), cuerpo(req)));
}

export async function eliminarFrase(req, res) {
  res.json(await frases.eliminar(actor(req), id(req)));
}
