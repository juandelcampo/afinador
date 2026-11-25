import { expect, test } from '@playwright/test';
import { countSounds, goto, plucks, watchErrors } from './fixtures/helpers';

test.describe('¿Qué tonalidad?', () => {
  test.beforeEach(async ({ page }) => {
    await countSounds(page);
  });

  test('escribís los acordes, dice la tonalidad con sus grados y suena', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/tonalidad');
    // Sin nada escrito, ejemplos para tocar.
    await page.getByRole('button', { name: 'Am F C G' }).click();
    await expect(page).toHaveURL(/t=Am\+F\+C\+G/);
    await expect(page.getByTestId('tonalidad').locator('strong')).toHaveText('A menor');
    await expect(page.getByTestId('grados').getByRole('listitem')).toHaveText([
      /Am\s*Im/,
      /F\s*VI/,
      /C\s*III/,
      /G\s*VII/,
    ]);
    await page.getByRole('button', { name: 'Escuchar los acordes' }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(6);

    // Escribir a mano, en castellano, y lo que no se entiende queda dicho.
    const field = page.getByRole('textbox', { name: 'Los acordes de tu tema' });
    await field.fill('Do Sol lam Fa xyz');
    await expect(page.getByTestId('tonalidad').locator('strong')).toHaveText('C mayor');
    await expect(page.getByTestId('sin-leer')).toHaveText('No entendí: xyz');

    // La relativa se puede elegir a mano, y queda en la URL.
    await page.getByRole('button', { name: 'A menor', exact: true }).click();
    await expect(page).toHaveURL(/tono=9m/);
    await expect(page.getByTestId('tonalidad').locator('strong')).toHaveText('A menor');
    expect(errors).toEqual([]);
  });

  test('transporta a otra tónica y dice con qué cejilla se toca', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/tonalidad?t=Bb+F+Gm+Eb');
    await expect(page.getByTestId('tonalidad').locator('strong')).toHaveText('B♭ mayor');
    await page.getByRole('button', { name: 'Llevarlo a D', exact: true }).click();
    await expect(page).toHaveURL(/a=2/);
    await expect(page.getByTestId('corrimiento')).toContainText('+4 semitonos');
    await expect(page.getByTestId('transportados').getByRole('listitem')).toHaveText([
      /D\s*I/,
      /A\s*V/,
      /Bm\s*VIm/,
      /G\s*IV/,
    ]);
    // En Re mayor ya son formas abiertas: no hace falta cejilla.
    await expect(page.getByTestId('cejilla')).not.toContainText('cejilla en el');
    // En la misma, Si bemol, la cejilla en el 3 deja G D Em C.
    await page.getByRole('button', { name: 'B♭: donde está' }).click();
    await expect(page.getByTestId('cejilla')).toContainText('Con cejilla en el 3: tocás G D Em C');
    await page.getByRole('button', { name: /^Escuchar en / }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(6);
    expect(errors).toEqual([]);
  });

  test('una melodía también: las notas dicen la tonalidad', async ({ page }) => {
    const errors = watchErrors(page);
    await goto(page, '/tonalidad');
    await page.getByRole('button', { name: 'Qué escribís: Acordes' }).click();
    await expect(page).toHaveURL(/modo=melodia/);
    await page.getByRole('textbox', { name: 'Las notas de tu melodía' }).fill('la do mi re do si la');
    await expect(page.getByTestId('tonalidad').locator('strong')).toHaveText('A menor');
    await expect(page.getByTestId('tonalidad')).toContainText('7 de 7 notas son de acá');
    await page.getByRole('button', { name: 'Escuchar la melodía' }).click();
    await expect.poll(() => plucks(page)).toBeGreaterThanOrEqual(3);
    expect(errors).toEqual([]);
  });

  test('lleva a Armonía con la tonalidad y los acordes', async ({ page }) => {
    await goto(page, '/tonalidad?t=Am+F+C+G');
    await page.getByRole('link', { name: 'Abrir en Armonía' }).first().click();
    await expect(page).toHaveURL(/\/armonia\?tono=9&escala=natural&v=Am_F_C_G$/);
  });
});
