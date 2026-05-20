import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core - keep together
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-vendor';
            }
            // React ecosystem
            if (id.includes('/react-router') || id.includes('/@remix-run/')) {
              return 'react-router';
            }
            // UI Libraries
            if (id.includes('/react-bootstrap/') || id.includes('/bootstrap/')) {
              return 'ui-bootstrap';
            }
            if (id.includes('/react-toastify/')) {
              return 'ui-toast';
            }
            if (id.includes('/react-select/') || id.includes('/react-datepicker/') || id.includes('/react-responsive/')) {
              return 'ui-components';
            }
            // Charts
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/lodash/')) {
              return 'charts';
            }
            // Utilities
            if (id.includes('/axios/') || id.includes('/date-fns/') || id.includes('/file-saver/') || id.includes('/html-to-image/')) {
              return 'utils';
            }
            // Icons
            if (id.includes('/lucide-react/')) {
              return 'icons';
            }
            // Auth
            if (id.includes('/oidc-client-ts/') || id.includes('/react-oidc-context/')) {
              return 'auth';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
