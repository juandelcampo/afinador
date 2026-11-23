import { expect, test, type Page } from '@playwright/test';
import { goto, waitForApp, watchErrors } from './fixtures/helpers';

const bar = (page: Page) => page.getByRole('navigation', { name: 'Herramientas' });

test.describe('Donde la dejaste', () => {
  test('cada herramienta vuelve a lo último que tenía, desde la barra y al abrirla de nuevo', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await goto(page, '/escalas?tono=2&escala=mixolidio');
    await goto(page, '/afinador/dadgad');

    // Desde la portada y desde la barra, cada una abre donde estaba.
    await bar(page).getByRole('link', { name: 'Inicio' }).click();
    await page
      .getByRole('link', { name: /Escalas/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/escalas\?tono=2&escala=mixolidio$/);
    await bar(page).getByRole('link', { name: 'Afinador' }).click();
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);

    // Abrirla de nuevo sin nada en la URL también vuelve, sin errores de hidratación.
    await page.goto('/escalas');
    await waitForApp(page);
    await expect(page).toHaveURL(/\/escalas\?tono=2&escala=mixolidio$/);
    await page.goto('/afinador');
    await waitForApp(page);
    await expect(page).toHaveURL(/\/afinador\/dadgad$/);

    // Un link con algo en la URL manda sobre lo de antes, y pasa a ser lo último.
    await goto(page, '/escalas?tono=9');
    await bar(page).getByRole('link', { name: 'Inicio' }).click();
    await bar(page).getByRole('link', { name: 'Escalas' }).click();
    await expect(page).toHaveURL(/\/escalas\?tono=9$/);
    expect(errors).toEqual([]);
  });
});

test.describe('Lo guardado', () => {
  test('una forma se guarda con nombre, se abre desde la lista y se borra', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/acorde?forma=x-3-2-0-1-0');
    await page.getByRole('button', { name: 'Mis formas' }).click();
    const sheet = page.getByTestId('guardados-acorde');
    await expect(sheet.getByRole('textbox')).toHaveValue('C');
    await sheet.getByRole('textbox').fill('El Do de siempre');
    await sheet.getByRole('button', { name: 'Guardar', exact: true }).click();
    const list = sheet.getByTestId('guardados-lista');
    await expect(list.getByRole('link', { name: /El Do de siempre/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Todas al aire' }).click();
    await expect(page).not.toHaveURL(/forma=/);

    // Sigue ahí al recargar, y abrirla trae la forma.
    await page.reload();
    await waitForApp(page);
    await page.getByRole('button', { name: 'Mis formas' }).click();
    await list.getByRole('link', { name: /El Do de siempre/ }).click();
    await expect(page).toHaveURL(/forma=x-3-2-0-1-0/);
    await expect(page.getByTestId('acorde-nombre').locator('strong')).toHaveText('C');
    await expect(sheet).not.toBeVisible();

    await page.getByRole('button', { name: 'Mis formas' }).click();
    await expect(sheet.getByRole('button', { name: 'Renombrar' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Borrar El Do de siempre' }).click();
    await expect(sheet).toContainText('Todavía no guardaste nada');
    expect(errors).toEqual([]);
  });

  test('un ritmo guardado vuelve aunque ya estés en Ritmo', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/ritmo');
    const tabs = page.getByRole('group', { name: 'Tipo de ritmo' });
    await tabs.getByRole('button', { name: 'Euclidiano' }).click();
    await expect(page).toHaveURL(/m=euclid/);
    await page.getByRole('button', { name: 'Mis ritmos' }).click();
    const sheet = page.getByTestId('guardados-ritmo');
    await sheet.getByRole('button', { name: 'Guardar', exact: true }).click();
    await page.keyboard.press('Escape');

    await tabs.getByRole('button', { name: 'Compás' }).click();
    await expect(page).toHaveURL(/m=meter/);
    await page.getByRole('button', { name: 'Mis ritmos' }).click();
    await sheet.getByTestId('guardados-lista').getByRole('link').first().click();
    await expect(page).toHaveURL(/m=euclid/);
    await expect(tabs.getByRole('button', { name: 'Euclidiano' })).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });

  test('una vuelta se guarda desde Tu vuelta', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/armonia?v=C_F_G');
    await page.getByRole('button', { name: 'Abrir tu vuelta' }).click();
    await page.getByRole('button', { name: 'Mis vueltas' }).click();
    const sheet = page.getByTestId('guardados-armonia');
    await expect(sheet.getByRole('textbox')).toHaveValue(/C F G/);
    await sheet.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(sheet.getByTestId('guardados-lista')).toContainText('Estándar');
    expect(errors).toEqual([]);
  });
});
