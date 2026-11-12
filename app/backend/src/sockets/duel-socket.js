import { WebSocketServer } from 'ws';
import { verificarToken } from '../middlewares/auth-middleware.js';

const INTERVALO_LATIDO_MS = 30_000;

function enviar(socket, tipo, datos = {}) {
  socket.send(JSON.stringify({ tipo, ...datos }));
}

export function iniciarSocketDuelos(servidor) {
  const wss = new WebSocketServer({ server: servidor, path: '/ws' });

  wss.on('connection', (socket, peticion) => {
    const token = new URL(peticion.url, 'http://localhost').searchParams.get('token');
    try {
      socket.usuario = verificarToken(token ?? '');
    } catch {
      socket.close(4401, 'Sesión no válida');
      return;
    }

    socket.vivo = true;
    socket.on('pong', () => {
      socket.vivo = true;
    });

    socket.on('message', (mensaje) => {
      let datos;
      try {
        datos = JSON.parse(mensaje.toString());
      } catch {
        enviar(socket, 'error', { mensaje: 'El mensaje no es un JSON válido' });
        return;
      }
      if (datos.tipo === 'ping') {
        enviar(socket, 'pong');
      } else {
        enviar(socket, 'error', { mensaje: `Tipo de mensaje desconocido: ${datos.tipo}` });
      }
    });

    enviar(socket, 'bienvenida', { usuarioId: socket.usuario.id });
  });

  const latido = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.vivo) {
        socket.terminate();
        continue;
      }
      socket.vivo = false;
      socket.ping();
    }
  }, INTERVALO_LATIDO_MS);

  wss.on('close', () => clearInterval(latido));
  return wss;
}
