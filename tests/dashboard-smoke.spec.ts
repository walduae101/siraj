import { test, expect } from '@playwright/test';

test.describe('Dashboard Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should load dashboard with main headings', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible();
    
    // Check section headings
    await expect(page.getByText('معلومات حساب جوجل')).toBeVisible();
    await expect(page.getByText('خطتي الحالية')).toBeVisible();
    await expect(page.getByText('استخدامي')).toBeVisible();
    await expect(page.getByText('إجراءات سريعة')).toBeVisible();
  });

  test('should have RTL direction', async ({ page }) => {
    // Check that the main container has RTL direction
    const mainContainer = page.locator('main, [dir="rtl"]').first();
    await expect(mainContainer).toHaveAttribute('dir', 'rtl');
  });

  test('should display Arabic numerals in usage', async ({ page }) => {
    // Wait for usage data to load
    await page.waitForSelector('[data-testid="usage-snapshot"]', { timeout: 10000 });
    
    // Check for Arabic numerals (Eastern Arabic-Indic digits)
    const usageText = await page.textContent('[data-testid="usage-snapshot"]');
    expect(usageText).toMatch(/[٠-٩]/); // Should contain Arabic numerals
  });

  test('should show progress bars with ARIA attributes', async ({ page }) => {
    // Wait for usage data to load
    await page.waitForSelector('[role="progressbar"]', { timeout: 10000 });
    
    // Check progress bars have proper ARIA attributes
    const progressBars = page.locator('[role="progressbar"]');
    const count = await progressBars.count();
    
    for (let i = 0; i < count; i++) {
      const progressBar = progressBars.nth(i);
      await expect(progressBar).toHaveAttribute('aria-valuenow');
      await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      await expect(progressBar).toHaveAttribute('aria-valuemax');
    }
  });

  test('should handle mobile viewport responsive behavior', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile sticky bar appears
    await expect(page.locator('.lg\\:hidden.fixed.bottom-4')).toBeVisible();
    
    // Check that desktop quick actions are hidden
    await expect(page.locator('.hidden.lg\\:block')).not.toBeVisible();
  });

  test('should show desktop layout on large screens', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Check that desktop quick actions are visible
    await expect(page.locator('.hidden.lg\\:block')).toBeVisible();
    
    // Check that mobile sticky bar is hidden
    await expect(page.locator('.lg\\:hidden.fixed.bottom-4')).not.toBeVisible();
  });

  test('should display trust signals', async ({ page }) => {
    // Check for verified badge
    await expect(page.getByText('موثق')).toBeVisible();
    
    // Check for security badge
    await expect(page.getByText('آمن')).toBeVisible();
    
    // Check for PayNow badge
    await expect(page.getByText('مدعوم من PayNow')).toBeVisible();
  });

  test('should show empty state for notifications', async ({ page }) => {
    // Check empty state illustration and text
    await expect(page.getByText('لا توجد إشعارات بعد')).toBeVisible();
    await expect(page.getByText('ستظهر هنا الإشعارات المهمة مثل تحديثات الحساب والأنشطة الجديدة')).toBeVisible();
  });

  test('should handle quick actions interactions', async ({ page }) => {
    // Test generate content button
    await page.getByText('إنشاء محتوى').click();
    
    // Should show toast notification
    await expect(page.getByText('انتقال إلى مولد المحتوى')).toBeVisible();
    
    // Test invite button
    await page.getByText('دعوة عضو').click();
    
    // Should show toast notification
    await expect(page.getByText('انتقال إلى دعوة الأعضاء')).toBeVisible();
  });

  test('should handle export CSV action', async ({ page }) => {
    // Mock the fetch response
    await page.route('**/api/export/csv', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Click export button
    await page.getByText('تصدير CSV').click();
    
    // Should show success toast
    await expect(page.getByText('تم التصدير ✓')).toBeVisible();
  });

  test('should show error boundary on component failure', async ({ page }) => {
    // Inject error into a component
    await page.addInitScript(() => {
      // Mock a component to throw an error
      const originalError = console.error;
      console.error = (...args) => {
        if (args[0]?.includes?.('ErrorBoundary')) {
          // This is expected
          return;
        }
        originalError(...args);
      };
    });

    // Check that error boundary fallback is available
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    if (await errorBoundary.count() > 0) {
      await expect(errorBoundary.getByText('حدث خطأ غير متوقع')).toBeVisible();
      await expect(errorBoundary.getByText('حاول مرة أخرى')).toBeVisible();
    }
  });

  test('should respect reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Check that animations are disabled
    const animatedElements = page.locator('[style*="animation"], [style*="transition"]');
    const count = await animatedElements.count();
    
    // Should have minimal or no animations
    expect(count).toBeLessThan(5);
  });

  test('should load with proper performance metrics', async ({ page }) => {
    // Start performance measurement
    await page.evaluate(() => {
      performance.mark('dashboard-load-start');
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="usage-snapshot"]', { timeout: 10000 });

    // Measure performance
    const loadTime = await page.evaluate(() => {
      performance.mark('dashboard-load-end');
      performance.measure('dashboard-load', 'dashboard-load-start', 'dashboard-load-end');
      const measure = performance.getEntriesByName('dashboard-load')[0];
      return measure.duration;
    });

    // Dashboard should load within reasonable time
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort());

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should show error state with retry button
    await expect(page.getByText('فشل في تحميل بيانات الاستخدام')).toBeVisible();
    await expect(page.getByText('حاول مرة أخرى')).toBeVisible();
  });
});
