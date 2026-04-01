import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the right page
    expect(page.url()).toContain("localhost:5000");
  });

  test("should have proper page title", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/SWARM|Workflow/i);
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/");

    // Check for navigation elements
    const nav = page.locator("nav, header").first();
    await expect(nav).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto("/");

      // Check viewport
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(600);

      // Verify content is visible
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

test.describe("Health Endpoints", () => {
  test("should return healthy status from /health", async ({ request }) => {
    const response = await request.get("/health");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("timestamp");
  });

  test("should return ready status from /ready", async ({ request }) => {
    const response = await request.get("/ready");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("ready");
  });
});
