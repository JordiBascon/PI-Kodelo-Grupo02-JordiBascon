import * as catalogo from '../models/catalog-model.js';
import * as usuarios from '../models/user-model.js';
import { HttpError } from '../utils/http-error.js';

export function contarRacha(ultimosGanadores, usuarioId) {
  let racha = 0;
  for (const { ganadorId } of ultimosGanadores) {
    if (ganadorId !== usuarioId) {
      break;
    }
    racha += 1;
  }
  return racha;
}

export async function perfilPropio(usuarioId) {
  const perfil = await usuarios.buscarPerfil(usuarioId);
  if (!perfil) {
    throw new HttpError(404, 'El usuario no existe');
  }
  const [lenguajes, ultimos, frase] = await Promise.all([
    usuarios.estadisticasPorLenguaje(usuarioId),
    usuarios.ultimosGanadores(usuarioId),
    catalogo.fraseDelDia(),
  ]);
  return {
    ...perfil,
    racha: contarRacha(ultimos, usuarioId),
    eloSemana: lenguajes.reduce((total, l) => total + l.eloSemana, 0),
    lenguajes,
    fraseDelDia: frase,
  };
}
