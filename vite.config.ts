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
        manualChunks: {
          // React core - keep together
          'react-vendor': ['react', 'react-dom'],
          
          // React ecosystem
          'react-router': ['react-router-dom'],
          
          // UI Libraries
          'ui-bootstrap': ['react-bootstrap'],
          'ui-toast': ['react-toastify'],
          'ui-components': ['react-select', 'react-datepicker', 'react-responsive'],
          
          // Charts - largest library
          'charts': ['recharts'],
          
          // Utilities
          'utils': ['axios', 'date-fns', 'file-saver', 'html-to-image'],
          
          // Icons
          'icons': ['lucide-react'],
          
          // Auth
          'auth': ['oidc-client-ts', 'react-oidc-context'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
