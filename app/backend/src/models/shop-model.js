import { pool } from '../db/pool.js';

export async function listarParaUsuario(usuarioId) {
  const [filas] = await pool.query(
    `SELECT i.id, i.nombre, i.tipo, i.precio, i.imagen, i.descripcion, i.rareza, i.activo,
            (inv.usuario_id IS NOT NULL) AS comprado,
            COALESCE(inv.equipado, FALSE) AS equipado
       FROM item_tienda i
       LEFT JOIN inventario inv ON inv.item_id = i.id AND inv.usuario_id = ?
      WHERE i.activo = TRUE OR inv.usuario_id IS NOT NULL
      ORDER BY FIELD(i.tipo, 'AVATAR', 'MARCO', 'TEMA_EDITOR', 'FONDO'), i.precio, i.id`,
    [usuarioId]
  );
  return filas.map((fila) => ({
    ...fila,
    activo: Boolean(fila.activo),
    comprado: Boolean(fila.comprado),
    equipado: Boolean(fila.equipado),
  }));
}

export async function bloquearSaldo(conexion, usuarioId) {
  const [[fila]] = await conexion.query('SELECT monedas FROM usuario WHERE id = ? FOR UPDATE', [usuarioId]);
  return fila?.monedas ?? null;
}

export async function buscarItem(conexion, itemId) {
  const [[fila]] = await conexion.query(
    'SELECT id, nombre, tipo, precio, activo FROM item_tienda WHERE id = ?',
    [itemId]
  );
  return fila ?? null;
}

export async function loTiene(conexion, usuarioId, itemId) {
  const [filas] = await conexion.query(
    'SELECT 1 FROM inventario WHERE usuario_id = ? AND item_id = ?',
    [usuarioId, itemId]
  );
  return filas.length > 0;
}

export async function cobrar(conexion, usuarioId, precio) {
  await conexion.query('UPDATE usuario SET monedas = monedas - ? WHERE id = ?', [precio, usuarioId]);
}

export async function anadirAlInventario(conexion, usuarioId, itemId) {
  await conexion.query('INSERT INTO inventario (usuario_id, item_id) VALUES (?, ?)', [usuarioId, itemId]);
}

export async function equiparSoloEste(conexion, usuarioId, itemId, tipo) {
  await conexion.query(
    `UPDATE inventario inv
       JOIN item_tienda i ON i.id = inv.item_id
        SET inv.equipado = (inv.item_id = ?)
      WHERE inv.usuario_id = ? AND i.tipo = ?`,
    [itemId, usuarioId, tipo]
  );
}
