const obligatorias = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

for (const nombre of obligatorias) {
  if (!process.env[nombre]) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
}

export const config = {
  puerto: Number(process.env.PORT ?? 3000),
  entorno: process.env.NODE_ENV ?? 'development',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secreto: process.env.JWT_SECRET,
    duracion: '8h',
  },
};
