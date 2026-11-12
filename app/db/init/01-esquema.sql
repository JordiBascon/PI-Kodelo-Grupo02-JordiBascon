SET NAMES utf8mb4;

CREATE TABLE usuario (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nick            VARCHAR(30)  NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  bio             VARCHAR(280) NULL,
  rol             ENUM('JUGADOR','MODERADOR','ADMIN') NOT NULL DEFAULT 'JUGADOR',
  estado          ENUM('ACTIVO','BLOQUEADO','SIN_VERIFICAR') NOT NULL DEFAULT 'ACTIVO',
  bloqueado_hasta DATETIME     NULL,
  motivo_bloqueo  VARCHAR(255) NULL,
  elo             INT UNSIGNED NOT NULL DEFAULT 1000,
  monedas         INT UNSIGNED NOT NULL DEFAULT 0,
  fecha_registro  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id),
  CONSTRAINT uk_usuario_nick UNIQUE (nick),
  CONSTRAINT uk_usuario_email UNIQUE (email),
  CONSTRAINT ck_usuario_bloqueo CHECK (estado <> 'BLOQUEADO' OR motivo_bloqueo IS NOT NULL),
  INDEX idx_usuario_elo (elo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lenguaje (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(20)      NOT NULL,
  CONSTRAINT pk_lenguaje PRIMARY KEY (id),
  CONSTRAINT uk_lenguaje_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuario_lenguaje (
  usuario_id  INT UNSIGNED     NOT NULL,
  lenguaje_id TINYINT UNSIGNED NOT NULL,
  elo         INT UNSIGNED     NOT NULL DEFAULT 1000,
  CONSTRAINT pk_usuario_lenguaje PRIMARY KEY (usuario_id, lenguaje_id),
  CONSTRAINT fk_ul_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario(id)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ul_lenguaje FOREIGN KEY (lenguaje_id) REFERENCES lenguaje(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_ul_ranking (lenguaje_id, elo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE problema (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  lenguaje_id       TINYINT UNSIGNED NOT NULL,
  titulo            VARCHAR(120)     NOT NULL,
  enunciado         TEXT             NOT NULL,
  dificultad        ENUM('FACIL','MEDIA','DIFICIL') NOT NULL,
  limite_tiempo_ms  INT UNSIGNED     NOT NULL DEFAULT 2000,
  limite_memoria_mb INT UNSIGNED     NOT NULL DEFAULT 256,
  activo            BOOLEAN          NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_problema PRIMARY KEY (id),
  CONSTRAINT uk_problema_titulo UNIQUE (lenguaje_id, titulo),
  CONSTRAINT fk_problema_lenguaje FOREIGN KEY (lenguaje_id) REFERENCES lenguaje(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_problema_limites CHECK (limite_tiempo_ms > 0 AND limite_memoria_mb > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_prueba (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  problema_id     INT UNSIGNED NOT NULL,
  entrada         TEXT         NOT NULL,
  salida_esperada TEXT         NOT NULL,
  oculto          BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_caso_prueba PRIMARY KEY (id),
  CONSTRAINT fk_caso_problema FOREIGN KEY (problema_id) REFERENCES problema(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE duelo (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  problema_id         INT UNSIGNED NOT NULL,
  jugador1_id         INT UNSIGNED NOT NULL,
  jugador2_id         INT UNSIGNED NOT NULL,
  ganador_id          INT UNSIGNED NULL,
  estado              ENUM('EN_CURSO','FINALIZADO','CANCELADO') NOT NULL DEFAULT 'EN_CURSO',
  elo_cambio_jugador1 SMALLINT     NULL,
  elo_cambio_jugador2 SMALLINT     NULL,
  codigo_sala         CHAR(6)      NULL,
  fecha_inicio        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_fin           DATETIME     NULL,
  CONSTRAINT pk_duelo PRIMARY KEY (id),
  CONSTRAINT uk_duelo_codigo_sala UNIQUE (codigo_sala),
  CONSTRAINT fk_duelo_problema FOREIGN KEY (problema_id) REFERENCES problema(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_duelo_jugador1 FOREIGN KEY (jugador1_id) REFERENCES usuario(id)  ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_duelo_jugador2 FOREIGN KEY (jugador2_id) REFERENCES usuario(id)  ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_duelo_ganador  FOREIGN KEY (ganador_id)  REFERENCES usuario(id)  ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_duelo_jugadores CHECK (jugador1_id <> jugador2_id),
  CONSTRAINT ck_duelo_ganador CHECK (ganador_id IS NULL OR ganador_id = jugador1_id OR ganador_id = jugador2_id),
  CONSTRAINT ck_duelo_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
  CONSTRAINT ck_duelo_finalizado CHECK (estado = 'EN_CURSO' OR fecha_fin IS NOT NULL),
  INDEX idx_duelo_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE entrega (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  duelo_id         INT UNSIGNED     NOT NULL,
  usuario_id       INT UNSIGNED     NOT NULL,
  codigo           MEDIUMTEXT       NOT NULL,
  tiempo_ms        INT UNSIGNED     NULL,
  memoria_kb       INT UNSIGNED     NULL,
  porcentaje_tests TINYINT UNSIGNED NOT NULL DEFAULT 0,
  fecha_envio      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_entrega PRIMARY KEY (id),
  CONSTRAINT fk_entrega_duelo   FOREIGN KEY (duelo_id)   REFERENCES duelo(id)   ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_entrega_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_entrega_porcentaje CHECK (porcentaje_tests <= 100),
  INDEX idx_entrega_duelo_usuario (duelo_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE item_tienda (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(60)  NOT NULL,
  tipo        ENUM('AVATAR','MARCO','TEMA_EDITOR','FONDO') NOT NULL,
  precio      INT UNSIGNED NOT NULL DEFAULT 0,
  imagen      VARCHAR(255) NULL,
  descripcion VARCHAR(255) NULL,
  rareza      ENUM('COMUN','RARO','EPICO','LEGENDARIO') NOT NULL DEFAULT 'COMUN',
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_item_tienda PRIMARY KEY (id),
  CONSTRAINT uk_item_tienda_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE inventario (
  usuario_id   INT UNSIGNED NOT NULL,
  item_id      INT UNSIGNED NOT NULL,
  equipado     BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha_compra DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_inventario PRIMARY KEY (usuario_id, item_id),
  CONSTRAINT fk_inventario_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_inventario_item    FOREIGN KEY (item_id)    REFERENCES item_tienda(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE practica_resuelta (
  usuario_id  INT UNSIGNED NOT NULL,
  problema_id INT UNSIGNED NOT NULL,
  fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_practica_resuelta PRIMARY KEY (usuario_id, problema_id),
  CONSTRAINT fk_practica_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario(id)  ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_practica_problema FOREIGN KEY (problema_id) REFERENCES problema(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auditoria_admin (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id INT UNSIGNED NOT NULL,
  accion   VARCHAR(255) NOT NULL,
  fecha    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_auditoria_admin PRIMARY KEY (id),
  CONSTRAINT fk_auditoria_admin FOREIGN KEY (admin_id) REFERENCES usuario(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX idx_auditoria_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE frase (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  texto        VARCHAR(280)      NOT NULL,
  dia_del_anio SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT pk_frase PRIMARY KEY (id),
  CONSTRAINT uk_frase_dia UNIQUE (dia_del_anio),
  CONSTRAINT ck_frase_dia CHECK (dia_del_anio BETWEEN 1 AND 366)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
