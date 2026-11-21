import { expect, test } from '@playwright/test';
import { countSounds, goto, plucks, watchErrors } from './fixtures/helpers';

test.describe('inversiones', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('elige el acorde, lo guarda en la URL y cada figura suena al tocarla', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones');
    await expect(
      page.getByRole('navigation', { name: 'Herramientas' }).getByRole('link', { name: 'Inversiones' }),
    ).toHaveAttribute('aria-current', 'page');

    await page
      .getByRole('group', { name: 'Nota del acorde' })
      .getByRole('button', { name: 'C', exact: true })
      .click();
    await page.getByRole('group', { name: 'Tipo de acorde' }).getByRole('button', { name: 'Mayor' }).click();
    await expect(page).toHaveURL(/acorde=C(&|$)/);
    await expect(page.getByTestId('chord-name')).toHaveText('C');

    // Las tres inversiones, cada una con su nota en el bajo.
    await expect(page.getByRole('region', { name: 'Fundamental' })).toContainText('la raíz en el bajo');
    await expect(page.getByRole('region', { name: '1.ª inversión' })).toContainText('C/E');
    await expect(page.getByRole('region', { name: '2.ª inversión' })).toContainText('C/G');
    await expect(page.getByRole('region', { name: '3.ª inversión' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Escuchar C: × 3 2 0 1 0' }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(5);
    await expect(page.getByRole('button', { name: 'Escuchar C: × 3 2 0 1 0' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Las llenas que no entran de entrada se piden aparte.
    const more = page.getByRole('region', { name: '1.ª inversión' }).getByRole('button', { name: /Ver las/ });
    const before = await page.getByTestId('llenas-1').getByRole('listitem').count();
    await more.click();
    await expect
      .poll(() => page.getByTestId('llenas-1').getByRole('listitem').count())
      .toBeGreaterThan(before);

    await page.getByRole('group', { name: 'Tipo de acorde' }).getByRole('button', { name: 'maj7' }).click();
    await expect(page).toHaveURL(/acorde=Cmaj7/);
    await expect(page.getByRole('region', { name: '3.ª inversión' })).toContainText('Cmaj7/B');
    expect(errors).toEqual([]);
  });

  test('se abre con la afinación y el acorde de la URL', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/inversiones?afinacion=dadgad&acorde=G');
    await expect(page.locator('#afinacion')).toHaveValue('dadgad');
    await expect(page.getByTestId('chord-name')).toHaveText('G');
    await page.getByRole('link', { name: 'Afinar en DADGAD →' }).click();
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);
    expect(errors).toEqual([]);
  });

  test('avisa cuando la mano no llega a ninguna figura', async ({ page }) => {
    await goto(page, '/inversiones?afinacion=bebebe&acorde=Dbaug');
    await expect(page.getByText('En esta afinación la mano no llega a ninguna.')).toHaveCount(3);
  });
});
