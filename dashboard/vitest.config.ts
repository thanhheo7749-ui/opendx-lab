// ==============================================================================
// OpenDX-Lab / ShopWise
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
