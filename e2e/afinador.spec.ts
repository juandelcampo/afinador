import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { countSounds, goto, plucks, waitForApp, watchErrors } from './fixtures/helpers';

// En pantalla ancha el centro arranca en Afinar y las columnas de los costados, cerradas. Lo que se
// toca (acordes, mástil y patrones) está en la pestaña Acordes.
const tocar = (page: Page) => page.getByRole('tab', { name: 'Acordes' }).click();
const lista = (page: Page) => page.getByRole('button', { name: 'Abrir la lista de afinaciones' }).click();
const temas = (page: Page) =>
  page.getByRole('button', { name: 'Abrir los temas y las afinaciones cercanas' }).click();
const patron = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Patrón' }).getByRole('button', { name, exact: true });

test.describe('escuchador', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('toca arpegios, rasgueos y repeticiones, y se detiene', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    await page.locator('#play-toggle').click();
    await expect(page.locator('#play-toggle')).toHaveAttribute('aria-label', 'Tocar', { timeout: 6000 });
    expect(await plucks(page)).toBe(6);

    await page.getByRole('button', { name: 'Forma de tocar: Arpegio' }).click();
    await page.locator('#play-toggle').click();
    await expect(page.locator('#play-toggle')).toHaveAttribute('aria-label', 'Tocar', { timeout: 6000 });
    expect(await plucks(page)).toBe(12);

    await page.locator('#loop').click();
    await patron(page, 'Folk').click();
    await page.locator('#play-toggle').click();
    await page.waitForTimeout(3500);
    await expect(page.locator('#play-toggle')).toHaveAttribute('aria-label', 'Parar');
    await page.locator('#play-toggle').click();
    await page.waitForTimeout(300);
    const stopped = await plucks(page);
    expect(stopped).toBeGreaterThan(12 + 30);
    await page.waitForTimeout(800);
    expect(await plucks(page)).toBe(stopped);
    expect(errors).toEqual([]);
  });

  test('la tira del patrón muestra los pasos y enciende el que suena', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    const steps = page.locator('[data-step]');
    await expect(steps).toHaveCount(6);
    await expect(steps.first()).toHaveText(/6/);

    await page.getByRole('button', { name: 'Forma de tocar: Arpegio' }).click();
    await patron(page, 'Folk').click();
    await expect(steps).toHaveCount(8);
    await expect(steps.first()).toContainText('↓');

    await page.locator('#loop').click();
    await page.locator('#play-toggle').click();
    await expect(page.locator('[data-step][data-active]')).toHaveCount(1);
    await page.locator('#play-toggle').click();
    // Al parar no queda ningún paso encendido, ni se enciende uno tarde.
    await page.waitForTimeout(400);
    await expect(page.locator('[data-step][data-active]')).toHaveCount(0);
  });

  test('el rasgueo a mano cruza las seis cuerdas aunque el gesto sea rápido', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    const box = (await page.getByTestId('strum-zone').boundingBox())!;
    await page.getByTestId('strum-zone').scrollIntoViewIfNeeded();
    const zone = (await page.getByTestId('strum-zone').boundingBox()) ?? box;
    await page.mouse.move(zone.x + zone.width / 2, zone.y + 4);
    await page.mouse.down();
    await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height - 4, { steps: 2 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    expect(await plucks(page)).toBe(6);
  });

  test('pisar un traste y poner capo cambian las notas', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    const labels = page.locator('[data-label]');
    const fretted = page.locator('[data-fret="5:2"]');
    await expect(labels.nth(0)).toHaveText('D');
    // Pisada, la nota que suena va en el dedo; la cejuela sigue diciendo la cuerda al aire.
    await fretted.click();
    await expect(fretted).toHaveText('E');
    await expect(labels.nth(0)).toHaveText('D');
    await page.getByRole('button', { name: 'Subir capo' }).click();
    await expect(fretted).toHaveText('F');
    await expect(labels.nth(0)).toHaveText('D#');
    await expect(labels.nth(1)).toHaveText('A#');
  });

  test('un cambio de afinación reinicia trastes y capo', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    await page.getByRole('button', { name: 'Subir capo' }).click();
    await expect(page.getByTestId('capo-value')).toHaveText('Traste 1');
    await lista(page);
    await page.getByRole('button', { name: /^Drop/ }).click();
    await page.locator('[data-id="dropd"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drop D');
    await expect(page.getByTestId('capo-value')).toHaveText('Sin capo');
  });

  test('el patrón y el tempo elegidos quedan al cambiar de afinación y al recargar', async ({ page }) => {
    const tempo = page.getByRole('slider', { name: /Velocidad/ });
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    await page.getByRole('button', { name: 'Forma de tocar: Arpegio' }).click();
    await patron(page, 'Folk').click();
    await tempo.fill('120');
    await lista(page);
    await page.getByRole('button', { name: /^Drop/ }).click();
    await page.locator('[data-id="dropd"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drop D');
    await expect(page.getByRole('button', { name: 'Forma de tocar: Rasgueo' })).toBeVisible();
    await expect(patron(page, 'Folk')).toHaveAttribute('aria-pressed', 'true');
    await expect(tempo).toHaveValue('120');
    await page.reload();
    await waitForApp(page);
    await tocar(page);
    await expect(patron(page, 'Folk')).toHaveAttribute('aria-pressed', 'true');
    await expect(tempo).toHaveValue('120');
  });

  test('los acordes suenan con el patrón elegido', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    await page.getByRole('button', { name: 'Forma de tocar: Arpegio' }).click();
    await patron(page, 'Folk').click();
    await page.getByTestId('chord-shapes').getByRole('button').first().click();
    // Folk tiene seis rasguidos: con una sola bajada no se encendería la tira.
    await expect(page.locator('[data-step][data-active]')).toHaveCount(1);
    await expect.poll(() => plucks(page), { timeout: 6000 }).toBeGreaterThan(6 * 3);
    await expect(page.locator('[data-step][data-active]')).toHaveCount(0, { timeout: 6000 });
  });

  test('con capo los acordes se nombran por lo que suena', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await tocar(page);
    const first = page.getByTestId('chord-shapes').getByRole('button').first();
    await expect(first).toContainText('Dsus4');
    await expect(page.getByTestId('capo-note')).toHaveCount(0);
    await page.getByRole('button', { name: 'Subir capo' }).click();
    await page.getByRole('button', { name: 'Subir capo' }).click();
    await expect(first).toContainText('Esus4');
    await expect(page.getByTestId('capo-note')).toContainText('traste 2');
  });

  test('el capo de un tema se aplica y empieza a tocar', async ({ page }) => {
    await goto(page, '/afinador/dgddad');
    await temas(page);
    await page.getByRole('button', { name: /capo en el traste 3/ }).click();
    // Poner el capo de un tema lleva a Acordes.
    await expect(page.getByRole('tab', { name: 'Acordes' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('capo-value')).toHaveText('Traste 3');
    await page.waitForTimeout(400);
    expect(await plucks(page)).toBeGreaterThan(0);
  });
});

