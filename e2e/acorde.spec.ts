import { expect, test } from '@playwright/test';
import { countSounds, goto, plucks, watchErrors } from './fixtures/helpers';

test.describe('¿Qué acorde?', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('arranca al aire, arma un Do tocando el diapasón y lleva a Inversiones con la forma', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/acorde');
    await expect(
      page.getByRole('navigation', { name: 'Herramientas' }).getByRole('link', { name: '¿Qué acorde?' }),
    ).toHaveAttribute('aria-current', 'page');
    const name = page.getByTestId('acorde-nombre');
    // Todas al aire en la estándar.
    await expect(name).toContainText('Em11');

    const neck = page.getByTestId('diapason');
    await neck.getByRole('button', { name: /^Apagar la 6\.ª cuerda/ }).click();
    await neck.getByRole('button', { name: /^Poner un dedo en la 5\.ª cuerda, traste 3 / }).click();
    await neck.getByRole('button', { name: /^Poner un dedo en la 4\.ª cuerda, traste 2 / }).click();
    await neck.getByRole('button', { name: /^Poner un dedo en la 2\.ª cuerda, traste 1 / }).click();
    await expect(page).toHaveURL(/forma=x-3-2-0-1-0/);
    await expect(name.locator('strong')).toHaveText('C');
    await expect(name).toContainText('Mayor');
    await expect(page.getByTestId('acorde-bajo')).toContainText('La raíz en el bajo');
    // Cada dedo suena al ponerlo.
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(3);

    // Sacar el dedo de la 5.ª: suena el La al aire y pasa a ser un Am7, que también se lee como C6/A.
    await neck.getByRole('button', { name: /^Sacar el dedo de la 5\.ª cuerda, traste 3/ }).click();
    await expect(page).toHaveURL(/forma=x-0-2-0-1-0/);
    await expect(name.locator('strong')).toHaveText('Am7');
    await expect(page.getByTestId('acorde-otras')).toContainText('C6/A');

    // Al recargar, la forma sigue ahí.
    await page.reload();
    await expect(page.getByTestId('acorde-nombre').locator('strong')).toHaveText('Am7');

    await page.getByRole('link', { name: /Todas las formas de Am7 en Inversiones/ }).click();
    await expect(page).toHaveURL(/\/inversiones\?acorde=Am7&forma=x-0-2-0-1-0/);
    await expect(page.getByTestId('mi-forma')).toContainText('Am7');
    expect(errors).toEqual([]);
  });

  test('con una sola nota o con todo apagado lo dice sin inventar un nombre', async ({ page }) => {
    await goto(page, '/acorde?forma=x-x-0-x-x-x');
    const name = page.getByTestId('acorde-nombre');
    await expect(name).toContainText('Una sola nota');
    await page
      .getByTestId('diapason')
      .getByRole('button', { name: /^Apagar la 4\.ª cuerda/ })
      .click();
    await expect(name.locator('strong')).toHaveText('Nada suena');
    await expect(page.getByRole('button', { name: '▶ Escuchar' })).toBeDisabled();

    await page.getByRole('button', { name: 'Todas al aire' }).click();
    await expect(page).not.toHaveURL(/forma=/);
    await expect(name).toContainText('Em11');
  });

  test('lo que no calza justo tiene igual un nombre: un acorde con tensiones, o qué son las notas', async ({
    page,
  }) => {
    await goto(page, '/acorde?forma=x-0-1-0-1-0');
    const name = page.getByTestId('acorde-nombre');
    await expect(name.locator('strong')).toHaveText('Am7(♯11)');
    await expect(page.getByTestId('acorde-color')).toContainText('La ♯11 brilla y flota');
    // Sin tensiones no hay link a Inversiones: ahí no se abre ese acorde.
    await expect(page.getByRole('link', { name: /en Inversiones/ })).toHaveCount(0);

    await goto(page, '/acorde?forma=x-x-0-1-x-x');
    await expect(name.locator('strong')).toHaveText('Tritono');
    await expect(name).not.toContainText('Sin nombre');
  });
});
