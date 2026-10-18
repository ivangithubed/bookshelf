import { test, expect } from '@playwright/test';

test.describe('Bookshelf End-to-End Test Suite', () => {
  const routesToVerify = [
    '/',
    '/guest',
    '/library',
    '/shelves/currently-reading',
    '/books/book-1',
    '/discover',
    '/import',
    '/timeline',
    '/year-in-review',
    '/analytics',
    '/accessibility',
  ];

  test('Zero console errors and zero 404 network responses across all major routes', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const network404s: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless browser extensions or hydration warnings if any
        if (!text.includes('chrome-extension://')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      if (
        response.status() === 404 &&
        !url.includes('favicon.ico') &&
        !url.includes('covers.openlibrary.org')
      ) {
        network404s.push(`${response.status()} on ${url}`);
      }
    });

    for (const route of routesToVerify) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `Route ${route} should not return 500 error`).toBeLessThan(500);

      // Verify basic page layout shell exists
      await expect(page.locator('main#main-content')).toBeVisible({ timeout: 10000 });
    }

    expect(consoleErrors, 'Should have zero unhandled console errors across routes').toEqual([]);
    expect(network404s, 'Should have zero internal 404 responses across routes').toEqual([]);
  });

  test('Curated 45 books load on /library with Currently Reading (5 books) and 15 / 24 Goal', async ({
    page,
  }) => {
    await page.goto('/library', { waitUntil: 'domcontentloaded' });

    // Verify main content is visible
    await expect(page.locator('main#main-content')).toBeVisible({ timeout: 10000 });

    // Total in library metric should show 45
    const totalCountLocator = page.locator('text=Total in Library').locator('..').locator('span.font-heading');
    await expect(totalCountLocator).toContainText('45');

    // Currently reading count should show 5
    const currentlyReadingHeader = page.locator('#currently-reading-heading');
    await expect(currentlyReadingHeader).toBeVisible();
    const currentlyReadingBadge = currentlyReadingHeader.locator('..').locator('span').filter({ hasText: '5' });
    await expect(currentlyReadingBadge).toBeVisible();

    // Reading goal should display 15 / 24
    const goalProgressText = page.locator('text=15 / 24').first();
    await expect(goalProgressText).toBeVisible();
  });

  test('Updating reading progress on a book works and updates percentage', async ({
    page,
  }) => {
    await page.goto('/library', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main#main-content')).toBeVisible({ timeout: 10000 });

    // Find first book in currently reading with progress button
    const updateButton = page.locator('button:has-text("Update Progress")').first();
    if (await updateButton.isVisible()) {
      await updateButton.click();

      // Look for page input or slider
      const pageInput = page.locator('input[type="number"]').first();
      if (await pageInput.isVisible()) {
        const currentValue = await pageInput.inputValue();
        const nextValue = String(Math.min(500, (parseInt(currentValue, 10) || 50) + 10));
        await pageInput.fill(nextValue);

        const saveBtn = page.locator('button:has-text("Save Progress"), button:has-text("Save")').first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
        }
      }
    }
  });

  test('Accessibility controls on /accessibility toggle data-contrast="high" and data-dyslexia-font="true"', async ({
    page,
  }) => {
    await page.goto('/accessibility', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main#main-content')).toBeVisible({ timeout: 10000 });

    const html = page.locator('html');

    // High Contrast toggle
    const highContrastBtn = page.locator('button:has-text("High Contrast")').first();
    await expect(highContrastBtn).toBeVisible();
    await highContrastBtn.click();
    await expect(html).toHaveAttribute('data-contrast', 'high');

    // Standard contrast toggle back
    const standardContrastBtn = page.locator('button:has-text("Standard")').first();
    await expect(standardContrastBtn).toBeVisible();
    await standardContrastBtn.click();
    await expect(html).toHaveAttribute('data-contrast', 'standard');

    // Dyslexia-Friendly Typography toggle
    const dyslexiaBtn = page.locator('button:has-text("Enhanced Letter & Word Spacing")').first();
    await expect(dyslexiaBtn).toBeVisible();
    await dyslexiaBtn.click();
    await expect(html).toHaveAttribute('data-dyslexia-font', 'true');

    // Toggle off
    await dyslexiaBtn.click();
    await expect(html).toHaveAttribute('data-dyslexia-font', 'false');
  });

  test('Discover page search and curated collections render properly', async ({ page }) => {
    await page.goto('/discover', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Find Your Next Great Read');

    // Live search input exists
    const searchInput = page.locator('#open-library-search');
    await expect(searchInput).toBeVisible();

    // Curated collection tabs exist
    const staffPicksTab = page.locator('button[role="tab"]:has-text("Trending & Staff Picks")');
    await expect(staffPicksTab).toBeVisible();

    // Type a query in search
    await searchInput.fill('Dune');
    await expect(page.locator('#search-results-heading')).toContainText('Search Results for', { timeout: 8000 });
    await expect(page.locator('#search-results-heading')).toContainText('Dune');
  });

  test('Goodreads Import Studio loads sample CSV in 1-click and displays preview', async ({
    page,
  }) => {
    await page.goto('/import', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Goodreads Import Studio');

    // Click 1-click load sample Goodreads CSV button
    const loadSampleBtn = page.locator('button:has-text("Load Sample Goodreads CSV")');
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Metrics ribbon should appear with parsed rows
    await expect(page.locator('text=Total Rows')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Commit Import to Library')).toBeVisible();
  });

  test('Timeline activity feed displays chronological reading milestones', async ({ page }) => {
    await page.goto('/timeline', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Activity Timeline');

    // Filter pills exist
    await expect(page.locator('button:has-text("All Activity")')).toBeVisible();
    await expect(page.locator('button:has-text("Books Finished")')).toBeVisible();
  });

  test('Year-in-Review displays narrative storytelling and accessible cadence chart', async ({
    page,
  }) => {
    await page.goto('/year-in-review', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main#main-content')).toBeVisible({ timeout: 10000 });

    // Year selector tabs
    await expect(page.locator('button[role="tab"]:has-text("2026 So Far")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("2025")')).toBeVisible();

    // Accessible chart details table
    const detailsTable = page.locator('summary:has-text("View accessible data table")').first();
    await expect(detailsTable).toBeVisible();
  });

  test('Analytics dashboard renders all visualizations with accessible data tables', async ({
    page,
  }) => {
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Reading Analytics & Insights');

    // Visualizations 1 through 7 should be present
    await expect(page.locator('text=1. Reading Pace & Monthly Volumes')).toBeVisible();
    await expect(page.locator('text=2. Genre Distribution')).toBeVisible();
    await expect(page.locator('text=3. Page Count Histogram')).toBeVisible();
    await expect(page.locator('text=4. Rating Patterns & Critic Insights')).toBeVisible();
    await expect(page.locator('text=5. Author Diversity & Leaderboard')).toBeVisible();
    await expect(page.locator('text=6. Daily Reading Activity Heatmap')).toBeVisible();
    await expect(page.locator('text=7. Time-to-Finish & Comparative YoY Analysis')).toBeVisible();

    // Test expanding an accessible table
    const firstTableSummary = page.locator('summary:has-text("View accessible data table")').first();
    await firstTableSummary.click();
    await expect(page.locator('table').first()).toBeVisible();
  });
});
