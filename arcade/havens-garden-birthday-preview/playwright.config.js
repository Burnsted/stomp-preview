// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const PORT = Number(process.env.HG_PORT || 8799);
const BASE = `http://127.0.0.1:${PORT}/arcade/havens-garden-birthday-preview`;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 180000,
  expect: { timeout: 30000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-evidence/playwright-results.json' }]
  ],
  outputDir: 'test-evidence/test-output',
  use: {
    baseURL: BASE + '/',
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `node arcade/havens-garden-birthday-preview/scripts/static-server.mjs ${PORT}`,
    url: BASE + '/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: path.join(__dirname, '../..')
  },
  projects: [
    {
      name: 'chromium-phone',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: devices['iPhone 14'].userAgent
      }
    }
  ]
});
