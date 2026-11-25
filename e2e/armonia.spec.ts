import { expect, test, type Page } from '@playwright/test';
import { clicks, countSounds, goto, pick, plucks, watchErrors } from './fixtures/helpers';

// En pantalla ancha los dos costados arrancan plegados: tu vuelta se abre desde su franja.
const openVuelta = (page: Page) => page.getByRole('button', { name: 'Abrir tu vuelta' }).click();

test.describe('armonía', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('se abre con la afinación de la URL y la tónica de sus cuerdas al aire', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?afinacion=dadgad');
    await expect(page.locator('#afinacion')).toHaveAttribute('data-value', 'dadgad');
    // DADGAD al aire es un Dsus4: la tónica es Re.
    await expect(page.locator('#tonica')).toHaveAttribute('data-value', '2');
    await expect(
      page.getByRole('navigation', { name: 'Herramientas' }).getByRole('link', { name: 'Armonía' }),
    ).toHaveAttribute('aria-current', 'page');
    await page.getByRole('link', { name: /Afinar en/ }).click();
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);
    expect(errors).toEqual([]);
  });

  test('los grados muestran su emoción, sin la figura, y suenan al tocarlos', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0');
    const degrees = page.getByTestId('degrees');
    await expect(degrees.getByRole('button', { name: 'Escuchar G7' })).toContainText('ALEGRE ++');
    await expect(degrees.getByRole('button', { name: 'Escuchar C' })).not.toContainText('× 3 2 0 1 0');
    await degrees.getByRole('button', { name: 'Escuchar C' }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(5);

    await pick(page, 'mundo', 'dorico');
    await expect(page).toHaveURL(/escala=dorico/);
    await expect(degrees.locator('text=★')).toHaveCount(2);
    await expect(degrees.locator('text=OJO')).toHaveCount(1);

    await pick(page, 'mundo', 'arabe');
    await expect(page).toHaveURL(/escala=arabe/);
    await expect(degrees.getByRole('button', { name: 'Escuchar Db' })).toBeVisible();
    await expect(degrees.locator('text=★')).toHaveCount(2);
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

  test('una vuelta para arrancar se escucha, se usa y se reordena', async ({ page }) => {
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
    // El C se lleva al final con la manija y las flechas del teclado.
    const grip = page.getByTestId('vuelta').getByRole('button', { name: 'Mover C' });
    for (const url of [/v=Am_C_F_G/, /v=Am_F_C_G/, /v=Am_F_G_C/]) {
      await grip.press('ArrowRight');
      await expect(page).toHaveURL(url);
    }

    // El editor cambia un acorde por otro de su misma función (acá, su relativo) y dice qué notas se apoyan al cantar.
    const vuelta = page.getByTestId('vuelta');
    await expect(vuelta.getByRole('listitem').last()).toContainText('C');
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

  test('el círculo de quintas suena, suma y muda el mundo', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0&v=Am_Dm_G_C');
    // En pantalla ancha la rueda ya está abierta, al lado de los acordes.
    const circle = page.getByTestId('circulo');
    await expect(circle).toBeVisible();
    // Cada casilla se escribe en su tono: el relativo de E es C#m, no D♭m.
    await expect(circle.getByRole('button', { name: 'Escuchar C#m' })).toBeVisible();
    await expect(page.getByTestId('circulo-vuelta')).toContainText('3 de 4');
    // El color gira con las quintas desde el naranja de la tónica: D está dos quintas para los sostenidos.
    await expect(circle.getByRole('button', { name: 'Escuchar C', exact: true })).toHaveAttribute(
      'data-state',
      'tonic',
    );
    await expect(circle.getByRole('button', { name: 'Escuchar D', exact: true })).toHaveAttribute(
      'data-hue',
      '78',
    );

    const before = await plucks(page);
    await circle.getByRole('button', { name: 'Escuchar D', exact: true }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThan(before);
    await expect(page.getByTestId('circulo-info')).toContainText('una nota de afuera');
    // En vez de contar notas de afuera, la rueda dice su armadura y debajo va su escala con los pasos.
    await expect(circle.getByText('2♯')).toBeVisible();
    await expect(page.getByTestId('circulo-armadura')).toHaveText('D mayor lleva F# C#');
    await circle.getByRole('button', { name: 'Sumar D a la vuelta' }).click();
    await expect(page).toHaveURL(/v=Am_Dm_G_C_D/);

    await circle.getByRole('button', { name: 'Escuchar Em' }).click();
    await page.getByRole('button', { name: 'Llevar el mundo a Em menor' }).click();
    await expect(page).toHaveURL(/tono=4/);
    await expect(page).toHaveURL(/escala=natural/);
    expect(errors).toEqual([]);
  });

  test('la tarjeta del grado es chica: el + suma la tríada y el color se elige en la vuelta', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0');
    const tonic = page.getByTestId('degrees').getByRole('listitem').first();
    await expect(tonic.getByRole('button', { name: /^Color de C/ })).toHaveCount(0);
    await expect(tonic.getByRole('button', { name: /^Otra figura de C/ })).toHaveCount(0);
    await tonic.getByRole('button', { name: 'Sumar C a la vuelta' }).click();
    await expect(page).toHaveURL(/v=C(&|$)/);
    expect(errors).toEqual([]);
  });

  test('el color y la figura se cambian desde la vuelta, sin abrir el editor', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0&v=C*2_G');
    await openVuelta(page);
    const vuelta = page.getByTestId('vuelta');
    const first = vuelta.getByRole('listitem').first();

    // Otra figura del mismo acorde: queda en la URL y se lee en la tarjeta.
    await first.getByRole('button', { name: /^Otra figura de C: va la 1/ }).click();
    await expect(page).toHaveURL(/v=C\*2\.1_G/);
    await expect(first).not.toContainText('×32010');
    await expect(first.getByRole('button', { name: /^Otra figura de C: va la 2/ })).toBeVisible();

    // Otro color: cambia el acorde, lo que dura queda y la figura vuelve a la más fácil.
    await pick(page, first.getByRole('button', { name: /^Color de C:/ }), '7');
    await expect(page).toHaveURL(/v=C7\*2_G/);
    await expect(first.locator('strong').first()).toHaveText('C7');
    await expect(page.getByTestId('chord-editor')).toBeHidden();

    // El editor también elige la figura.
    await first.getByRole('button').first().click();
    await page
      .getByTestId('chord-editor')
      .getByRole('group', { name: 'Con qué figura se toca' })
      .getByRole('button', { name: '2' })
      .click();
    await expect(page).toHaveURL(/v=C7\*2\.1_G/);
    expect(errors).toEqual([]);
  });

  test('cada acorde de la vuelta dice cómo se arma y dura lo suyo', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=mayor&tono=0&v=C_G');
    await openVuelta(page);
    const vuelta = page.getByTestId('vuelta');
    // La figura se lee en la vuelta, sin abrir nada.
    await expect(vuelta.getByRole('listitem').first()).toContainText('×32010');
    await expect(vuelta.getByRole('img', { name: '4 pulsos' })).toHaveCount(2);

    // En el editor, cuerda por cuerda, y la duración propia del acorde queda en la URL.
    await vuelta.getByRole('button', { name: /^I C/ }).click();
    const editor = page.getByTestId('chord-editor');
    await expect(page.getByTestId('chord-shape')).toContainText('Cómo se arma');
    await editor
      .getByRole('group', { name: 'Cuántos pulsos dura' })
      .getByRole('button', { name: '2' })
      .click();
    await expect(page).toHaveURL(/v=C\*2_G/);
    await expect(vuelta.getByRole('img', { name: '2 pulsos' })).toHaveCount(1);
    // Cambiar el acorde no le cambia lo que dura.
    await editor.getByRole('button', { name: 'Poner Cmaj7' }).click();
    await expect(page).toHaveURL(/v=Cmaj7\*2_G/);
    await page.keyboard.press('Escape');

    // Todos iguales de una, y en arpegio suena nota por nota.
    await page
      .getByRole('group', { name: 'Pulsos de todos los acordes' })
      .getByRole('button', { name: '8' })
      .click();
    await expect(page).toHaveURL(/v=Cmaj7\*8_G\*8/);
    await page.getByRole('button', { name: 'Arpegio' }).click();
    await page.locator('#vuelta-toggle').click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(3);
    await page.locator('#vuelta-toggle').click();
    expect(errors).toEqual([]);
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
  test('la vuelta suena con un ritmo de fondo: llega desde Ritmo, se cambia acá y manda su tempo', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo?m=meter&bpm=96&g=3%2B3&d=8');
    await page.getByRole('link', { name: 'Con una vuelta →' }).click();
    await expect(page).toHaveURL(/\/armonia\?.*ritmo=/);
    // Sin vuelta guardada, arranca con una de las de siempre, y la vuelta queda abierta.
    await expect(page.getByTestId('vuelta')).toBeVisible();
    const fondo = page.getByRole('button', { name: /^Ritmo de fondo:/ });
    await expect(fondo).toHaveText('6/8');
    await expect(page.getByText('Velocidad: 96 ppm')).toBeVisible();
    await expect(page.getByText('Pulsos por acorde · 2 por compás')).toBeVisible();

    const toggle = page.locator('#vuelta-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Parar la vuelta');
    const notes = await plucks(page);
    const hits = await clicks(page);
    await expect.poll(() => plucks(page)).toBeGreaterThan(notes + 6);
    await expect
      .poll(async () => (await plucks(page)) + (await clicks(page)))
      .toBeGreaterThan(notes + hits + 12);

    // Sacar el ritmo deja la vuelta sola, sonando; uno de los de siempre toma el tempo que había.
    await fondo.click();
    const sheet = page.getByTestId('ritmo-de-fondo');
    await sheet.getByRole('button', { name: 'Sin ritmo' }).click();
    await expect(page).not.toHaveURL(/ritmo=/);
    await expect(fondo).toHaveText('Sin ritmo');
    await expect(toggle).toHaveAttribute('aria-label', 'Parar la vuelta');
    await expect(page.getByText(/· \d por compás/)).toHaveCount(0);

    await fondo.click();
    await sheet.getByRole('button', { name: 'Rock' }).click();
    await expect(fondo).toHaveText('Rock');
    await expect(page).toHaveURL(/ritmo=m%3Ddrum%26bpm%3D95/);
    await expect(toggle).toHaveAttribute('aria-label', 'Parar la vuelta');

    // Al irse de la página, para todo.
    await page
      .getByRole('navigation', { name: 'Herramientas' })
      .getByRole('link', { name: 'Escalas' })
      .click();
    await expect(page).toHaveURL(/\/escalas/);
    // Lo que ya estaba programado (lo que entra en el próximo instante) puede llegar a sonar; después, nada.
    await page.waitForTimeout(300);
    const after = (await plucks(page)) + (await clicks(page));
    await page.waitForTimeout(800);
    expect((await plucks(page)) + (await clicks(page))).toBe(after);
    expect(errors).toEqual([]);
  });

  test('en menor la armonía es la de la natural: la armónica aporta el V7, y la pentatónica toma los de su escala', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?escala=armonica&tono=9');
    const degrees = page.getByTestId('degrees');
    await expect(degrees.getByRole('button', { name: 'Escuchar C', exact: true })).toBeVisible();
    await expect(degrees.getByRole('button', { name: 'Escuchar E7' })).toBeVisible();
    await expect(degrees.getByRole('button', { name: /Escuchar Caug/ })).toHaveCount(0);

    await goto(page, '/armonia?escala=pentaMayor&tono=0');
    await expect(page.getByTestId('armonia-prestada')).toContainText('los de la mayor');
    await expect(degrees.getByRole('listitem')).toHaveCount(7);
    await expect(degrees.getByRole('button', { name: 'Escuchar F', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
