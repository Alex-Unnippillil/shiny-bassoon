import { test, expect } from '@playwright/test';

test('board uses grid roles and supports keyboard navigation', async ({ page }) => {
  await page.goto('/');

  // verify grid role and cell count
  await expect(page.getByRole('grid')).toBeVisible();
  await expect(page.getByRole('gridcell').nth(63)).toBeVisible();

  // keyboard navigation
  const e2 = page.locator('[data-square="e2"]');
  await e2.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAttribute('data-square', 'f2');
});
