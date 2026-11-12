import { Router } from 'express';
import * as admin from '../controllers/admin-controller.js';
import { requiereRol } from '../middlewares/rol-middleware.js';

export const rutasAdmin = Router();

const equipo = requiereRol('ADMIN', 'MODERADOR');
const soloAdmin = requiereRol('ADMIN');

rutasAdmin.get('/cuentas', equipo, admin.listarCuentas);
rutasAdmin.post('/cuentas/:id/bloqueo', equipo, admin.bloquear);
rutasAdmin.delete('/cuentas/:id/bloqueo', equipo, admin.desbloquear);
rutasAdmin.patch('/cuentas/:id/rol', soloAdmin, admin.cambiarRol);
rutasAdmin.put('/cuentas/:id/monedas', soloAdmin, admin.fijarMonedas);
rutasAdmin.delete('/cuentas/:id', soloAdmin, admin.eliminarCuenta);
rutasAdmin.get('/auditoria', equipo, admin.auditoria);

rutasAdmin.get('/tienda', soloAdmin, admin.listarTienda);
rutasAdmin.post('/tienda', soloAdmin, admin.crearItem);
rutasAdmin.put('/tienda/:id', soloAdmin, admin.actualizarItem);
rutasAdmin.patch('/tienda/:id/activo', soloAdmin, admin.activarItem);
rutasAdmin.delete('/tienda/:id', soloAdmin, admin.eliminarItem);

rutasAdmin.get('/problemas', soloAdmin, admin.listarProblemas);
rutasAdmin.get('/problemas/:id', soloAdmin, admin.detalleProblema);
rutasAdmin.post('/problemas', soloAdmin, admin.crearProblema);
rutasAdmin.put('/problemas/:id', soloAdmin, admin.actualizarProblema);
rutasAdmin.patch('/problemas/:id/activo', soloAdmin, admin.activarProblema);
rutasAdmin.delete('/problemas/:id', soloAdmin, admin.eliminarProblema);

rutasAdmin.get('/frases', soloAdmin, admin.listarFrases);
rutasAdmin.post('/frases', soloAdmin, admin.crearFrase);
rutasAdmin.put('/frases/:id', soloAdmin, admin.actualizarFrase);
rutasAdmin.delete('/frases/:id', soloAdmin, admin.eliminarFrase);
