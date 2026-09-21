import { defineConfig } from 'vitest/config';

// Each workspace defines its own environment (jsdom for web, node for server/shared).
export default defineConfig({
  test: {
    projects: ['apps/web', 'apps/server', 'packages/shared'],
  },
});
