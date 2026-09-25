/**
 * El modo del celular: pantalla táctil y pequeña, en vertical o en
 * horizontal. Ahí la página quita lo decorativo que más pesa (el túnel, el
 * corte entre lo técnico y el criterio, la niebla de la trayectoria y la
 * secuencia del cierre) y aligera lo que se queda: el agujero negro, con sus
 * fotogramas pequeños y reproducido solo al soltar el dedo. Se ve igual de
 * bien y va fluido también en uno de gama media o baja.
 *
 * Una tableta no entra (a lo ancho o a lo alto pasa de 960 px): tiene
 * pantalla y fuerza para el recorrido completo. La misma consulta está en
 * el CSS (busca «modo celular»); si cambia aquí, cámbiala allí.
 */
export const CONSULTA_CELULAR =
  "(pointer: coarse) and (max-width: 960px) and (max-height: 960px)";

export const esCelular = () =>
  typeof window !== "undefined" && window.matchMedia(CONSULTA_CELULAR).matches;
