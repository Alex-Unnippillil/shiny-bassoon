import { test, expect } from '@playwright/test';

test('records moves in history', async ({ page }) => {
  await page.goto('/');

  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();

  // Move is recorded in the history list
  await expect(page.locator('ol li').first()).toHaveText('e2e4');
});

