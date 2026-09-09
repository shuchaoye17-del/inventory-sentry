import { expect, test, type Page } from '@playwright/test';

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const input = document.querySelector('input[type="file"]');
    return input
      ? Object.keys(input).some((key) => key.startsWith('__reactProps'))
      : false;
  });
}

test('blocks a mass-zero feed and records rejection', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await page
    .getByLabel('Current supplier file')
    .setInputFiles('tests/fixtures/mass-zero-current.csv');
  await expect(page.getByText('mass-zero-current.csv')).toBeVisible();
  await page.getByRole('button', { name: 'Continue to mapping' }).click();
  await page.getByLabel('Current SKU column').selectOption('SKU');
  await page.getByLabel('Current quantity column').selectOption('Quantity');

  await page
    .getByLabel('Previous known-good file')
    .setInputFiles('tests/fixtures/previous-good.csv');
  await expect(page.getByText('previous-good.csv')).toBeVisible();
  await page.getByLabel('Previous SKU column').selectOption('SKU');
  await page.getByLabel('Previous quantity column').selectOption('Quantity');
  await page.getByRole('button', { name: 'Run safety check' }).click();

  await expect(
    page.getByRole('heading', { name: 'RED — Update blocked' }),
  ).toBeVisible();
  await expect(page.getByText('MASS_ZEROING')).toBeVisible();
  await expect(page.getByText('25 affected SKUs')).toBeVisible();
  await page.getByRole('button', { name: 'Reject scan' }).click();
  await expect(page.getByText('Decision saved: rejected')).toBeVisible();
  await page.getByRole('button', { name: 'Scan history' }).click();
  await expect(page.getByText('Rejected')).toBeVisible();
});

test('passes a clean current feed', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await page
    .getByLabel('Current supplier file')
    .setInputFiles('tests/fixtures/clean-current.csv');
  await page.getByRole('button', { name: 'Continue to mapping' }).click();
  await page.getByLabel('Current SKU column').selectOption('SKU');
  await page.getByLabel('Current quantity column').selectOption('Quantity');
  await page.getByRole('button', { name: 'Run safety check' }).click();

  await expect(
    page.getByRole('heading', {
      name: 'GREEN — No meaningful risk detected',
    }),
  ).toBeVisible();
});
