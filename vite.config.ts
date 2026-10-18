import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // When running `wrangler pages dev` on 8788, proxy API calls during `vite` dev
    proxy: { '/api': 'http://127.0.0.1:8788' },
  },
  build: { chunkSizeWarningLimit: 1500 },
});
