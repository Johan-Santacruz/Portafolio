/**
 * Avisa cuando un elemento entra o sale de la pantalla (con el margen dado).
 *
 * Las secciones miden su posición en cada scroll; hacerlo también cuando
 * están lejos fuerza recálculos de estilo que no cambian nada visible y se
 * notan como tirones en las animaciones de la sección que sí está a la vista.
 * Con esto, cada sección solo mide mientras está cerca; al salir se mide una
 * última vez para dejar sus valores en el extremo.
 */
export function vigilarCercania(
  elemento: Element,
  alCambiar: (cerca: boolean) => void,
  margen = "0px",
) {
  const observador = new IntersectionObserver(
    ([entrada]) => alCambiar(entrada.isIntersecting),
    { rootMargin: margen },
  );
  observador.observe(elemento);
  return () => observador.disconnect();
}
