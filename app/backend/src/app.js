import express from 'express';
import { manejarErrores, rutaNoEncontrada } from './middlewares/error-middleware.js';
import { rutas } from './routes/index.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

app.use('/api', rutas);
app.use(rutaNoEncontrada);
app.use(manejarErrores);
