const CLAVE_SESION = 'kodelo.sesion';

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
  window.location.replace('/login');
}

export function exigirSesion() {
  const sesion = leerSesion();
  if (!sesion?.token) {
    window.location.replace('/login');
    return null;
  }
  return sesion;
}

export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export async function api(ruta, { metodo = 'GET', datos } = {}) {
  const cabeceras = {};
  const sesion = leerSesion();
  if (sesion?.token) {
    cabeceras.Authorization = `Bearer ${sesion.token}`;
  }
  if (datos !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: datos === undefined ? undefined : JSON.stringify(datos),
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Comprueba que KODELO está arrancado.');
  }

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (respuesta.status === 401 && sesion?.token) {
    cerrarSesion();
  }
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, cuerpo.error ?? 'Ha ocurrido un error inesperado');
  }
  return cuerpo;
}
