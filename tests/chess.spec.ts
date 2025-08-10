import { test, expect } from '@playwright/test';

test('ai responds to a legal move', async ({ page }) => {
  await page.goto('/');

  // Perform player's move: pawn from e2 to e4
  await page.click('[data-square="e2"]');
  await page.click('[data-square="e4"]');

  // Wait for AI to make a move and verify a piece appears on expected square
  await page.waitForSelector('[data-square="e5"] .piece', { timeout: 10000 });
  const aiPiece = await page.$('[data-square="e5"] .piece');
  expect(aiPiece).not.toBeNull();
});
