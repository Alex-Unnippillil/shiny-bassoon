import { test, expect } from '@playwright/test';

test('announces player move', async ({ page }) => {
  await page.goto('/');

  // Perform player's move: pawn from e2 to e4
  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();

  // Verify player's move announcement
  const announcer = page.getByTestId('announcer');
  await expect.poll(async () => await announcer.textContent()).toBe('Player moved e2 to e4');
});

test('board has grid roles and announces moves and orientation', async ({ page }) => {
  await page.goto('/');
  const grid = page.getByRole('grid');
  await expect(grid).toBeVisible();
  await expect(grid.locator('[role="gridcell"]').first()).toBeVisible();

  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();
  const announcer = page.getByTestId('announcer');
  await expect.poll(async () => await announcer.textContent()).toContain('moved');

  await page.getByRole('button', { name: 'Toggle board orientation' }).click();
  await expect(announcer).toHaveText(/Board orientation is now (white|black) at bottom/);
});

