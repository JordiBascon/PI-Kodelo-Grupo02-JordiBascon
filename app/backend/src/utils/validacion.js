import { HttpError } from './http-error.js';

const PATRON_NICK = /^[A-Za-z0-9_]{3,30}$/;
const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarRegistro({ nick, email, password }) {
  if (typeof nick !== 'string' || !PATRON_NICK.test(nick)) {
    throw new HttpError(400, 'El nick debe tener entre 3 y 30 caracteres: letras, números o guion bajo');
  }
  if (typeof email !== 'string' || email.length > 255 || !PATRON_EMAIL.test(email)) {
    throw new HttpError(400, 'El email no tiene un formato válido');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw new HttpError(400, 'La contraseña debe tener entre 8 y 72 caracteres');
  }
  return { nick, email: email.trim().toLowerCase(), password };
}

export function validarLogin({ identificador, password }) {
  if (typeof identificador !== 'string' || !identificador.trim() || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'Escribe tu email o nick y tu contraseña');
  }
  return { identificador: identificador.trim(), password };
}

export function validarId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, 'Identificador no válido');
  }
  return id;
}
