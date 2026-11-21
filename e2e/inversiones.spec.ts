import { expect, test } from '@playwright/test';
import { countSounds, goto, plucks, watchErrors } from './fixtures/helpers';

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
    await page.locator('#tipo').selectOption('');
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
      page.getByTestId('diapason').getByRole('button', { name: /6\.ª cuerda, 3 del acorde/ }),
    ).toBeVisible();

    await page.locator('#tipo').selectOption('maj7');
    await expect(page).toHaveURL(/acorde=Cmaj7/);
    await expect(bass.getByRole('button', { name: /Cmaj7\/B/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('se abre con la afinación y el acorde de la URL', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones?afinacion=dadgad&acorde=G');
    await expect(page.locator('#afinacion')).toHaveValue('dadgad');
    await expect(
      page.getByRole('group', { name: 'Qué va en el bajo' }).getByRole('button').first(),
    ).toHaveText(/^GFundamental/);
    await page.getByRole('link', { name: 'Afinar en DADGAD →' }).click();
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);
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
