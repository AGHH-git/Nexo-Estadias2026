// ARCHIVO: frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200, // Puerto solicitado en el docker-compose/especificaciones
    host: '0.0.0.0', // Enlazar a todas las interfaces
  },
});
