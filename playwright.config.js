import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // Rapport HTML (publié par la CI en cas d'échec) en plus de la sortie console.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    // Trace (captures, DOM, réseau) conservée pour les tests en échec.
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
