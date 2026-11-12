import { Router } from 'express';
import * as auth from '../controllers/auth-controller.js';
import * as catalogo from '../controllers/catalog-controller.js';
import * as problemas from '../controllers/problem-controller.js';
import * as tienda from '../controllers/shop-controller.js';
import * as usuarios from '../controllers/user-controller.js';
import { requiereSesion } from '../middlewares/auth-middleware.js';
import { rutasAdmin } from './admin-routes.js';

export const rutas = Router();

rutas.get('/health', catalogo.salud);
rutas.get('/lenguajes', catalogo.lenguajes);
rutas.get('/frase-del-dia', catalogo.fraseDelDia);

rutas.post('/auth/registro', auth.registro);
rutas.post('/auth/login', auth.login);

rutas.get('/usuarios/yo', requiereSesion, usuarios.yo);

rutas.get('/problemas/aleatorio', requiereSesion, problemas.aleatorio);
rutas.get('/problemas/:id', requiereSesion, problemas.porId);

rutas.get('/tienda', requiereSesion, tienda.listar);
rutas.post('/tienda/:id/comprar', requiereSesion, tienda.comprar);
rutas.post('/tienda/:id/equipar', requiereSesion, tienda.equipar);

rutas.use('/admin', requiereSesion, rutasAdmin);
