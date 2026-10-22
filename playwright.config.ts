import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 45000, workers: 1,
  outputDir: 'outputs/playwright', reporter: [['list'], ['html', { outputFolder: 'outputs/browser-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3101', channel: 'msedge', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node --import tsx scripts/e2e-server.ts', url: 'http://127.0.0.1:3101/api/health', reuseExistingServer: false, timeout: 60000 },
});
