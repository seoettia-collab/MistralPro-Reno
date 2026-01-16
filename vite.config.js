import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        '404': resolve(__dirname, '404.html'),
        contact: resolve(__dirname, 'contact.html'),
        cost_calculator: resolve(__dirname, 'cost_calculator.html'),
        degat_des_eaux: resolve(__dirname, 'degat-des-eaux.html'),
        devis: resolve(__dirname, 'devis.html'),
        landing: resolve(__dirname, 'landing.html'),
        mentions_legales: resolve(__dirname, 'mentions-legales.html'),
        merci: resolve(__dirname, 'merci.html'),
        projets: resolve(__dirname, 'projets.html'),
        services: resolve(__dirname, 'services.html')
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
