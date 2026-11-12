# KODELO

Plataforma web de duelos de programación 1v1 en tiempo real, con ranking ELO por lenguaje, tienda de cosméticos y la mascota KODY.

Proyecto intermodular de DAW · IES Isidro de Arcenegui y Carmona (Marchena) · Jordi Bascón Parrilla

## Puesta en marcha

En la Terminal de Linux Mint:

Descomprime el zip siempre desde `~/KODELO` (nunca desde dentro de `app`), para que se sobrescriba la misma carpeta y se conserve tu `.env`:

```bash
cd ~/KODELO && unzip -o ~/Descargas/KodeloR1.X.zip
cd kodelo/app
chmod +x kodelo.sh
./kodelo.sh instalar   # solo la primera vez; después, cerrar sesión y volver a entrar
./kodelo.sh dev        # web en http://localhost:8080
```

Usuarios de prueba (contraseña `kodelo123`): `usuario@prueba.com` (jugador), `admin@prueba.com` (administrador) y `moderador@prueba.com` (moderador).

Para abrir la web desde el ordenador anfitrión (fuera de la máquina virtual), añade en VirtualBox una regla de reenvío de puertos: Configuración → Red → Adaptador 1 (NAT) → Avanzadas → Reenvío de puertos → TCP, anfitrión `127.0.0.1:8080`, invitado `8080`.

Si al arrancar la API sale «unhealthy», `kodelo.sh` explica la causa. La más habitual es un `.env` nuevo que no coincide con la base de datos ya creada: se arregla con `./kodelo.sh reset-bd`.

## Estructura

```text
app/
├── docker-compose.yml       Los 3 contenedores en producción: web, api y db
├── docker-compose.dev.yml   Cambios para desarrollo: recarga automática y API en :3000
├── .env.example             Plantilla de configuración (kodelo.sh crea el .env)
├── kodelo.sh                Atajos: dev, prod, parar, logs, estado, bd, reset-bd
├── scripts/                 Instalación de Docker en Linux Mint
├── db/init/                 Esquema y datos de ejemplo de MySQL
├── backend/                 API REST + WebSockets (Node.js + Express + ws)
│   └── src/
│       ├── config/          Variables de entorno
│       ├── db/              Conexión a MySQL y transacciones
│       ├── routes/          Qué URL llama a qué controlador
│       ├── controllers/     Reciben la petición y responden
│       ├── services/        Lógica de negocio (registro, compras, ELO…)
│       ├── models/          Consultas SQL
│       ├── middlewares/     Sesión, roles y gestión de errores
│       ├── sockets/         WebSockets de los duelos
│       └── utils/           Validaciones y errores HTTP
└── frontend/                Nginx: sirve la web y hace de proxy a la API
    └── public/
```

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js 24, Express 5, ws |
| Base de datos | MySQL 8.4 |
| Despliegue | Docker Compose, Nginx 1.28 |

## API

| Método | Ruta | Sesión | Qué hace |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Estado de la API y de la base de datos |
| GET | `/api/lenguajes` | No | Los 7 lenguajes |
| GET | `/api/frase-del-dia` | No | Frase del día de KODY |
| POST | `/api/auth/registro` | No | Crea una cuenta y devuelve la sesión |
| POST | `/api/auth/login` | No | Inicia sesión con email o nick |
| GET | `/api/usuarios/yo` | Sí | Perfil, ELO por lenguaje y frase del día |
| GET | `/api/problemas/aleatorio?lenguaje=Python` | Sí | Un problema al azar, sin los casos ocultos |
| GET | `/api/problemas/:id` | Sí | Un problema concreto |
| GET | `/api/tienda` | Sí | Ítems a la venta y los que ya tiene el usuario |
| POST | `/api/tienda/:id/comprar` | Sí | Compra un ítem |
| POST | `/api/tienda/:id/equipar` | Sí | Equipa un ítem comprado |
| WS | `/ws?token=…` | Sí | Conexión en tiempo real de los duelos |

### Administración

Todas las rutas de `/api/admin` exigen sesión. El rol se comprueba en la base de datos en cada petición, no solo en el token, y cada cambio queda en `auditoria_admin`.

| Método | Ruta | Rol | Qué hace |
| --- | --- | --- | --- |
| GET | `/api/admin/cuentas?buscar=&rol=&estado=` | Admin, moderador | Cuentas con filtros y resumen |
| POST | `/api/admin/cuentas/:id/bloqueo` | Admin, moderador | Bloquea 24 h, 7 días, 30 días o para siempre, con motivo |
| DELETE | `/api/admin/cuentas/:id/bloqueo` | Admin, moderador | Levanta el bloqueo |
| PATCH | `/api/admin/cuentas/:id/rol` | Admin | Cambia el rol (siempre queda al menos un admin) |
| PUT | `/api/admin/cuentas/:id/monedas` | Admin | Fija el saldo, con motivo |
| DELETE | `/api/admin/cuentas/:id` | Admin | Elimina una cuenta sin historial (pide escribir el nick) |
| GET | `/api/admin/auditoria` | Admin, moderador | Últimas 50 acciones del equipo |
| GET · POST | `/api/admin/tienda` | Admin | Lista o crea productos |
| PUT · DELETE | `/api/admin/tienda/:id` | Admin | Edita o elimina un producto (no si alguien lo tiene) |
| PATCH | `/api/admin/tienda/:id/activo` | Admin | Pone a la venta o retira |
| GET · POST | `/api/admin/problemas` | Admin | Lista o crea problemas con sus casos de prueba |
| GET · PUT · DELETE | `/api/admin/problemas/:id` | Admin | Detalle, edición o borrado (no si ya se ha jugado) |
| PATCH | `/api/admin/problemas/:id/activo` | Admin | Activa o desactiva en la Arena |
| GET · POST | `/api/admin/frases` | Admin | Frases del día de KODY |
| PUT · DELETE | `/api/admin/frases/:id` | Admin | Edita o elimina una frase |

Un moderador solo puede bloquear y desbloquear cuentas de jugadores. Nadie puede actuar sobre su propia cuenta.
