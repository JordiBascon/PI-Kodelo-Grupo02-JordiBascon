import { pool } from '../db/pool.js';

export async function listar() {
  const [filas] = await pool.query(
    `SELECT p.id, p.titulo, p.dificultad, p.activo, p.lenguaje_id, l.nombre AS lenguaje,
            COALESCE(SUM(c.oculto = FALSE), 0) AS visibles,
            COALESCE(SUM(c.oculto = TRUE), 0) AS ocultos,
            (SELECT COUNT(*) FROM duelo d WHERE d.problema_id = p.id) AS duelos
       FROM problema p
       JOIN lenguaje l ON l.id = p.lenguaje_id
       LEFT JOIN caso_prueba c ON c.problema_id = p.id
      GROUP BY p.id
      ORDER BY l.id, p.titulo`
  );
  return filas.map((fila) => ({
    ...fila,
    activo: Boolean(fila.activo),
    visibles: Number(fila.visibles),
    ocultos: Number(fila.ocultos),
    duelos: Number(fila.duelos),
  }));
}

export async function detalle(id) {
  const [[problema]] = await pool.query(
    `SELECT id, lenguaje_id, titulo, enunciado, dificultad, limite_tiempo_ms, limite_memoria_mb, activo
       FROM problema WHERE id = ?`,
    [id]
  );
  if (!problema) {
    return null;
  }
  const [casos] = await pool.query(
    'SELECT entrada, salida_esperada, oculto FROM caso_prueba WHERE problema_id = ? ORDER BY id',
    [id]
  );
  return {
    ...problema,
    activo: Boolean(problema.activo),
    casos: casos.map((c) => ({ ...c, oculto: Boolean(c.oculto) })),
  };
}

export async function buscar(conexion, id) {
  const [[fila]] = await conexion.query('SELECT id, titulo FROM problema WHERE id = ? FOR UPDATE', [id]);
  return fila ?? null;
}

export async function crear(conexion, p) {
  const [resultado] = await conexion.query(
    `INSERT INTO problema (lenguaje_id, titulo, enunciado, dificultad, limite_tiempo_ms, limite_memoria_mb, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [p.lenguajeId, p.titulo, p.enunciado, p.dificultad, p.limiteTiempoMs, p.limiteMemoriaMb, p.activo]
  );
  return resultado.insertId;
}

export async function actualizar(conexion, id, p) {
  await conexion.query(
    `UPDATE problema
        SET lenguaje_id = ?, titulo = ?, enunciado = ?, dificultad = ?, limite_tiempo_ms = ?, limite_memoria_mb = ?, activo = ?
      WHERE id = ?`,
    [p.lenguajeId, p.titulo, p.enunciado, p.dificultad, p.limiteTiempoMs, p.limiteMemoriaMb, p.activo, id]
  );
}

export async function reemplazarCasos(conexion, problemaId, casos) {
  await conexion.query('DELETE FROM caso_prueba WHERE problema_id = ?', [problemaId]);
  const filas = casos.map((c) => [problemaId, c.entrada, c.salida, c.oculto]);
  await conexion.query('INSERT INTO caso_prueba (problema_id, entrada, salida_esperada, oculto) VALUES ?', [filas]);
}

export async function fijarActivo(conexion, id, activo) {
  await conexion.query('UPDATE problema SET activo = ? WHERE id = ?', [activo, id]);
}

export async function eliminar(conexion, id) {
  await conexion.query('DELETE FROM problema WHERE id = ?', [id]);
}
