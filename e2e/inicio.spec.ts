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
