import { expect, test } from '@playwright/test';
import { clicks, countSounds, goto, watchErrors } from './fixtures/helpers';

test.describe('ritmo', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('suena al tocar, marca el tempo con el mouse y para al irse de la página', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo');
    const tools = page.getByRole('navigation', { name: 'Herramientas' });
    await expect(tools.getByRole('link', { name: 'Ritmo' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('4/4');

    await page.locator('#metro-toggle').click();
    await expect(page.locator('#metro-toggle')).toHaveText('■ Parar');
    await expect.poll(() => clicks(page)).toBeGreaterThan(2);

    // Cuatro golpes cada 400 ms: unos 150 por minuto. Se dan desde la página, con el reloj de la página,
    // para que la demora de cada clic de la prueba no cambie el tempo.
    const tap = page.locator('#tap-tempo');
    await tap.evaluate(
      (button) =>
        new Promise<void>((resolve) => {
          const hit = () =>
            button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
          hit();
          let left = 3;
          const id = setInterval(() => {
            hit();
            if (--left === 0) {
              clearInterval(id);
              resolve();
            }
          }, 400);
        }),
    );
    await expect(tap).toContainText('4 golpes');
    const bpm = Number(await page.getByTestId('bpm').textContent());
    expect(bpm).toBeGreaterThan(120);
    expect(bpm).toBeLessThan(175);
    await expect(page).toHaveURL(new RegExp(`bpm=${bpm}`));

    await page.getByRole('button', { name: 'Tempo a la mitad' }).click();
    await expect(page.getByTestId('bpm')).toHaveText(String(Math.round(bpm / 2)));

    // Al pasar a otra herramienta, el ritmo deja de sonar.
    await tools.getByRole('link', { name: 'Armonía' }).click();
    await expect(page).toHaveURL(/\/armonia/);
    await expect(page.locator('#metro-toggle')).toHaveCount(0);
    const after = await clicks(page);
    await page.waitForTimeout(700);
    expect(await clicks(page)).toBe(after);
    expect(errors).toEqual([]);
  });

  test('el euclidiano se dibuja como una figura que gira', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo');
    await page
      .getByRole('group', { name: 'Tipo de ritmo' })
      .getByRole('button', { name: 'Euclidiano' })
      .click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('E(3,8)');
    const wheel = page.getByTestId('wheel');
    await expect(wheel).toHaveAttribute('aria-label', 'Figura del ritmo: 3 golpes en 8');
    await expect(wheel.locator('polygon')).toHaveAttribute('points', /^0,-46 /);

    await page.getByRole('button', { name: 'Cinquillo' }).click();
    await expect(page).toHaveURL(/k=5&n=8/);
    await expect(wheel).toHaveAttribute('aria-label', 'Figura del ritmo: 5 golpes en 8');

    // Girar la figura cambia dónde arranca, no cuántos golpes tiene.
    const before = await wheel.locator('polygon').getAttribute('points');
    await page.getByRole('button', { name: 'Subir rotación' }).click();
    await expect(page).toHaveURL(/r=1/);
    await expect(wheel.locator('polygon')).not.toHaveAttribute('points', before!);

    await page.locator('#metro-toggle').click();
    await expect(wheel.locator('[data-active]')).toHaveCount(1);
    // El lápiz pinta el lado que suena mientras avanza: su punta se mueve.
    const traveler = wheel.locator('[data-traveler="0"]');
    await expect(traveler).toHaveAttribute('data-running', '');
    const first = await traveler.getAttribute('x2');
    await expect.poll(() => traveler.getAttribute('x2')).not.toBe(first);
    // Sin puntos ni cuadrados: las esquinas y los silencios son líneas.
    await expect(wheel.locator('circle, rect')).toHaveCount(0);

    // La polirritmia muestra las dos figuras: la de más golpes afuera y la otra adentro, más chica.
    await page
      .getByRole('group', { name: 'Tipo de ritmo' })
      .getByRole('button', { name: 'Polirritmia' })
      .click();
    await page.getByRole('button', { name: '4 contra 3' }).click();
    await expect(wheel.locator('polygon')).toHaveCount(2);
    await expect(wheel.locator('polygon[data-lane="0"]')).toHaveAttribute('points', /^0,-46 /);
    await expect(wheel.locator('polygon[data-lane="1"]')).toHaveAttribute('points', /^0,-2\d[.\d]* /);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('4 contra 3');
    expect(errors).toEqual([]);
  });

  test('el ritmo se puede ver como estrella, y el 4/4 es un cuadrado', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo');
    const wheel = page.getByTestId('wheel');
    // El compás también es una figura: cuatro golpes, un cuadrado.
    await expect(wheel).toHaveAttribute('aria-label', 'Figura del ritmo: 4 golpes en 4');
    await expect(wheel.locator('polygon')).toHaveCount(1);
    await expect(wheel.locator('text')).toHaveText('4');

    await page.getByRole('button', { name: 'Figura del ritmo: Polígono' }).click();
    await expect(page.getByText('Con menos de cinco golpes queda el polígono')).toBeVisible();

    // Cinco golpes: solo el pentagrama, sin el pentágono alrededor.
    await page
      .getByRole('group', { name: 'Tipo de ritmo' })
      .getByRole('button', { name: 'Euclidiano' })
      .click();
    await page.getByRole('button', { name: 'Cinquillo' }).click();
    await expect(wheel).toHaveAttribute('data-figure', 'estrella');
    await expect(wheel.locator('polygon')).toHaveCount(1);
    await expect(wheel.locator('text')).toHaveText('5');

    // La figura elegida se recuerda.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Figura del ritmo: Estrella' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('el mutante cambia de figura cuando cambia el compás, y dice cuál viene', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo');
    await page.getByRole('group', { name: 'Tipo de ritmo' }).getByRole('button', { name: 'Mutante' }).click();
    const wheel = page.getByTestId('wheel');
    const rotation = page.getByTestId('rotation');
    // Quieto se ve el primero de la rotación: 4/4, cuatro golpes.
    await expect(wheel.locator('text')).toHaveText('4');
    await expect(rotation).toContainText('Tocá y la figura va cambiando');

    // Al doble de tempo, dos compases de 4/4 duran 2,4 segundos.
    await page.getByRole('button', { name: 'Tempo al doble' }).click();
    await page.locator('#metro-toggle').click();
    await expect(rotation).toContainText('después, 7/8 2+2+3');
    await expect(rotation.locator('li[data-now]')).toHaveText('4/4');
    await expect(wheel.locator('text')).toHaveText('7', { timeout: 6000 });
    await expect(rotation.locator('li[data-now]')).toHaveText('7/8 2+2+3');
    await expect(rotation).toContainText('después, 4/4');
    expect(errors).toEqual([]);
  });

  test('la caja de ritmos: partida, pintar, borrar con el derecho, mute, solo, pasos, swing, deshacer y rehacer', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo');
    await page.getByRole('group', { name: 'Tipo de ritmo' }).getByRole('button', { name: 'Batería' }).click();
    const machine = page.getByTestId('drum-machine');
    await expect(machine.getByRole('button', { name: 'Rock' })).toHaveAttribute('aria-pressed', 'true');

    await machine.getByRole('button', { name: 'Funk' }).click();
    await expect(page).toHaveURL(/bpm=98/);
    await expect(page).toHaveURL(/p=2001001000100000_/);

    // Pintar arrastrando: tres casillas de tom de un solo gesto.
    const tom = (step: number) => machine.getByRole('button', { name: `Tom, paso ${step}`, exact: true });
    await tom(1).scrollIntoViewIfNeeded();
    const a = await tom(1).boundingBox();
    const b = await tom(3).boundingBox();
    await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
    await page.mouse.down();
    await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, { steps: 6 });
    await page.mouse.up();
    for (const step of [1, 2, 3]) await expect(tom(step)).toHaveAttribute('data-level', '1');
    await expect(machine.getByRole('button', { name: 'Funk' })).toHaveAttribute('aria-pressed', 'false');

    // Con el mouse, otro clic izquierdo pasa el golpe a acento y de vuelta; el derecho borra.
    await tom(1).click();
    await expect(tom(1)).toHaveAttribute('data-level', '2');
    await tom(1).click();
    await expect(tom(1)).toHaveAttribute('data-level', '1');
    await tom(2).click({ button: 'right' });
    await expect(tom(2)).toHaveAttribute('data-level', '0');

    // Deshacer vuelve atrás de a un cambio (el gesto de arrastrar es uno solo), y rehacer lo devuelve.
    await page.locator('#undo-drums').click();
    await expect(tom(2)).toHaveAttribute('data-level', '1');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');
    for (const step of [1, 2, 3]) await expect(tom(step)).toHaveAttribute('data-level', '0');
    await expect(machine.getByRole('button', { name: 'Funk' })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#redo-drums').click();
    await expect(tom(3)).toHaveAttribute('data-level', '1');
    await page.keyboard.press('Control+Shift+z');
    await expect(tom(1)).toHaveAttribute('data-level', '2');

    // Mute calla una fila; con alguna en solo, las demás quedan apagadas.
    await machine.getByRole('button', { name: 'Mute de bombo' }).click();
    await expect(machine.getByRole('button', { name: 'Mute de bombo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(machine.locator('[data-track="bombo"]')).toHaveAttribute('data-silent', 'true');
    await machine.getByRole('button', { name: 'Solo de caja' }).click();
    await expect(machine.locator('[data-track="caja"]')).toHaveAttribute('data-silent', 'false');
    await expect(machine.locator('[data-track="hihat"]')).toHaveAttribute('data-silent', 'true');

    await machine.getByRole('slider', { name: /Swing/ }).fill('66');
    await expect(page.getByTestId('swing')).toHaveText('66');
    await expect(page).toHaveURL(/sw=66/);

    // Los pasos van de a uno: con 15 no hay swing.
    await machine.getByRole('button', { name: 'Bajar pasos' }).click();
    await expect(page).toHaveURL(/n=15/);
    await expect(page.getByTestId('swing')).toHaveText('no va');
    await expect(machine.getByRole('button', { name: 'Tom, paso 16', exact: true })).toHaveCount(0);

    await machine.getByRole('button', { name: 'Borrar todos los golpes' }).click();
    await expect(machine.locator('[aria-pressed="true"][data-step]')).toHaveCount(0);
    await page.locator('#undo-drums').click();
    await expect(tom(1)).toHaveAttribute('data-level', '2');

    await page.locator('#metro-toggle').click();
    await expect(machine.locator('[data-now]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('la batería se elige entre la acústica, la 808 y la sintética, y las grabadas bajan', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const samples: number[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/sonidos/bateria/')) samples.push(response.status());
    });
    await goto(
      page,
      '/ritmo?m=drum&bpm=100&n=4&p=2000_0010_0000_1111_0000_0000_0000_1010&l=80_80_80_80_80_80_80_80',
    );
    const machine = page.getByTestId('drum-machine');
    const kit = machine.getByRole('group', { name: 'Batería' });
    await expect(kit.getByRole('button', { name: 'Acústica' })).toHaveAttribute('aria-pressed', 'true');
    // La última fila es la pandereta en la acústica y el cencerro en la 808.
    await expect(machine.getByRole('button', { name: 'Pandereta, paso 1', exact: true })).toBeVisible();
    await expect.poll(() => samples.length).toBeGreaterThan(20);

    await kit.getByRole('button', { name: '808' }).click();
    await expect(page).toHaveURL(/kit=808/);
    await expect(machine.getByRole('button', { name: 'Cencerro, paso 1', exact: true })).toBeVisible();
    await page.locator('#metro-toggle').click();
    await expect(machine.locator('[data-now]').first()).toBeVisible();
    await page.locator('#metro-toggle').click();

    await kit.getByRole('button', { name: 'Acústica' }).click();
    await expect(page).not.toHaveURL(/kit=/);
    expect(samples.every((status) => status === 200)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('un link abre el ritmo que trae, y cualquier ritmo pasa a la batería', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo?m=meter&bpm=150&g=2%2B2%2B3&d=8');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('7/8 (2+2+3)');
    await expect(page.getByTestId('bpm')).toHaveText('150');
    await expect(page.getByRole('button', { name: '7/8 2+2+3' })).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#to-drums').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Batería en 14 pasos');
    await expect(page.getByRole('button', { name: 'Bombo, paso 1', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(errors).toEqual([]);
  });

  test('el sonido y los instrumentos se eligen con botones, y las casillas muestran dónde coinciden', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo');
    // El metrónomo suena con la batería: aro en el golpe y bombo en el acento, hasta que se elige otro.
    const golpe = page.getByTestId('metro-voice-0');
    const acento = page.getByTestId('metro-voice-1');
    await expect(golpe).toHaveValue('aro');
    await expect(acento).toHaveValue('bombo');
    await golpe.selectOption('hihat');
    await expect(page).toHaveURL(/v=hihat_bombo/);
    await page.getByRole('group', { name: 'Batería' }).getByRole('button', { name: '808' }).click();
    await expect(page).toHaveURL(/kit=808/);
    // Con la 808, la percusión es un cencerro.
    await expect(acento.locator('option[value="percu"]')).toHaveText('Cencerro');

    // El golpe, el acento y la batería pasan al euclidiano.
    await page
      .getByRole('group', { name: 'Tipo de ritmo' })
      .getByRole('button', { name: 'Euclidiano' })
      .click();
    await expect(page).toHaveURL(/v=hihat_bombo/);
    await expect(page).toHaveURL(/kit=808/);
    await expect(golpe).toHaveValue('hihat');

    // 3 contra 2 sobre una misma grilla de 6: las dos líneas solo coinciden en la primera.
    await page
      .getByRole('group', { name: 'Tipo de ritmo' })
      .getByRole('button', { name: 'Polirritmia' })
      .click();
    const rows = page.getByTestId('strip').locator('> div');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('span')).toHaveCount(6);
    await expect(rows.nth(0).locator('span[data-level]')).toHaveCount(3);
    await expect(rows.nth(1).locator('span[data-level]')).toHaveCount(2);
    // La polirritmia toma la batería, pero cada línea tiene su instrumento.
    await expect(page).toHaveURL(/kit=808/);
    const voice = page.getByTestId('poly-voice-1');
    await voice.selectOption('tom');
    await expect(voice).toHaveValue('tom');
    await expect(page).toHaveURL(/v=hihat_tom/);
    expect(errors).toEqual([]);
  });
});
