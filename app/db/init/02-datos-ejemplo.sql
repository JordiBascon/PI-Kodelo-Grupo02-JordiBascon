SET NAMES utf8mb4;

INSERT INTO lenguaje (id, nombre) VALUES
  (1, 'Python'), (2, 'JavaScript'), (3, 'Java'), (4, 'PHP'), (5, 'SQL'), (6, 'HTML'), (7, 'CSS');

INSERT INTO usuario (id, nick, email, password_hash, bio, rol, estado, bloqueado_hasta, motivo_bloqueo, elo, monedas, fecha_registro) VALUES
  (1, 'admin',         'admin@prueba.com',     '$2b$10$gnVtG7Aj3r8e9IXfvoC9feKLSskBcSUcoQVIVZEWjHcFs1YqjvsZi', 'Administrador de KODELO', 'ADMIN',     'ACTIVO',    NULL, NULL, 1000, 0,    '2026-10-01 09:00:00'),
  (2, 'moderador',     'moderador@prueba.com', '$2b$10$gnVtG7Aj3r8e9IXfvoC9feKLSskBcSUcoQVIVZEWjHcFs1YqjvsZi', 'Moderador de la comunidad', 'MODERADOR', 'ACTIVO',    NULL, NULL, 1000, 0,    '2026-10-01 09:05:00'),
  (3, 'Kodeler_042',   'usuario@prueba.com',   '$2b$10$gnVtG7Aj3r8e9IXfvoC9feKLSskBcSUcoQVIVZEWjHcFs1YqjvsZi', 'Duelos 1v1 en Python', 'JUGADOR',   'ACTIVO',    NULL, NULL, 1214, 1250, '2026-10-05 17:20:00'),
  (4, 'ByteRunner',    'byte@prueba.com',      '$2b$10$gnVtG7Aj3r8e9IXfvoC9feKLSskBcSUcoQVIVZEWjHcFs1YqjvsZi', NULL, 'JUGADOR',   'ACTIVO',    NULL, NULL, 1086, 300,  '2026-10-08 20:10:00'),
  (5, 'SyntaxSamurai', 'samurai@prueba.com',   '$2b$10$gnVtG7Aj3r8e9IXfvoC9feKLSskBcSUcoQVIVZEWjHcFs1YqjvsZi', 'JavaScript o nada', 'JUGADOR',   'ACTIVO',    NULL, NULL, 1340, 820,  '2026-10-09 11:45:00'),
  (6, 'NullPointer',   'null@prueba.com',      '$2b$10$gnVtG7Aj3r8e9IXfvoC9feKLSskBcSUcoQVIVZEWjHcFs1YqjvsZi', NULL, 'JUGADOR',   'BLOQUEADO', '2026-11-20 00:00:00', 'Lenguaje ofensivo hacia otro jugador', 988, 50, '2026-10-15 16:30:00');

INSERT INTO usuario_lenguaje (usuario_id, lenguaje_id)
SELECT u.id, l.id FROM usuario u CROSS JOIN lenguaje l;

UPDATE usuario_lenguaje SET elo = 1216 WHERE usuario_id = 3 AND lenguaje_id = 1;
UPDATE usuario_lenguaje SET elo = 986  WHERE usuario_id = 3 AND lenguaje_id = 2;
UPDATE usuario_lenguaje SET elo = 1012 WHERE usuario_id = 3 AND lenguaje_id = 3;
UPDATE usuario_lenguaje SET elo = 984  WHERE usuario_id = 4 AND lenguaje_id = 1;
UPDATE usuario_lenguaje SET elo = 1014 WHERE usuario_id = 5 AND lenguaje_id = 2;
UPDATE usuario_lenguaje SET elo = 988  WHERE usuario_id = 6 AND lenguaje_id = 3;

