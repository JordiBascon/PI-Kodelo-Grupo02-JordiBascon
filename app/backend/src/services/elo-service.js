export const ELO_INICIAL = 1000;
export const FACTOR_K = 32;

export function probabilidadDeGanar(eloPropio, eloRival) {
  return 1 / (1 + 10 ** ((eloRival - eloPropio) / 400));
}

export function calcularCambio(eloPropio, eloRival, resultado) {
  if (![0, 0.5, 1].includes(resultado)) {
    throw new RangeError('El resultado debe ser 1 (victoria), 0.5 (empate) o 0 (derrota)');
  }
  return Math.round(FACTOR_K * (resultado - probabilidadDeGanar(eloPropio, eloRival)));
}

export function nuevoElo(eloPropio, eloRival, resultado) {
  return Math.max(0, eloPropio + calcularCambio(eloPropio, eloRival, resultado));
}
