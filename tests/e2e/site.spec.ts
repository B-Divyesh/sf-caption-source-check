import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/privacy/', '/terms/']) {
  test(`${path} has no serious accessibility violations or console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    const highImpact = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
    expect(highImpact, JSON.stringify(highImpact, null, 2)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('the download and responsive navigation work', async ({ page }, testInfo) => {
  await page.goto('/');
  const download = page.getByRole('link', { name: /download extension/i }).first();
  await expect(download).toHaveAttribute('href', '/downloads/caption-source-check.zip');
  const response = await page.request.get('/downloads/caption-source-check.zip');
  expect(response.ok()).toBe(true);

  if (testInfo.project.name === 'mobile-390') {
    const menu = page.getByRole('button', { name: 'Open menu' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeHidden();
    await menu.click();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  }
});

test('keyboard users can skip to content and operate the mobile menu', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  if (testInfo.project.name === 'mobile-390') {
    const menu = page.getByRole('button', { name: 'Open menu' });
    await menu.focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  }
});

test('reader skip link moves keyboard focus to the live-caption transcript', async ({ page }) => {
  const reader = readFileSync('entrypoints/reader/index.html', 'utf8')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/, '');
  await page.setContent(reader);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to live captions' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#transcript')).toBeFocused();
});
