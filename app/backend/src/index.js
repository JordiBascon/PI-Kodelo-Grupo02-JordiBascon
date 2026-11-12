import http from 'node:http';
import { app } from './app.js';
import { config } from './config/env.js';
import { pool } from './db/pool.js';
import { iniciarSocketDuelos } from './sockets/duel-socket.js';

const servidor = http.createServer(app);
const wss = iniciarSocketDuelos(servidor);

servidor.listen(config.puerto, async () => {
  console.log(`API de KODELO en el puerto ${config.puerto} (${config.entorno})`);
  try {
    await pool.query('SELECT 1');
    console.log('Base de datos conectada');
  } catch (error) {
    console.error(`Sin conexión con la base de datos: ${error.code ?? error.message}`);
  }
});

function apagar() {
  wss.close();
  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', apagar);
process.on('SIGINT', apagar);