test.describe('afinación', () => {
  test('Al aire vuelve a hacer sonar las seis cuerdas de la afinación', async ({ page }) => {
    await countSounds(page);
    await goto(page, '/afinador/dadgad');
    await page.getByRole('button', { name: 'Escuchar la afinación al aire' }).click();
    await expect.poll(() => plucks(page), { timeout: 6000 }).toBe(6);
  });

  test('muestra los datos que se deducen de las notas', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await expect(page.getByTestId('fact-chord')).toHaveText('Dsus4');
    await expect(page.getByTestId('fact-intervals')).toHaveText('5J 4J 4J 2M 4J');
    await expect(page.getByTestId('fact-changes')).toHaveText(/^3 de 6/);
  });

  test('avisa si una cuerda corre riesgo', async ({ page }) => {
    await goto(page, '/afinador/dadgdfs');
    await expect(page.getByText(/Puede cortarse/)).toBeVisible();
    await goto(page, '/afinador/dadgad');
    await expect(page.getByText(/Puede cortarse/)).toHaveCount(0);
  });

  test('al abrir el afinador aparece la afinación estándar', async ({ page }) => {
    await goto(page, '/afinador');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Estándar');
  });

  test('la búsqueda encuentra por tema y por notas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto(page, '/afinador');
    await lista(page);
    await page.getByPlaceholder('BUSCAR').fill('kool thing');
    await expect(page.locator('[data-id]')).toHaveCount(1);
    await expect(page.locator('[data-id="fsharp"]')).toBeVisible();
    await expect(page.getByTestId('search-count')).toHaveText('1 afinación');
    await page.getByPlaceholder('BUSCAR').fill('zzzz');
    await expect(page.getByText('No hay afinaciones con esa búsqueda.')).toBeVisible();
    // Escape borra; con notas en solfeo y Enter se abre el primer resultado.
    await page.getByPlaceholder('BUSCAR').press('Escape');
    await expect(page.getByPlaceholder('BUSCAR')).toHaveValue('');
    await page.getByPlaceholder('BUSCAR').fill('re la re sol la re');
    await page.getByPlaceholder('BUSCAR').press('Enter');
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('DADGAD');
  });

  test('las secciones de la lista arrancan cerradas y se abren al tocarlas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto(page, '/afinador/dadgad');
    await lista(page);
    // Todas arrancan cerradas, Favoritas también.
    await expect(page.locator('[data-id="dadgad"]')).toBeHidden();
    const modales = page.getByRole('button', { name: /^Modales y suspendidas/ });
    await expect(modales).toHaveAttribute('aria-expanded', 'false');
    // La sección de la afinación abierta se reconoce aunque esté cerrada.
    await expect(modales).toHaveAttribute('data-current', 'true');
    await modales.click();
    await expect(page.locator('[data-id="dadgad"]')).toBeVisible();
    await modales.click();
    await expect(page.locator('[data-id="dadgad"]')).toBeHidden();
  });

  test('las favoritas se marcan en la lista, se ven en el encabezado y quedan al recargar', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto(page, '/afinador/dadgad');
    const mark = page.getByTestId('favorite-mark');
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await lista(page);
    await expect(page.getByRole('button', { name: /^Favoritas/ })).toHaveCount(0);
    await page.getByRole('button', { name: /^Modales y suspendidas/ }).click();
    const star = page.locator('#grupo-modales').getByRole('button', { name: 'Favorita: DADGAD' });
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    // Favoritas aparece arriba, cerrada como las demás.
    await page.getByRole('button', { name: /^Favoritas/ }).click();
    await expect(page.locator('[data-favorite-id="dadgad"]')).toBeVisible();

    await page.reload();
    await waitForApp(page);
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    // La estrella de la ficha también la saca: Favoritas desaparece de la lista.
    await mark.click();
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await lista(page);
    await expect(page.getByRole('button', { name: /^Favoritas/ })).toHaveCount(0);
    await expect(page.locator('[data-favorite-id]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('el solfeo cambia los nombres en toda la app', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto(page, '/afinador/dadgad');
    // Hasta 1680 px los ajustes se abren desde el botón de la barra.
    await page.getByRole('button', { name: /^Ajustes/ }).click();
    await page.getByRole('button', { name: 'Nombres de las notas: E A D' }).click();
    await expect(page.getByTestId('fact-chord')).toHaveText('Resus4');
    await tocar(page);
    await expect(page.getByTestId('chord-shapes').getByRole('button').first()).toContainText('Resus4');
    await expect(page.locator('[data-label]').first()).toHaveText('Re');
  });
});

