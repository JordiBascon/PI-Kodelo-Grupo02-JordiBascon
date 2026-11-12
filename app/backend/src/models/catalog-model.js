import { pool } from '../db/pool.js';

export async function listarLenguajes() {
  const [filas] = await pool.query(
    `SELECT l.id, l.nombre, COUNT(p.id) AS problemas
       FROM lenguaje l
       LEFT JOIN problema p ON p.lenguaje_id = l.id AND p.activo = TRUE
      GROUP BY l.id, l.nombre
      ORDER BY l.id`
  );
  return filas;
}

export async function fraseDelDia() {
  const [[delDia]] = await pool.query(
    'SELECT texto FROM frase WHERE dia_del_anio = DAYOFYEAR(CURDATE())'
  );
  if (delDia) {
    return delDia.texto;
  }
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM frase');
  if (total === 0) {
    return null;
  }
  const [[alternativa]] = await pool.query(
    'SELECT texto FROM frase ORDER BY id LIMIT 1 OFFSET ?',
    [new Date().getDate() % total]
  );
  return alternativa.texto;
}
