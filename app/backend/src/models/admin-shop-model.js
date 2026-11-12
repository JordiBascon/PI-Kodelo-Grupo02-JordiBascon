import { pool } from '../db/pool.js';

export async function listar() {
  const [filas] = await pool.query(
    `SELECT i.id, i.nombre, i.tipo, i.precio, i.imagen, i.descripcion, i.rareza, i.activo,
            COUNT(inv.usuario_id) AS vendidos
       FROM item_tienda i
       LEFT JOIN inventario inv ON inv.item_id = i.id
      GROUP BY i.id
      ORDER BY FIELD(i.tipo, 'AVATAR', 'MARCO', 'TEMA_EDITOR', 'FONDO'), i.precio, i.id`
  );
  return filas.map((fila) => ({ ...fila, activo: Boolean(fila.activo), vendidos: Number(fila.vendidos) }));
}

export async function buscar(conexion, id) {
  const [[fila]] = await conexion.query('SELECT id, nombre, activo FROM item_tienda WHERE id = ? FOR UPDATE', [id]);
  return fila ?? null;
}

export async function crear(conexion, item) {
  const [resultado] = await conexion.query(
    `INSERT INTO item_tienda (nombre, tipo, precio, imagen, descripcion, rareza, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [item.nombre, item.tipo, item.precio, item.imagen, item.descripcion, item.rareza, item.activo]
  );
  return resultado.insertId;
}

export async function actualizar(conexion, id, item) {
  await conexion.query(
    `UPDATE item_tienda
        SET nombre = ?, tipo = ?, precio = ?, imagen = ?, descripcion = ?, rareza = ?, activo = ?
      WHERE id = ?`,
    [item.nombre, item.tipo, item.precio, item.imagen, item.descripcion, item.rareza, item.activo, id]
  );
}

export async function fijarActivo(conexion, id, activo) {
  await conexion.query('UPDATE item_tienda SET activo = ? WHERE id = ?', [activo, id]);
}

export async function eliminar(conexion, id) {
  await conexion.query('DELETE FROM item_tienda WHERE id = ?', [id]);
}
