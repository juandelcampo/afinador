// El destello de elegir: lo que se toca pasa un instante por naranja y se apaga hasta su color de
// elegido. Ataque instantáneo y caída larga, como una cuerda pulsada: el naranja dice "sonó" y la tinta
// que queda dice "quedó elegido".

const FLASH_ID = 'destello';

/**
 * Un destello naranja que se apaga solo, sin volver a renderizar. Tiene un solo fotograma, el del
 * principio: el final lo pone el CSS, así termina en el color que corresponda (tinta si quedó elegido,
 * naranja si está afinado, papel si no). Hay que llamarlo antes de que React cambie el estado: si la
 * transición del CSS llega a arrancar, le gana a la animación y el naranja no se ve.
 */
export function flash(element: Element, pseudoElement?: string) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Las casillas del círculo de quintas son SVG: se pinta el relleno, no el fondo.
  if (element instanceof SVGElement) {
    element.querySelectorAll('path').forEach((path) => run(path, 'fill', 'accent'));
    element.querySelectorAll('text').forEach((text) => run(text, 'fill', 'on-accent'));
    return;
  }
  run(element, 'backgroundColor', 'accent', pseudoElement);
  run(element, 'color', 'on-accent', pseudoElement);
}

function run(element: Element, property: string, token: string, pseudoElement?: string) {
  // Dos toques seguidos no apilan destellos: el nuevo reemplaza al anterior.
  element.getAnimations().forEach((animation) => {
    if (animation.id === `${FLASH_ID}-${property}`) animation.cancel();
  });
  const value = getComputedStyle(element).getPropertyValue(`--${token}`);
  const animation = element.animate([{ offset: 0, [property]: value }], {
    duration: 520,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    pseudoElement,
  });
  animation.id = `${FLASH_ID}-${property}`;
}

/**
 * Lo que está por quedar elegido. Apagar algo (sacar una favorita, parar Repetir) no destella: el
 * naranja es para lo que se elige.
 */
const SELECTABLE = [
  'button[aria-pressed="false"]',
  '[role="button"][aria-pressed="false"]',
  '[role="tab"][aria-selected="false"]',
  // Las opciones del Picker y lo marcado a mano (Toggle, la barra, el listado de afinaciones).
  '[data-option]:not([aria-current])',
  '[data-select]:not([aria-current])',
].join(', ');

/**
 * Hace destellar todo lo que se elige en la app con un solo listener. Escucha en la fase de captura,
 * antes que React, para ver el estado de antes del toque y adelantarse a la transición del CSS.
 * Lo que maneja su destello por su cuenta lleva `data-flash="propio"`; lo que se elige en un
 * pseudoelemento (el punto del traste) lo nombra en `data-flash="::before"`.
 */
export function flashOnSelect() {
  const onClick = (event: MouseEvent) => {
    const target = (event.target as Element | null)?.closest(SELECTABLE);
    if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;
    const own = target.getAttribute('data-flash');
    if (own === 'propio') return;
    if (!own?.startsWith('::')) return flash(target);
    // El punto del traste recién existe cuando React lo marca, y una animación sobre un pseudoelemento
    // que todavía no está se pierde: va en el cuadro siguiente. El punto no tiene transición que le gane.
    requestAnimationFrame(() => flash(target, own));
  };
  window.addEventListener('click', onClick, true);
  return () => window.removeEventListener('click', onClick, true);
}
