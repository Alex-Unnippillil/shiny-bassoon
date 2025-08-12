import { test, expect } from '@playwright/test';

test('ai responds to a legal move', async ({ page }) => {
  await page.goto('/');

  // Perform player's move: pawn from e2 to e4
  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();

  // Wait for AI to make a move and verify a piece appears on expected square
  await expect(page.locator('[data-square="e5"] .piece')).toBeVisible({ timeout: 10000 });
});

