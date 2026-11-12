import { api, guardarSesion, leerSesion } from './api.js';
import { iniciarBotonTema } from './tema.js';

if (leerSesion()?.token) {
  window.location.replace('/inicio');
}

const pestanas = {
  entrar: document.getElementById('pestana-entrar'),
  registro: document.getElementById('pestana-registro'),
};
const formularios = {
  entrar: document.getElementById('formulario-entrar'),
  registro: document.getElementById('formulario-registro'),
};

function mostrar(nombre) {
  for (const [clave, pestana] of Object.entries(pestanas)) {
    const activa = clave === nombre;
    pestana.setAttribute('aria-selected', String(activa));
    pestana.tabIndex = activa ? 0 : -1;
    formularios[clave].hidden = !activa;
  }
  document.title = nombre === 'entrar' ? 'Entrar · KODELO' : 'Crear cuenta · KODELO';
  history.replaceState(null, '', nombre === 'registro' ? '#registro' : location.pathname);
  formularios[nombre].querySelector('input').focus();
}

pestanas.entrar.addEventListener('click', () => mostrar('entrar'));
pestanas.registro.addEventListener('click', () => mostrar('registro'));

document.querySelector('[role="tablist"]').addEventListener('keydown', (evento) => {
  if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
    mostrar(pestanas.entrar.getAttribute('aria-selected') === 'true' ? 'registro' : 'entrar');
    document.querySelector('[role="tab"][aria-selected="true"]').focus();
  }
});

function mostrarError(formulario, mensaje, campo) {
  const aviso = formulario.querySelector('.aviso');
  aviso.textContent = mensaje;
  aviso.hidden = false;
  formulario.querySelectorAll('.campo__entrada').forEach((entrada) => {
    entrada.removeAttribute('aria-invalid');
  });
  if (campo) {
    campo.setAttribute('aria-invalid', 'true');
    campo.focus();
  }
}

function limpiarError(formulario) {
  formulario.querySelector('.aviso').hidden = true;
  formulario.querySelectorAll('.campo__entrada').forEach((entrada) => {
    entrada.removeAttribute('aria-invalid');
  });
}

function validarRegistro(formulario) {
  const { nick, email, password } = formulario.elements;
  if (!/^[A-Za-z0-9_]{3,30}$/.test(nick.value)) {
    return [nick, 'El nombre de usuario debe tener entre 3 y 30 caracteres: letras, números o guion bajo'];
  }
  if (!email.validity.valid || !email.value) {
    return [email, 'Escribe un correo electrónico válido'];
  }
  if (password.value.length < 8) {
    return [password, 'La contraseña debe tener al menos 8 caracteres'];
  }
  return null;
}

async function enviar(formulario, ruta, datos, textoEnviando) {
  const boton = formulario.querySelector('.formulario__enviar');
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = textoEnviando;
  try {
    const sesion = await api(ruta, { metodo: 'POST', datos });
    guardarSesion(sesion);
    window.location.replace('/inicio');
  } catch (error) {
    mostrarError(formulario, error.message);
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}

formularios.entrar.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const { identificador, password } = formulario.elements;
  if (!identificador.value.trim()) {
    return mostrarError(formulario, 'Escribe tu usuario o correo', identificador);
  }
  if (!password.value) {
    return mostrarError(formulario, 'Escribe tu contraseña', password);
  }
  limpiarError(formulario);
  enviar(formulario, '/auth/login', { identificador: identificador.value.trim(), password: password.value }, 'Entrando…');
});

formularios.registro.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const fallo = validarRegistro(formulario);
  if (fallo) {
    return mostrarError(formulario, fallo[1], fallo[0]);
  }
  limpiarError(formulario);
  const { nick, email, password } = formulario.elements;
  enviar(formulario, '/auth/registro', { nick: nick.value, email: email.value.trim(), password: password.value }, 'Creando cuenta…');
});

iniciarBotonTema(document.getElementById('boton-tema'));

if (location.hash === '#registro') {
  mostrar('registro');
}
