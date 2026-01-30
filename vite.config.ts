import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Define Global Variables for Client-side
    define: {
      // Inject process.env.API_KEY explicitly
      // This maps the GOOGLE_API_KEY from system env (Docker) or .env file to process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});