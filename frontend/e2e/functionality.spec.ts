import { test, expect } from '@playwright/test';

test.describe('Atelier Studio OS — Full Functionality Matrix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('FM-01 & FM-02: Workspace switcher and client context', async ({ page }) => {
    // Check initial workspace is admin
    const adminBtn = page.locator('button.workspace-btn', { hasText: 'ADMIN WORKSPACE' });
    await expect(adminBtn).toHaveClass(/active/);

    // Switch to Customer Portal
    const clientBtn = page.locator('button.workspace-btn', { hasText: 'CUSTOMER PORTAL' });
    await clientBtn.click();
    await expect(clientBtn).toHaveClass(/active/);

    // Assert client portal content loads
    await expect(page.locator('text=AUTHENTICATED CLIENT PORTAL')).toBeVisible();
    await expect(page.locator('text=LATEST APPROVED DRAWINGS')).toBeVisible();

    // Return to studio
    await page.locator('button', { hasText: 'RETURN TO STUDIO' }).click();
    await expect(adminBtn).toHaveClass(/active/);
  });

  test('FM-03 & FM-04: Live clock and notifications bell', async ({ page }) => {
    // Assert live clock is present and ticking
    const clock = page.locator('.studio-status-indicator');
    await expect(clock).toBeVisible();
    await expect(clock).toContainText('BST');

    // Notification bell dropdown
    const bellBtn = page.locator('#btn-notifications, button[title="Notifications"]');
    await bellBtn.click();
    await expect(page.locator('text=NOTIFICATIONS')).toBeVisible();

    // Mark all read
    const markReadBtn = page.locator('button', { hasText: 'Mark all read' });
    if (await markReadBtn.isVisible()) {
      await markReadBtn.click();
      await expect(page.locator('text=All notifications marked as read')).toBeVisible();
    }
  });

  test('FM-05 & FM-06: Navigation Schedule across all views', async ({ page }) => {
    // Navigate to Customers
    await page.locator('.sidebar-nav-item', { hasText: 'Customers' }).click();
    await expect(page.locator('h1')).toContainText('Customer Directory');

    // Navigate to Projects
    await page.locator('.sidebar-nav-item', { hasText: 'Projects' }).click();
    await expect(page.locator('h1')).toContainText('Projects Management');

    // Navigate to Drawings
    await page.locator('.sidebar-nav-item', { hasText: 'Drawings & Blueprints' }).click();
    await expect(page.locator('h1')).toContainText('Drawings & Blueprint Central');

    // Navigate to Documents & Specs
    await page.locator('.sidebar-nav-item', { hasText: 'Documents & Specs' }).click();
    await expect(page.locator('h1')).toContainText('Documents & Specifications');

    // Navigate to Work & Site Updates
    await page.locator('.sidebar-nav-item', { hasText: 'Work & Site Updates' }).click();
    await expect(page.locator('h1')).toContainText('Work & Site Updates');

    // Navigate to Upload Studio
    await page.locator('.sidebar-nav-item', { hasText: 'Upload Studio' }).click();
    await expect(page.locator('h1')).toContainText('Upload Studio');

    // Navigate to Settings
    await page.locator('.sidebar-nav-item', { hasText: 'Settings' }).click();
    await expect(page.locator('h1')).toContainText('Studio Settings');
  });

  test('FM-07: Command palette ⌘K interactive search', async ({ page }) => {
    const searchPill = page.locator('.search-input-wrap').first();
    await searchPill.click();

    // Modal appears
    await expect(page.locator('text=CLIENTS')).toBeVisible();
    await expect(page.locator('text=PROJECTS')).toBeVisible();

    // Type query
    const input = page.locator('.modal-sheet input[type="text"]');
    await input.fill('Sharma');
    await expect(page.locator('text=Rahul Sharma')).toBeVisible();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(page.locator('text=CLIENTS')).not.toBeVisible();
  });

  test('FM-09: Upload drawing revision flow', async ({ page }) => {
    // Open upload modal
    await page.locator('button', { hasText: 'UPLOAD DRAWING' }).first().click();
    await expect(page.locator('text=Upload New Drawing Revision')).toBeVisible();

    // Submit revision
    await page.locator('button', { hasText: 'REGISTER REVISION' }).click();
    await expect(page.locator('text=published to Safe-Build release')).toBeVisible();
  });

  test('FM-23: Vector Lightbox & Redline Diff toggle', async ({ page }) => {
    await page.locator('.sidebar-nav-item', { hasText: 'Drawings & Blueprints' }).click();

    // Click Inspect Vector on featured sheet
    await page.locator('button', { hasText: 'INSPECT VECTOR' }).first().click();
    await expect(page.locator('.modal-sheet.lightbox-sheet')).toBeVisible();

    // Toggle Redline Diff
    const diffBtn = page.locator('button', { hasText: 'TOGGLE REDLINE DIFF' });
    await diffBtn.click();
    await expect(page.locator('.compare-container')).toBeVisible();

    // Close lightbox
    await page.locator('button[title="Close Lightbox"]').click();
    await expect(page.locator('.modal-sheet.lightbox-sheet')).not.toBeVisible();
  });

  test('FM-28 & FM-32: Add Client and One-time PIN display', async ({ page }) => {
    await page.locator('.sidebar-nav-item', { hasText: 'Customers' }).click();

    // Click Add New Client
    await page.locator('button', { hasText: '+ ADD NEW CLIENT' }).click();
    await expect(page.locator('text=Commission New Client Account')).toBeVisible();

    // Fill form
    await page.locator('input[placeholder="e.g. Vikram Singhania"]').fill('Vikram Singhania');
    await page.locator('input[placeholder="e.g. Singhania Villa, Malabar Hill"]').fill('Singhania Villa');
    await page.locator('input[placeholder="+91 98200 00000"]').fill('+91 98205 99999');

    // Submit
    await page.locator('button', { hasText: 'COMMISSION FOLIO' }).click();

    // Assert one-time PIN modal pops up
    await expect(page.locator('text=Temporary Client PIN')).toBeVisible();
    await page.locator('button', { hasText: 'CONFIRM & CLOSE' }).click();
    await expect(page.locator('text=Vikram Singhania')).toBeVisible();
  });

  test('FM-07 Impersonation: View Portal as Client and Exit', async ({ page }) => {
    await page.locator('.sidebar-nav-item', { hasText: 'Customers' }).click();

    // Click View Portal as Client on first card
    await page.locator('button', { hasText: /VIEW PORTAL AS/ }).first().click();

    // Assert impersonation banner
    await expect(page.locator('text=VIEWING AS CLIENT:')).toBeVisible();

    // Exit impersonation
    await page.locator('button', { hasText: 'EXIT CLIENT VIEW' }).click();
    await expect(page.locator('text=Customer Directory')).toBeVisible();
  });
});
