import { pool } from '../db/pool.js';

export async function buscarParaLogin(identificador) {
  const [filas] = await pool.query(
    `SELECT id, nick, password_hash, rol, estado, bloqueado_hasta, motivo_bloqueo
       FROM usuario
      WHERE email = ? OR nick = ?`,
    [identificador.toLowerCase(), identificador]
  );
  return filas[0] ?? null;
}

export async function buscarDuplicado(nick, email) {
  const [filas] = await pool.query(
    'SELECT nick, email FROM usuario WHERE nick = ? OR email = ? LIMIT 1',
    [nick, email]
  );
  return filas[0] ?? null;
}

export async function crear(conexion, { nick, email, passwordHash }) {
  const [resultado] = await conexion.query(
    'INSERT INTO usuario (nick, email, password_hash) VALUES (?, ?, ?)',
    [nick, email, passwordHash]
  );
  return resultado.insertId;
}

export async function crearEloPorLenguaje(conexion, usuarioId) {
  await conexion.query(
    'INSERT INTO usuario_lenguaje (usuario_id, lenguaje_id) SELECT ?, id FROM lenguaje',
    [usuarioId]
  );
}

export async function darAvatarInicial(conexion, usuarioId) {
  await conexion.query(
    `INSERT INTO inventario (usuario_id, item_id, equipado)
     SELECT ?, id, TRUE FROM item_tienda
      WHERE tipo = 'AVATAR' AND precio = 0 AND activo = TRUE
      ORDER BY id
      LIMIT 1`,
    [usuarioId]
  );
}

export async function desbloquear(id) {
  await pool.query(
    `UPDATE usuario
        SET estado = 'ACTIVO', bloqueado_hasta = NULL, motivo_bloqueo = NULL
      WHERE id = ?`,
    [id]
  );
}

export async function buscarPerfil(id) {
  const [filas] = await pool.query(
    `SELECT u.id, u.nick, u.bio, u.rol, u.elo, u.monedas, u.fecha_registro,
            (SELECT i.imagen
               FROM inventario inv
               JOIN item_tienda i ON i.id = inv.item_id
              WHERE inv.usuario_id = u.id AND inv.equipado = TRUE AND i.tipo = 'AVATAR'
              LIMIT 1) AS avatar,
            (SELECT COUNT(*) FROM duelo d
              WHERE d.estado = 'FINALIZADO' AND u.id IN (d.jugador1_id, d.jugador2_id)) AS duelos,
            (SELECT COUNT(*) FROM duelo d
              WHERE d.estado = 'FINALIZADO' AND d.ganador_id = u.id) AS victorias
       FROM usuario u
      WHERE u.id = ?`,
    [id]
  );
  return filas[0] ?? null;
}

export async function estadisticasPorLenguaje(id) {
  const [filas] = await pool.query(
    `SELECT l.nombre AS lenguaje,
            ul.elo,
            (SELECT COUNT(*) + 1
               FROM usuario_lenguaje otro
               JOIN usuario u ON u.id = otro.usuario_id
              WHERE otro.lenguaje_id = ul.lenguaje_id AND u.rol = 'JUGADOR' AND otro.elo > ul.elo) AS posicion,
            (SELECT COUNT(*)
               FROM usuario_lenguaje otro
               JOIN usuario u ON u.id = otro.usuario_id
              WHERE otro.lenguaje_id = ul.lenguaje_id AND u.rol = 'JUGADOR') AS jugadores,
            (SELECT COALESCE(SUM(IF(d.jugador1_id = ul.usuario_id, d.elo_cambio_jugador1, d.elo_cambio_jugador2)), 0)
               FROM duelo d
               JOIN problema p ON p.id = d.problema_id
              WHERE p.lenguaje_id = ul.lenguaje_id
                AND d.estado = 'FINALIZADO'
                AND ul.usuario_id IN (d.jugador1_id, d.jugador2_id)
                AND d.fecha_fin >= NOW() - INTERVAL 7 DAY) AS eloSemana
       FROM usuario_lenguaje ul
       JOIN lenguaje l ON l.id = ul.lenguaje_id
      WHERE ul.usuario_id = ?
      ORDER BY l.id`,
    [id]
  );
  return filas.map((fila) => ({ ...fila, eloSemana: Number(fila.eloSemana) }));
}

export async function ultimosGanadores(id, limite = 20) {
  const [filas] = await pool.query(
    `SELECT ganador_id AS ganadorId
       FROM duelo
      WHERE estado = 'FINALIZADO' AND ? IN (jugador1_id, jugador2_id)
      ORDER BY fecha_fin DESC
      LIMIT ?`,
    [id, limite]
  );
  return filas;
}
