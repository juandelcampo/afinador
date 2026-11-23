import { expect, test } from '@playwright/test';
import { goto, watchErrors } from './fixtures/helpers';

test('la portada lleva a cada herramienta, y la marca vuelve a la portada', async ({ page }) => {
  const errors = watchErrors(page);
  await goto(page, '/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Elegí una herramienta');
  const main = page.locator('main');

  await main.getByRole('link', { name: /Afinador/ }).click();
  await expect(page).toHaveURL(/\/afinador$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Estándar');
  const tools = page.getByRole('navigation', { name: 'Herramientas' });
  await expect(tools.getByRole('link', { name: 'Afinador' })).toHaveAttribute('aria-current', 'page');

  await tools.getByRole('link', { name: 'Inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
  await main.getByRole('link', { name: /Armonía/ }).click();
  await expect(page).toHaveURL(/\/armonia$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Armonía');

  await tools.getByRole('link', { name: 'Inicio' }).click();
  await main.getByRole('link', { name: /Inversiones/ }).click();
  await expect(page).toHaveURL(/\/inversiones$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inversiones');
  expect(errors).toEqual([]);
});

test('el tema sigue al sistema hasta que se elige uno, y queda elegido al volver', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 800 });
  await goto(page, '/');
  const fondo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await fondo()).toBe('rgb(0, 0, 0)');

  await page.getByRole('button', { name: /^Ajustes/ }).click();
  await page.getByRole('button', { name: 'Tema: Oscuro' }).click();
  await expect(page.getByRole('button', { name: 'Tema: Claro' })).toBeVisible();
  expect(await fondo()).toBe('rgb(255, 255, 255)');

  // Al recargar, el claro elegido manda sobre el sistema oscuro desde antes de que arranque la app.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await fondo()).toBe('rgb(255, 255, 255)');
  expect(errors).toEqual([]);
});
