import { pool } from '../db/pool.js';

export async function registrar(conexion, adminId, accion) {
  await conexion.query('INSERT INTO auditoria_admin (admin_id, accion) VALUES (?, ?)', [adminId, accion.slice(0, 255)]);
}

export async function ultimas(limite = 50) {
  const [filas] = await pool.query(
    `SELECT a.id, a.accion, a.fecha, u.nick AS admin, u.rol
       FROM auditoria_admin a
       JOIN usuario u ON u.id = a.admin_id
      ORDER BY a.fecha DESC, a.id DESC
      LIMIT ?`,
    [limite]
  );
  return filas;
}
