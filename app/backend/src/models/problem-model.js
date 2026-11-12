import { pool } from '../db/pool.js';

const COLUMNAS = `p.id, p.titulo, p.enunciado, p.dificultad, p.limite_tiempo_ms, p.limite_memoria_mb,
                  l.nombre AS lenguaje`;

export async function buscarAleatorio(lenguaje) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS}
       FROM problema p
       JOIN lenguaje l ON l.id = p.lenguaje_id
      WHERE p.activo = TRUE AND l.nombre = ?
      ORDER BY RAND()
      LIMIT 1`,
    [lenguaje]
  );
  return filas[0] ?? null;
}

export async function buscarPorId(id) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS}
       FROM problema p
       JOIN lenguaje l ON l.id = p.lenguaje_id
      WHERE p.activo = TRUE AND p.id = ?`,
    [id]
  );
  return filas[0] ?? null;
}

export async function casosVisibles(problemaId) {
  const [filas] = await pool.query(
    `SELECT entrada, salida_esperada
       FROM caso_prueba
      WHERE problema_id = ? AND oculto = FALSE
      ORDER BY id`,
    [problemaId]
  );
  return filas;
}

export async function contarCasosOcultos(problemaId) {
  const [[fila]] = await pool.query(
    'SELECT COUNT(*) AS total FROM caso_prueba WHERE problema_id = ? AND oculto = TRUE',
    [problemaId]
  );
  return fila.total;
}
