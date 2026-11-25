import { expect, test } from '@playwright/test';
import { clicks, countSounds, goto, pick, plucks, watchErrors } from './fixtures/helpers';

test.describe('escalas', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('elige la escala, la guarda en la URL y la muestra en el diapasón', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/escalas');
    await expect(
      page.getByRole('navigation', { name: 'Herramientas' }).getByRole('link', { name: 'Escalas' }),
    ).toHaveAttribute('aria-current', 'page');

    // En la estándar arranca en Mi menor natural, como Armonía.
    const notes = page.getByRole('group', { name: 'Notas de la escala' });
    await expect(notes.getByRole('button')).toHaveCount(7);

    // Dos cambios seguidos: el segundo no pisa al primero.
    await pick(page, 'escala', 'blues');
    await page.getByRole('group', { name: 'Tónica' }).getByRole('button', { name: 'A', exact: true }).click();
    await expect(page).toHaveURL(/escala=blues/);
    await expect(page).toHaveURL(/tono=9/);
    await expect(notes.getByRole('button')).toHaveText([/^A1/, /^C♭3/, /^D4/, /^E♭♭5/, /^E5/, /^G♭7/]);

    // Tocar una nota de la tira o del diapasón la hace sonar.
    await notes.getByRole('button').first().click();
    await page
      .getByTestId('diapason')
      .getByRole('button', { name: /^Tocar la 6\.ª cuerda, traste 5/ })
      .click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(2);

    // Las posiciones: después de la última vuelve al mástil entero.
    const counter = page.getByTestId('position-counter');
    await expect(counter).toHaveText('Todo el mástil');
    await page.getByRole('button', { name: /Posición siguiente/ }).click();
    await expect(counter).toHaveText(/^Posición 1 de \d+$/);
    await page.getByRole('button', { name: /Posición anterior/ }).click();
    await page.getByRole('button', { name: /Posición anterior/ }).click();
    await expect(counter).toHaveText(/^Posición (\d+) de \1$/);

    // Todas las escalas están en Armonía: también el blues tiene el link a sus acordes.
    await expect(page.getByRole('link', { name: 'Sus acordes en Armonía' })).toHaveAttribute(
      'href',
      /escala=blues/,
    );
    expect(errors).toEqual([]);
  });

  test('suena la escala y el drone, y lleva a Armonía con la misma tonalidad', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/escalas?afinacion=dadgad&tono=2&escala=mixolidio');
    await expect(page.locator('#afinacion')).toHaveAttribute('data-value', 'dadgad');

    const before = await plucks(page);
    await page.getByRole('button', { name: '▶ Escuchar' }).click();
    await expect(page.getByRole('button', { name: '■ Parar' })).toBeVisible();
    await expect.poll(() => plucks(page)).toBeGreaterThan(before + 5);
    await page.getByRole('button', { name: '■ Parar' }).click();

    // El drone es un botón partido: el ▶ lo prende y lo demás abre el modal para elegir cómo suena.
    await page.getByRole('button', { name: 'Prender el drone en D' }).click();
    await expect(page.getByRole('button', { name: 'Apagar el drone en D' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect.poll(() => clicks(page)).toBeGreaterThan(0);

    await page.getByRole('button', { name: /Drone en D/ }).click();
    const sheet = page.getByTestId('drone');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: '■ Parar' })).toBeVisible();
    // El tritono trae una nota que no está en mixolidio, y lo avisa. El texto cambia, el modal no: ni de
    // alto ni con scroll.
    const size = () =>
      sheet.evaluate((dialog) => ({ height: dialog.clientHeight, scroll: dialog.scrollHeight }));
    const { height, scroll } = await size();
    expect(scroll).toBeLessThanOrEqual(height);
    await sheet.getByRole('button', { name: 'Tritono' }).click();
    await expect(sheet.getByTestId('drone-rule')).toContainText('no está en la escala');
    expect(await size()).toEqual({ height, scroll });
    const sounding = await clicks(page);
    await sheet.getByRole('button', { name: 'Crudo' }).click();
    await expect.poll(() => clicks(page)).toBeGreaterThan(sounding);
    await sheet.getByRole('button', { name: 'Cerrar' }).click();
    await expect(sheet).toBeHidden();
    await page.getByRole('button', { name: 'Apagar el drone en D' }).click();

    await page.getByRole('button', { name: '▶ Comparar' }).click();

    await page.getByRole('link', { name: 'Sus acordes en Armonía' }).click();
    await expect(page).toHaveURL(/\/armonia\?afinacion=dadgad&tono=2&escala=mixolidio$/);
    expect(errors).toEqual([]);
  });

  test('una vuelta de fondo: llega desde Armonía, suena y en el diapasón quedan fuertes las notas del acorde', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0&v=C_G_Am_F');
    await page.getByRole('button', { name: 'Abrir tu vuelta' }).click();
    await page.getByRole('link', { name: 'Tocar encima en Escalas' }).click();
    await expect(page).toHaveURL(/\/escalas\?.*v=C_G_Am_F.*fondo=vuelta/);

    // El botón del fondo dice la vuelta; el ▶ la toca.
    const fondo = page
      .getByRole('group', { name: 'Elegir la vuelta y cómo suena' })
      .getByRole('button')
      .last();
    await expect(fondo).toContainText('C · G · Am · F');
    const before = await plucks(page);
    await page.getByRole('button', { name: 'Tocar la vuelta' }).click();
    await expect(page.getByRole('button', { name: 'Parar la vuelta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect.poll(() => plucks(page)).toBeGreaterThan(before + 5);
    // Mientras suena C, en la fila de notas se apagan un poco las que no son de C: D, F, A y B.
    const notes = page.getByRole('group', { name: 'Notas de la escala' });
    await expect(notes.locator('button[data-quiet]')).toHaveCount(4);
    await expect(page.locator('[data-quiet]').first()).toBeVisible();

    // Escuchar la escala no corta la vuelta.
    await page.getByRole('button', { name: '▶ Escuchar' }).click();
    await expect(page.getByRole('button', { name: 'Parar la vuelta' })).toBeVisible();

    // En el modal: otra vuelta de las de siempre, y volver al drone.
    await fondo.click();
    const sheet = page.getByTestId('drone');
    await expect(
      sheet.getByRole('list', { name: 'Los acordes de la vuelta' }).getByRole('button'),
    ).toHaveCount(4);
    const size = await sheet.evaluate((dialog) => ({
      height: dialog.clientHeight,
      scroll: dialog.scrollHeight,
    }));
    expect(size.scroll).toBeLessThanOrEqual(size.height);
    await sheet.getByRole('button', { name: 'Fondo: Una vuelta' }).click();
    await expect(page).not.toHaveURL(/fondo=vuelta/);
    await expect(sheet.getByRole('button', { name: 'Fondo: Drone en C' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.getByRole('button', { name: 'Prender el drone en C' })).toBeVisible();
    const after = await plucks(page);
    await page.waitForTimeout(700);
    expect(await plucks(page)).toBeLessThanOrEqual(after + 6);
    expect(errors).toEqual([]);
  });

  test('sin vuelta, elegir Una vuelta arranca con una de las de siempre en la tónica', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/escalas?tono=9&escala=natural');
    await page.getByRole('button', { name: /Drone en A/ }).click();
    const sheet = page.getByTestId('drone');
    await sheet.getByRole('button', { name: 'Fondo: Drone en A' }).click();
    await expect(page).toHaveURL(/fondo=vuelta/);
    await expect(page).toHaveURL(/v=Am_/);
    await sheet.getByRole('region', { name: 'Otra vuelta' }).getByRole('button').nth(1).click();
    await expect(
      sheet.getByRole('region', { name: 'Otra vuelta' }).locator('[aria-pressed="true"]'),
    ).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('en el celular la afinación y la escala se pliegan en un renglón que las dice', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/escalas?afinacion=dadgad&escala=mixolidio');
    const fold = page.getByRole('button', { name: 'DADGAD · Mixolidio' });
    await expect(fold).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#afinacion')).toBeHidden();
    await expect(page.getByRole('button', { name: /Escuchar/ }).first()).toBeInViewport();
    await fold.click();
    await expect(page.locator('#afinacion')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sus acordes en Armonía' })).toBeVisible();
  });
});
