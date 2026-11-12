import { pool } from '../db/pool.js';

export async function levantarBloqueosCaducados() {
  await pool.query(
    `UPDATE usuario
        SET estado = 'ACTIVO', bloqueado_hasta = NULL, motivo_bloqueo = NULL
      WHERE estado = 'BLOQUEADO' AND bloqueado_hasta IS NOT NULL AND bloqueado_hasta <= NOW()`
  );
}

export async function listar({ buscar, rol, estado }) {
  const patron = `%${buscar}%`;
  const [filas] = await pool.query(
    `SELECT u.id, u.nick, u.email, u.rol, u.estado, u.bloqueado_hasta, u.motivo_bloqueo,
            u.elo, u.monedas, u.fecha_registro,
            (SELECT COUNT(*) FROM duelo d WHERE u.id IN (d.jugador1_id, d.jugador2_id)) AS duelos
       FROM usuario u
      WHERE (? = '' OR u.nick LIKE ? OR u.email LIKE ?)
        AND (? = '' OR u.rol = ?)
        AND (? = '' OR u.estado = ?)
      ORDER BY u.id`,
    [buscar, patron, patron, rol, rol, estado, estado]
  );
  return filas;
}

export async function resumen() {
  const [[fila]] = await pool.query(
    `SELECT COUNT(*) AS cuentas,
            SUM(estado = 'ACTIVO') AS activas,
            SUM(estado = 'BLOQUEADO') AS bloqueadas,
            SUM(rol IN ('ADMIN', 'MODERADOR')) AS equipo
       FROM usuario`
  );
  return Object.fromEntries(Object.entries(fila).map(([clave, valor]) => [clave, Number(valor ?? 0)]));
}

export async function bloquearFila(conexion, id) {
  const [[fila]] = await conexion.query(
    'SELECT id, nick, rol, estado, monedas FROM usuario WHERE id = ? FOR UPDATE',
    [id]
  );
  return fila ?? null;
}

export async function contarAdmins(conexion) {
  const [[{ total }]] = await conexion.query("SELECT COUNT(*) AS total FROM usuario WHERE rol = 'ADMIN'");
  return total;
}

export async function cambiarRol(conexion, id, rol) {
  await conexion.query('UPDATE usuario SET rol = ? WHERE id = ?', [rol, id]);
}

export async function fijarMonedas(conexion, id, monedas) {
  await conexion.query('UPDATE usuario SET monedas = ? WHERE id = ?', [monedas, id]);
}

export async function bloquear(conexion, id, hasta, motivo) {
  await conexion.query(
    "UPDATE usuario SET estado = 'BLOQUEADO', bloqueado_hasta = ?, motivo_bloqueo = ? WHERE id = ?",
    [hasta, motivo, id]
  );
}

export async function desbloquear(conexion, id) {
  await conexion.query(
    "UPDATE usuario SET estado = 'ACTIVO', bloqueado_hasta = NULL, motivo_bloqueo = NULL WHERE id = ?",
    [id]
  );
}

export async function eliminar(conexion, id) {
  await conexion.query('DELETE FROM usuario WHERE id = ?', [id]);
}
