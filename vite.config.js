import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      // Main entry point for the library
      entry: resolve(__dirname, 'src/index.js'),
      name: 'ForceCalendarInterface',
      // Output file names
      fileName: (format) => {
        if (format === 'es') return 'force-calendar-interface.esm.js';
        if (format === 'umd') return 'force-calendar-interface.umd.js';
        return `force-calendar-interface.${format}.js`;
      }
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Global variable name for UMD build
        globals: {}
      }
    },
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Clear output directory before build
    emptyOutDir: true,
    // Output directory
    outDir: 'dist'
  },
  server: {
    port: 5000,
    open: true
  }
});