INSERT INTO problema (id, lenguaje_id, titulo, enunciado, dificultad, limite_tiempo_ms, limite_memoria_mb) VALUES
  (1, 1, 'Two Sum Express', 'Se recibe en la primera línea una lista de enteros separados por espacios y en la segunda un entero objetivo. Escribe los índices de los dos números que suman el objetivo, separados por un espacio.', 'MEDIA', 2000, 256),
  (2, 1, 'Palíndromo bajo presión', 'Se recibe una frase. Escribe True si es un palíndromo ignorando mayúsculas, espacios y signos, o False si no lo es.', 'FACIL', 1000, 128),
  (3, 2, 'FizzBuzz relámpago', 'Se recibe un entero n. Escribe los números del 1 al n, uno por línea, cambiando los múltiplos de 3 por Fizz, los de 5 por Buzz y los de ambos por FizzBuzz.', 'FACIL', 1000, 128),
  (4, 3, 'Suma de dígitos', 'Se recibe un entero positivo. Escribe la suma de sus dígitos.', 'FACIL', 2000, 256),
  (5, 5, 'Jugadores de élite', 'Dada la tabla jugador(nick, elo), escribe una consulta que devuelva el nick de los jugadores con más de 1200 de ELO, ordenados de mayor a menor ELO.', 'MEDIA', 2000, 128),
  (6, 4, 'Invertir palabras', 'Se recibe una frase. Escribe las mismas palabras en orden inverso, separadas por un espacio.', 'FACIL', 1000, 128);

INSERT INTO caso_prueba (problema_id, entrada, salida_esperada, oculto) VALUES
  (1, '2 7 11 15\n9', '0 1', FALSE),
  (1, '3 2 4\n6', '1 2', TRUE),
  (1, '1 5 9 13\n22', '2 3', TRUE),
  (2, 'Anita lava la tina', 'True', FALSE),
  (2, 'KODELO', 'False', TRUE),
  (3, '3', '1\n2\nFizz', FALSE),
  (3, '15', '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', TRUE),
  (4, '1234', '10', FALSE),
  (4, '9', '9', TRUE),
  (5, 'ana 1300\nluis 1100\neva 1250', 'ana\neva', FALSE),
  (6, 'hola mundo', 'mundo hola', FALSE),
  (6, 'el duelo empieza ya', 'ya empieza duelo el', TRUE);

INSERT INTO duelo (id, problema_id, jugador1_id, jugador2_id, ganador_id, estado, elo_cambio_jugador1, elo_cambio_jugador2, codigo_sala, fecha_inicio, fecha_fin) VALUES
  (1, 1, 3, 4, 3,    'FINALIZADO', 16,  -16,  NULL,     '2026-11-10 18:00:00', '2026-11-10 18:07:42'),
  (2, 3, 3, 5, 5,    'FINALIZADO', -14, 14,   NULL,     '2026-11-10 18:20:00', '2026-11-10 18:24:15'),
  (3, 2, 4, 6, NULL, 'CANCELADO',  NULL, NULL, NULL,    '2026-11-11 19:00:00', '2026-11-11 19:00:40'),
  (4, 4, 3, 6, 3,    'FINALIZADO', 12,  -12,  'K7Q2ZP', '2026-11-11 21:10:00', '2026-11-11 21:16:05');

INSERT INTO entrega (duelo_id, usuario_id, codigo, tiempo_ms, memoria_kb, porcentaje_tests, fecha_envio) VALUES
  (1, 3, 'nums = list(map(int, input().split()))\nobjetivo = int(input())\nprint(0, 1)', 31, 9200, 33, '2026-11-10 18:04:10'),
  (1, 3, 'nums = list(map(int, input().split()))\nobjetivo = int(input())\nvistos = {}\nfor i, n in enumerate(nums):\n    if objetivo - n in vistos:\n        print(vistos[objetivo - n], i)\n        break\n    vistos[n] = i', 28, 9300, 100, '2026-11-10 18:07:30'),
  (1, 4, 'nums = list(map(int, input().split()))\nobjetivo = int(input())\nfor i in range(len(nums)):\n    for j in range(len(nums)):\n        if nums[i] + nums[j] == objetivo:\n            print(i, j)', 35, 9100, 33, '2026-11-10 18:06:55'),
  (2, 5, 'const n = Number(require(\'fs\').readFileSync(0, \'utf8\'));\nfor (let i = 1; i <= n; i++) console.log(i % 15 === 0 ? \'FizzBuzz\' : i % 3 === 0 ? \'Fizz\' : i % 5 === 0 ? \'Buzz\' : i);', 42, 30100, 100, '2026-11-10 18:23:58'),
  (2, 3, 'const n = Number(require(\'fs\').readFileSync(0, \'utf8\'));\nfor (let i = 1; i <= n; i++) console.log(i % 3 === 0 ? \'Fizz\' : i % 5 === 0 ? \'Buzz\' : i);', 40, 30050, 50, '2026-11-10 18:24:10'),
  (4, 3, 'import java.util.Scanner;\npublic class Main {\n  public static void main(String[] a) {\n    String s = new Scanner(System.in).next();\n    int t = 0;\n    for (char c : s.toCharArray()) t += c - \'0\';\n    System.out.println(t);\n  }\n}', 120, 41000, 100, '2026-11-11 21:15:50');

