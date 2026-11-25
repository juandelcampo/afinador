import { expect, test } from '@playwright/test';
import { countSounds, goto, pick, plucks, watchErrors } from './fixtures/helpers';

test.describe('inversiones', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('elige el acorde, lo guarda en la URL y recorre sus formas en el diapasón', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones');
    await expect(
      page.getByRole('navigation', { name: 'Herramientas' }).getByRole('link', { name: 'Inversiones' }),
    ).toHaveAttribute('aria-current', 'page');

    // Dos cambios seguidos: el segundo no pisa al primero.
    await page
      .getByRole('group', { name: 'Nota del acorde' })
      .getByRole('button', { name: 'C', exact: true })
      .click();
    await pick(page, 'tipo', '');
    await expect(page).toHaveURL(/acorde=C(&|$)/);

    const bass = page.getByRole('group', { name: 'Qué va en el bajo' });
    await expect(bass.getByRole('button')).toHaveText([
      /^CFundamental/,
      /^C\/E1\.ª inversión/,
      /^C\/G2\.ª inversión/,
    ]);
    await expect(page.getByRole('button', { name: 'Escuchar C: × 3 2 0 1 0' })).toBeVisible();

    // Elegir una forma la hace sonar.
    const counter = page.getByTestId('shape-counter');
    const before = await counter.textContent();
    await page.getByRole('button', { name: /Forma siguiente/ }).click();
    await expect(counter).not.toHaveText(before!);
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(3);

    await bass.getByRole('button', { name: /C\/E/ }).click();
    await expect(bass.getByRole('button', { name: /C\/E/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('La 3 en el bajo.')).toBeVisible();
    await expect(
      page.getByTestId('diapason').getByRole('button', { name: /^Sacar el dedo de la 6\.ª cuerda.*\(3\)$/ }),
    ).toBeVisible();

    await pick(page, 'tipo', 'maj7');
    await expect(page).toHaveURL(/acorde=Cmaj7/);
    await expect(bass.getByRole('button', { name: /Cmaj7\/B/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('se abre con la afinación y el acorde de la URL', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones?afinacion=dadgad&acorde=G');
    await expect(page.locator('#afinacion')).toHaveAttribute('data-value', 'dadgad');
    await expect(
      page.getByRole('group', { name: 'Qué va en el bajo' }).getByRole('button').first(),
    ).toHaveText(/^GFundamental/);
    await page.getByRole('link', { name: 'Afinar en DADGAD' }).click();
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);
    expect(errors).toEqual([]);
  });

  test('los extendidos: el tipo se elige por grupo y tienen cinco notas en el bajo', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones?acorde=E');
    await pick(page, 'tipo', '7#9');
    await expect(page).toHaveURL(/acorde=E7%239/);
    const bass = page.getByRole('group', { name: 'Qué va en el bajo' }).getByRole('button');
    await expect(bass).toHaveCount(5);
    await expect(bass.last()).toHaveAccessibleName('E7♯9/G: 4.ª inversión');
    await bass.last().click();
    await expect(page.getByText('La ♯9 en el bajo.')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('en el celular las cinco inversiones entran en una fila', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/inversiones?acorde=Ebmaj7%2311');
    const group = page.getByRole('group', { name: 'Qué va en el bajo' });
    await expect(group.getByRole('button').nth(1)).toHaveText(/^E♭maj7♯11\/G1\.ª inversión/);
    await expect(group.getByRole('button').nth(1)).toHaveAccessibleName('E♭maj7♯11/G: 1.ª inversión');
    for (const button of await group.getByRole('button').all()) {
      const fits = await button.evaluate((element) =>
        [...element.children].every((child) => child.scrollWidth <= child.clientWidth),
      );
      expect(fits).toBe(true);
    }
  });

  test('arma una forma propia tocando el diapasón y queda en la URL', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones?acorde=C');
    const neck = page.getByTestId('diapason');
    // Del C de siempre: la 6.ª al aire pone el Mi en el bajo.
    await neck.getByRole('button', { name: 'Dejar sonar al aire la 6.ª cuerda (3)' }).click();
    await expect(page).toHaveURL(/forma=0-3-2-0-1-0/);
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(1);
    const mine = page.getByTestId('mi-forma');
    await expect(mine).toContainText('C/E');
    await expect(mine).toContainText('Está en la lista');
    await expect(
      page.getByRole('group', { name: 'Qué va en el bajo' }).getByRole('button', { name: /C\/E/ }),
    ).toHaveAttribute('aria-pressed', 'true');

    // Sacar dedos hasta que falte la quinta.
    await neck.getByRole('button', { name: 'Sacar el dedo de la 3.ª cuerda, al aire (5)' }).click();
    await neck.getByRole('button', { name: 'Sacar el dedo de la 1.ª cuerda, al aire (3)' }).click();
    await expect(page).toHaveURL(/forma=0-3-2-x-1-x/);
    await expect(mine).toContainText('Le falta la 5');

    // Escuchar toca tu forma y no la borra.
    const plucked = await plucks(page);
    await page.getByRole('button', { name: 'Escuchar tu forma', exact: true }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(plucked + 3);
    await expect(page).toHaveURL(/forma=0-3-2-x-1-x/);

    // Al recargar, la forma sigue ahí.
    await page.reload();
    await expect(page.getByTestId('mi-forma')).toContainText('0 3 2 × 1 ×');

    await page.getByRole('button', { name: 'Volver a las formas' }).click();
    await expect(page).not.toHaveURL(/forma=/);
    await expect(page.getByTestId('shape-counter')).toBeVisible();

    await page.getByRole('button', { name: 'Armar la mía' }).click();
    await expect(page.getByTestId('mi-forma')).toContainText('Tu forma está vacía');
    expect(errors).toEqual([]);
  });

  test('las flechas dan la vuelta y el arpegio se recuerda', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones?acorde=C');
    const counter = page.getByTestId('shape-counter');
    const total = Number(/de (\d+)/.exec((await counter.textContent())!)![1]);
    // De la primera, para atrás, se pasa a la última; y de ahí, para adelante, a la primera.
    while (!(await counter.textContent())!.startsWith('Forma 1 ')) {
      await page.getByRole('button', { name: /Forma anterior/ }).click();
    }
    await page.getByRole('button', { name: /Forma anterior/ }).click();
    await expect(counter).toHaveText(`Forma ${total} de ${total}`);
    await page.getByRole('button', { name: /Forma siguiente/ }).click();
    await expect(counter).toHaveText(`Forma 1 de ${total}`);

    // Rasgueo o arpegio es un solo botón: tocarlo pasa a la otra forma, y se recuerda al recargar.
    await page.getByRole('button', { name: 'Cómo suena el acorde: Rasgueo' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Cómo suena el acorde: Arpegio' })).toBeVisible();
    const before = await plucks(page);
    await page.getByRole('button', { name: /^Escuchar C: / }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(before + 3);
    expect(errors).toEqual([]);
  });

  test('avisa cuando la mano no llega a ninguna forma', async ({ page }) => {
    await goto(page, '/inversiones?afinacion=bebebe&acorde=Dbaug');
    await expect(page.getByText(/la mano no llega a ninguna forma/)).toBeVisible();
    await expect(
      page.getByRole('group', { name: 'Qué va en el bajo' }).getByRole('button').first(),
    ).toBeDisabled();
  });
});
