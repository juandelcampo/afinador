import { expect, test } from '@playwright/test';
import { goto, watchErrors } from './fixtures/helpers';
import { micWith } from './fixtures/mic';

test.use(micWith('c2-sharp20.wav'));

test('con un C2 20 cents agudo, lee el desvío e indica bajar', async ({ page }) => {
  const errors = watchErrors(page);
  await goto(page, '/afinador/cgcfce');
  await page.locator('#mic-toggle').click();
  await expect(page.getByTestId('meter-status')).toHaveText(/Bajá/, { timeout: 5000 });
  // "Bajá" aparece apenas la lectura pasa el umbral; el valor tarda un poco más en asentarse.
  await expect
    .poll(async () => Math.abs(Number(await page.getByTestId('meter').getAttribute('data-cents')) - 20), {
      timeout: 3000,
    })
    .toBeLessThan(3);
  expect(errors).toEqual([]);
});