INSERT INTO item_tienda (id, nombre, tipo, precio, imagen, descripcion, rareza, activo) VALUES
  (1, 'KODY clásico',         'AVATAR',      0,    'img/tienda/kody-clasico.svg',    'El KODY de siempre, listo para el duelo', 'COMUN',      TRUE),
  (2, 'KODY neón',            'AVATAR',      300,  'img/tienda/kody-neon.svg',       'KODY con brillo de neón índigo',          'RARO',       TRUE),
  (3, 'Marco índigo',         'MARCO',       150,  'img/tienda/marco-indigo.svg',    'Marco con el color de KODELO',            'COMUN',      TRUE),
  (4, 'Marco dorado',         'MARCO',       800,  'img/tienda/marco-dorado.svg',    'Solo para quien gana a menudo',           'EPICO',      TRUE),
  (5, 'Tema Medianoche',      'TEMA_EDITOR', 400,  'img/tienda/tema-medianoche.svg', 'Editor en azul noche, suave para la vista','RARO',      TRUE),
  (6, 'Tema Terminal retro',  'TEMA_EDITOR', 650,  'img/tienda/tema-retro.svg',      'Verde sobre negro, como en los 80',       'EPICO',      TRUE),
  (7, 'Fondo cuadrícula',     'FONDO',       100,  'img/tienda/fondo-cuadricula.svg','Cuadrícula discreta para el perfil',      'COMUN',      TRUE),
  (8, 'Fondo constelación',   'FONDO',       1500, 'img/tienda/fondo-constelacion.svg','Un cielo de estrellas detrás de tu nick','LEGENDARIO', TRUE),
  (9, 'Marco Halloween 2026', 'MARCO',       200,  'img/tienda/marco-halloween.svg', 'Edición limitada de octubre',             'RARO',       FALSE);

INSERT INTO inventario (usuario_id, item_id, equipado, fecha_compra) VALUES
  (3, 1, TRUE,  '2026-10-05 17:20:00'),
  (3, 3, TRUE,  '2026-10-20 19:00:00'),
  (3, 5, TRUE,  '2026-11-02 21:30:00'),
  (3, 9, FALSE, '2026-10-28 18:15:00'),
  (4, 1, FALSE, '2026-10-08 20:10:00'),
  (4, 2, TRUE,  '2026-10-25 22:00:00'),
  (5, 1, TRUE,  '2026-10-09 11:45:00'),
  (6, 1, TRUE,  '2026-10-15 16:30:00');

INSERT INTO practica_resuelta (usuario_id, problema_id, fecha) VALUES
  (3, 2, '2026-10-06 18:00:00'),
  (3, 6, '2026-10-12 17:40:00'),
  (5, 3, '2026-10-10 10:15:00');

INSERT INTO auditoria_admin (admin_id, accion, fecha) VALUES
  (1, 'Creó el problema «Two Sum Express»', '2026-10-02 10:00:00'),
  (1, 'Retiró de la venta el ítem «Marco Halloween 2026»', '2026-11-01 09:00:00'),
  (2, 'Bloqueó a NullPointer hasta el 20/11/2026: lenguaje ofensivo hacia otro jugador', '2026-11-12 08:30:00');

INSERT INTO frase (texto, dia_del_anio) VALUES
  ('Primero haz que funcione. Luego, que sea bonito.', 1),
  ('Un bug encontrado hoy es un duelo ganado mañana.', 316),
  ('Lee el enunciado dos veces y programa una.', 317),
  ('Los casos ocultos también cuentan. Piensa en los bordes.', 318),
  ('Perder un duelo también suma: aprendes cómo lo resolvió tu rival.', 319),
  ('Nombres claros, funciones cortas, menos sustos.', 320),
  ('Si el código te da miedo, escribe un test.', 321),
  ('Hoy toca practicar: el ELO se gana entrenando.', 322);
