import { pool } from '../db/pool.js';
import * as catalogo from '../models/catalog-model.js';

export async function salud(req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', baseDeDatos: 'ok' });
  } catch (error) {
    console.error(`Sin conexión con la base de datos: ${error.code ?? error.message}`);
    res.status(503).json({ estado: 'error', baseDeDatos: 'sin conexión' });
  }
}

export async function lenguajes(req, res) {
  res.json(await catalogo.listarLenguajes());
}

export async function fraseDelDia(req, res) {
  res.json({ texto: await catalogo.fraseDelDia() });
}
