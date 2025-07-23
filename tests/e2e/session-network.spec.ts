// Playwright E2E test: Session Management under Network Failure
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Adjust these URLs and selectors as needed for your app
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Utility to simulate network offline/online
async function setOffline(page: Page, offline = true) {
  await page.context().setOffline(offline);
}

test.describe('Session Management - Network Failure', () => {
  test('should handle session expiration and refresh with network loss', async ({ page }) => {
    // 1. Go to login page and log in (replace selectors as needed)
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    expect(page.url()).toContain('/dashboard');

    // 2. Simulate network offline
    await setOffline(page, true);
    // Try to trigger a session refresh (e.g., reload or API call)
    await page.reload();
    // Expect an error message or offline UI (customize selector/message)
    // expect(await page.locator('.offline-message').isVisible()).toBeTruthy();

    // 3. Simulate network online
    await setOffline(page, false);
    await page.reload();
    // Expect session to recover or prompt for re-login
    // expect(await page.locator('.dashboard').isVisible()).toBeTruthy();
  });

  test('should log out in all tabs when session is invalidated', async ({ browser }) => {
    // Open two tabs
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    await page1.goto(`${BASE_URL}/auth`);
    await page2.goto(`${BASE_URL}/auth`);
    // Log in both tabs
    await page1.fill('input[type="email"]', 'testuser@example.com');
    await page1.fill('input[type="password"]', 'testpassword');
    await page1.click('button[type="submit"]');
    await page1.waitForURL(`${BASE_URL}/dashboard`);
    await page2.reload();
    await page2.waitForURL(`${BASE_URL}/dashboard`);
    // Log out in one tab
    await page1.click('button.logout'); // Adjust selector
    // Wait for the other tab to detect logout
    await page2.waitForURL(`${BASE_URL}/auth`);
    expect(page2.url()).toContain('/auth');
  });
}); 