test.describe('videos', () => {
  test('nada de YouTube hasta abrir, y uno a la vez', async ({ page }) => {
    const requests: string[] = [];
    await page.route(/youtube/, (route) => {
      requests.push(route.request().url());
      return route.abort();
    });
    // Sin movimiento, abrir un video desplaza la página al instante: con el scroll suave, el clic al
    // segundo video podía caer mientras la página todavía se movía.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await goto(page, '/afinador/cgcfce');
    await temas(page);
    await page.waitForTimeout(200);
    expect(requests).toEqual([]);
    await expect(page.locator('iframe')).toHaveCount(0);

    await page.getByRole('button', { name: /Escuchar Which Will/ }).click();
    await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/AZsxbWHlXyY/);
    await page.getByRole('button', { name: /Escuchar Hazey Jane II/ }).click();
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveAttribute('src', /lCaDp1gb6D4/);
    // Abierto, el botón dice "Cerrar" y su nombre accesible también.
    await page
      .getByRole('button', { name: /Cerrar Hazey Jane II/ })
      .first()
      .click();
    await expect(page.locator('iframe')).toHaveCount(0);
  });
});

test.describe('páginas para buscadores', () => {
  test('cada afinación tiene su HTML sin ejecutar JavaScript', async ({ request }) => {
    const response = await request.get('/afinador/dadgad');
    const html = await response.text();
    expect(response.ok()).toBe(true);
    expect(html).toContain('<title>DADGAD: afinación de guitarra');
    expect(html).toContain('Re suspendido');
    expect(html).toContain('Dsus4');
  });
});

test.describe('celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('una tarea por pantalla: las pestañas de abajo cambian lo que se ve', async ({ page }) => {
    const errors = watchErrors(page);
    await countSounds(page);
    await goto(page, '/afinador/dadgad');
    const secciones = page.getByRole('navigation', { name: 'Secciones del afinador' });
    await expect(page.locator('#mic-toggle')).toBeVisible();
    await expect(page.getByTestId('strum-zone')).toBeHidden();
    // Los datos de la afinación se abren con ⓘ.
    await expect(page.getByTestId('fact-chord')).toBeHidden();
    await page.getByRole('button', { name: 'Cómo es DADGAD' }).click();
    await expect(page.getByTestId('fact-chord')).toHaveText('Dsus4');

    await secciones.getByRole('button', { name: 'Acordes' }).click();
    await expect(page.getByTestId('strum-zone')).toBeVisible();
    await expect(page.locator('#mic-toggle')).toBeHidden();
    // Entran nueve acordes; el resto está en Figuras.
    await page.getByRole('button', { name: /^Ver los otros \d+ acordes$/ }).click();
    await expect(secciones.getByRole('button', { name: 'Figuras' })).toHaveAttribute('aria-pressed', 'true');
    await page
      .getByRole('group', { name: 'Filtrar acordes' })
      .getByRole('button', { name: 'Menores' })
      .click();
    await page.getByRole('button', { name: /^Em:/ }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThan(0);

    await secciones.getByRole('button', { name: 'Temas' }).click();
    await expect(page.getByRole('button', { name: /Escuchar Kashmir/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Re abierta/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('la lista se abre desde la ficha, y elegir la cierra', async ({ page }) => {
    await goto(page, '/afinador/dadgad');
    await page.getByRole('button', { name: /^Elegir entre \d+ afinaciones/ }).click();
    await expect(page.getByPlaceholder('BUSCAR')).toBeVisible();
    await page.getByRole('button', { name: /^Drop/ }).click();
    await page.locator('[data-id="dropd"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drop D');
    await expect(page.getByPlaceholder('BUSCAR')).toBeHidden();
  });
});
