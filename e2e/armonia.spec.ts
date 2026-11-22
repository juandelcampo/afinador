import { expect, test, type Page } from '@playwright/test';
import { countSounds, goto, plucks, watchErrors } from './fixtures/helpers';

// En pantalla ancha los dos costados arrancan plegados: tu vuelta se abre desde su franja.
const openVuelta = (page: Page) => page.getByRole('button', { name: 'Abrir tu vuelta' }).click();

test.describe('armonía', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('se abre con la afinación de la URL y la tónica de sus cuerdas al aire', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?afinacion=dadgad');
    await expect(page.locator('#afinacion')).toHaveValue('dadgad');
    // DADGAD al aire es un Dsus4: la tónica es Re.
    await expect(page.locator('#tonica')).toHaveValue('2');
    await expect(
      page.getByRole('navigation', { name: 'Herramientas' }).getByRole('link', { name: 'Armonía' }),
    ).toHaveAttribute('aria-current', 'page');
    await page.getByRole('link', { name: /Afinar en/ }).click();
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);
    expect(errors).toEqual([]);
  });

  test('los grados muestran su emoción y su figura, y suenan al tocarlos', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0');
    const degrees = page.getByTestId('degrees');
    await expect(degrees.getByRole('button', { name: 'Escuchar G7' })).toContainText('ALEGRE ++');
    await expect(degrees.getByRole('button', { name: 'Escuchar C' })).toContainText('× 3 2 0 1 0');
    await degrees.getByRole('button', { name: 'Escuchar C' }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(5);

    await page.getByRole('button', { name: 'Dórico' }).click();
    await expect(page).toHaveURL(/escala=dorico/);
    await expect(degrees.locator('text=★')).toHaveCount(2);
    await expect(degrees.locator('text=OJO')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('arma la vuelta, la edita, la toca y queda en la URL', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0');
    await openVuelta(page);
    await expect(page.getByTestId('vuelta-empty')).toBeVisible();
    const degrees = page.getByTestId('degrees');
    await degrees.getByRole('button', { name: 'Sumar C a la vuelta' }).click();
    await degrees.getByRole('button', { name: 'Sumar Am a la vuelta' }).click();
    await expect(page).toHaveURL(/v=C_Am/);

    // El Am elegido se edita en un modal: con séptima menor, y el bajo en la tercera.
    const vuelta = page.getByTestId('vuelta');
    await vuelta.getByRole('button', { name: /^VIm Am/ }).click();
    const editor = page.getByTestId('chord-editor');
    await editor.getByRole('button', { name: 'Poner Am7' }).click();
    await editor.getByRole('button', { name: 'Bajo', exact: true }).click();
    await editor.getByRole('button', { name: 'Poner Am7/C' }).click();
    await expect(vuelta).toContainText('Am7/C');
    await expect(page.getByTestId('common-tones')).toContainText('Con C comparte');
    await page.keyboard.press('Escape');
    await expect(editor).toBeHidden();

    // Cerrar con la plagal suma F y C, y el modal se cierra solo.
    await page.getByRole('button', { name: 'Cerrar con…' }).click();
    await page.getByTestId('cadences').getByRole('button', { name: 'Sumar F C a la vuelta' }).click();
    await expect(page.getByTestId('cadences')).toBeHidden();
    await expect(vuelta.getByRole('listitem')).toHaveCount(4);
    await expect(page).toHaveURL(/v=C_Am7%2FC_F_C|v=C_Am7\/C_F_C/);

    const before = await plucks(page);
    await page.locator('#vuelta-toggle').click();
    await expect(vuelta.locator('[data-playing]')).toHaveCount(1);
    await page.waitForTimeout(1500);
    await page.locator('#vuelta-toggle').click();
    expect(await plucks(page)).toBeGreaterThan(before + 10);

    // Recargar la deja igual: la vuelta vive en la URL.
    await page.reload();
    await openVuelta(page);
    await expect(page.getByTestId('vuelta').getByRole('listitem')).toHaveCount(4);
    expect(errors).toEqual([]);
  });

  test('los puntos cardinales suman acordes y avisan el paso por el mismo polo', async ({ page }) => {
    await goto(page, '/armonia');
    await openVuelta(page);
    // En pantalla ancha, más acordes arranca plegado a un costado.
    await page.getByRole('button', { name: 'Abrir más acordes' }).click();
    await page.getByTestId('sin-centro').locator('summary').click();
    await page.getByRole('region', { name: 'Grupo 2' }).getByRole('button', { name: 'Escuchar Cm' }).click();
    // Escuchar no suma: lo suma el +.
    await expect(page.getByTestId('vuelta-empty')).toBeVisible();
    await page.getByRole('button', { name: 'Sumar Cm a la vuelta' }).click();
    await expect(page.getByTestId('same-pole')).toContainText('polo N');
    await expect(page.getByTestId('same-pole')).toContainText('B o Db');
  });

  test('una vuelta para arrancar se escucha, se usa y se transforma', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0');
    await openVuelta(page);
    await page.getByRole('button', { name: 'Arrancar con una vuelta' }).click();
    const starter = page.getByTestId('vuelta-i-vi-iv-v');
    await expect(starter).toContainText('C · Am · F · G');
    await expect(starter).toContainText('Stand By Me');
    await starter.getByRole('button', { name: 'Escuchar C Am F G' }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(10);

    await starter.getByRole('button', { name: /^Usar/ }).click();
    await expect(page).toHaveURL(/v=C_Am_F_G/);
    await expect(page.getByTestId('starters')).toBeHidden();
    const transforms = page.getByRole('group', { name: 'Transformar la vuelta' });
    // El C se lleva al final con la manija y las flechas del teclado.
    const grip = page.getByTestId('vuelta').getByRole('button', { name: 'Mover C' });
    for (const url of [/v=Am_C_F_G/, /v=Am_F_C_G/, /v=Am_F_G_C/]) {
      await grip.press('ArrowRight');
      await expect(page).toHaveURL(url);
    }
    await transforms.getByRole('button', { name: /^Bajo que baja/ }).click();
    await expect(page.getByTestId('vuelta')).toContainText('F/A');

    // El editor cambia un acorde por otro de su misma función (acá, su relativo) y dice qué notas se apoyan al cantar.
    const vuelta = page.getByTestId('vuelta');
    await vuelta.getByRole('listitem').last().getByRole('button').first().click();
    const editor = page.getByTestId('chord-editor');
    await editor.getByRole('button', { name: 'Cantar', exact: true }).click();
    await expect(page.getByTestId('sing-over')).toContainText('Se apoyan');
    await editor.getByRole('button', { name: 'Cambiar', exact: true }).click();
    await expect(page.getByTestId('editor-moves')).toContainText('I → VI');
    await expect(page.getByTestId('same-function')).toContainText('IIIm');
    await editor.getByRole('button', { name: 'Poner Am' }).click();
    await expect(vuelta.getByRole('listitem').last()).toContainText('Am');
    // Las opciones quedan quietas: el que tenías sigue arriba y el elegido queda marcado.
    await expect(page.getByTestId('same-function').getByRole('listitem').first()).toContainText(
      'El que tenías',
    );
    await expect(editor.getByRole('button', { name: 'Am: es el que está' })).toBeDisabled();
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

    // De dos en dos, desde el último acorde, a la izquierda.
    const moves = page.getByTestId('moves');
    await page.getByRole('button', { name: 'Abrir más acordes' }).click();
    await moves.locator('summary').click();
    await expect(moves).toContainText('desde Am');
    await expect(moves.getByRole('button', { name: 'Sumar C a la vuelta' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('una vuelta en menor cambia el mundo a la menor natural', async ({ page }) => {
    await goto(page, '/armonia?escala=mayor&tono=9');
    await openVuelta(page);
    await page.getByRole('button', { name: 'Arrancar con una vuelta' }).click();
    const starter = page.getByTestId('vuelta-m-i-vii-vi-vmaj');
    await starter.locator('xpath=ancestor::details').locator('summary').click();
    await expect(starter).toContainText('Am · G · F · E');
    await starter.getByRole('button', { name: /^Usar/ }).click();
    await expect(page).toHaveURL(/escala=natural/);
    await expect(page).toHaveURL(/v=Am_G_F_E/);
  });

  test('la vuelta se reordena arrastrando, se saca con la ✕ y se agranda', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0&v=C_G_Am_F');
    await openVuelta(page);
    const vuelta = page.getByTestId('vuelta');

    // Arrastrar la manija del C hasta el lugar del Am.
    const grip = await vuelta.getByRole('button', { name: 'Mover C' }).boundingBox();
    const target = await vuelta.getByRole('listitem').nth(2).boundingBox();
    await page.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2);
    await page.mouse.down();
    await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(page).toHaveURL(/v=G_Am_C_F/);

    // Con el teclado también: la manija con flecha a la izquierda.
    await vuelta.getByRole('button', { name: 'Mover F' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/v=G_Am_F_C/);

    await vuelta.getByRole('button', { name: 'Sacar Am' }).click();
    await expect(page).toHaveURL(/v=G_F_C/);

    // Agrandada muestra la figura de cada acorde.
    await page.getByRole('button', { name: 'Agrandar la vuelta' }).click();
    await expect(vuelta).toContainText('3 2 0 0 0 3');
    expect(errors).toEqual([]);
  });

  test('los costados se pliegan y, sin lugar para los tres, abrir uno pliega el otro', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await goto(page, '/armonia?escala=mayor&tono=0&v=C_G');
    // Los dos arrancan plegados; la franja de la vuelta dice cuántos acordes tiene.
    await expect(page.getByTestId('sin-centro')).toBeHidden();
    await expect(page.getByTestId('vuelta')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Abrir tu vuelta' })).toContainText('Tu vuelta · 2');
    await page.getByRole('button', { name: 'Abrir más acordes' }).click();
    await expect(page.getByTestId('sin-centro')).toBeVisible();
    await expect(page.getByTestId('vuelta')).toBeHidden();
    await page.getByRole('button', { name: 'Abrir tu vuelta' }).click();
    await expect(page.getByTestId('vuelta')).toBeVisible();
    await expect(page.getByTestId('sin-centro')).toBeHidden();
    await page.getByRole('button', { name: 'Cerrar la columna de tu vuelta' }).click();
    await expect(page.getByTestId('vuelta')).toBeHidden();
  });

  test('cada propuesta se escucha antes de ponerla', async ({ page }) => {
    await goto(page, '/armonia?escala=mayor&tono=0&v=C_G');
    await openVuelta(page);
    await page.getByTestId('vuelta').getByRole('button', { name: /^V G/ }).click();
    const editor = page.getByTestId('chord-editor');
    const before = await plucks(page);
    // Tocar el recuadro suena; el + es lo que lo pone.
    await editor.getByRole('button', { name: /^\+7m G7/ }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThan(before);
    // Escuchar no cambia la vuelta.
    await expect(page).toHaveURL(/v=C_G$/);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Cerrar con…' }).click();
    await page
      .getByTestId('cadences')
      .getByRole('button', { name: /^Plagal/ })
      .click();
    await expect(page).toHaveURL(/v=C_G$/);
  });
});
