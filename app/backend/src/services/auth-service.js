import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { enTransaccion } from '../db/pool.js';
import * as usuarios from '../models/user-model.js';
import { HttpError } from '../utils/http-error.js';
import { validarLogin, validarRegistro } from '../utils/validacion.js';

const RONDAS_BCRYPT = 10;

function emitirSesion(usuario) {
  const token = jwt.sign({ sub: String(usuario.id), rol: usuario.rol }, config.jwt.secreto, {
    expiresIn: config.jwt.duracion,
  });
  return { token, usuario: { id: usuario.id, nick: usuario.nick, rol: usuario.rol } };
}

function fechaLegible(fechaSql) {
  const [dia, hora] = fechaSql.split(' ');
  const [anio, mes, numero] = dia.split('-');
  return `${numero}/${mes}/${anio} a las ${hora.slice(0, 5)}`;
}

export async function registrar(datos) {
  const { nick, email, password } = validarRegistro(datos);

  const duplicado = await usuarios.buscarDuplicado(nick, email);
  if (duplicado) {
    throw new HttpError(409, duplicado.nick === nick ? 'Ese nick ya está en uso' : 'Ya hay una cuenta con ese email');
  }

  const passwordHash = await bcrypt.hash(password, RONDAS_BCRYPT);

  try {
    const id = await enTransaccion(async (conexion) => {
      const nuevoId = await usuarios.crear(conexion, { nick, email, passwordHash });
      await usuarios.crearEloPorLenguaje(conexion, nuevoId);
      await usuarios.darAvatarInicial(conexion, nuevoId);
      return nuevoId;
    });
    return emitirSesion({ id, nick, rol: 'JUGADOR' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Ese nick o email ya está en uso');
    }
    throw error;
  }
}

export async function iniciarSesion(datos) {
  const { identificador, password } = validarLogin(datos);

  const usuario = await usuarios.buscarParaLogin(identificador);
  const passwordCorrecta = usuario && (await bcrypt.compare(password, usuario.password_hash));
  if (!passwordCorrecta) {
    throw new HttpError(401, 'Email, nick o contraseña incorrectos');
  }

  if (usuario.estado === 'BLOQUEADO') {
    const bloqueoTerminado = usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) <= new Date();
    if (!bloqueoTerminado) {
      const hasta = usuario.bloqueado_hasta ? ` hasta el ${fechaLegible(usuario.bloqueado_hasta)}` : '';
      throw new HttpError(403, `Tu cuenta está bloqueada${hasta}. Motivo: ${usuario.motivo_bloqueo}`);
    }
    await usuarios.desbloquear(usuario.id);
  }

  return emitirSesion(usuario);
}
