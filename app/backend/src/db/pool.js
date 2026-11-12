import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

export const pool = mysql.createPool({
  ...config.db,
  charset: 'utf8mb4',
  dateStrings: true,
  connectionLimit: 10,
  waitForConnections: true,
});

export async function enTransaccion(trabajo) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await trabajo(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
