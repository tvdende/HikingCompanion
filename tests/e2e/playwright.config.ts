import { defineConfig, devices } from '@playwright/test';

const PLANNER_RESPONSIVE_SPECS = 'planner-responsive/**/*.spec.ts';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: PLANNER_RESPONSIVE_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-iphone',
      testIgnore: PLANNER_RESPONSIVE_SPECS,
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'mobile-pixel',
      testIgnore: PLANNER_RESPONSIVE_SPECS,
      use: { ...devices['Pixel 7'] },
    },
    // Responsive planner suite: one project per supported device category.
    {
      name: 'planner-mobile',
      testMatch: PLANNER_RESPONSIVE_SPECS,
      metadata: { category: 'mobile' },
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 800 },
        screen: { width: 360, height: 800 },
      },
    },
    {
      name: 'planner-tablet',
      testMatch: PLANNER_RESPONSIVE_SPECS,
      metadata: { category: 'tablet' },
      use: {
        ...devices['iPad (gen 7)'],
        viewport: { width: 820, height: 1180 },
        screen: { width: 820, height: 1180 },
      },
    },
    {
      name: 'planner-laptop',
      testMatch: PLANNER_RESPONSIVE_SPECS,
      metadata: { category: 'laptop' },
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        screen: { width: 1366, height: 768 },
      },
    },
    {
      name: 'planner-desktop',
      testMatch: PLANNER_RESPONSIVE_SPECS,
      metadata: { category: 'desktop' },
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        screen: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    cwd: '../../apps/web',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
