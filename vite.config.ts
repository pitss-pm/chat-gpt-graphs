import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { readdirSync } from 'fs';

function copyDir(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      format: {
        ascii_only: true, // Ensure ASCII output
      },
    },
    rollupOptions: {
      input: {
        contentScript: resolve(__dirname, 'extension/contentScript.ts'),
        background: resolve(__dirname, 'extension/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [
    {
      name: 'copy-manifest',
      closeBundle() {
        copyFileSync('extension/manifest.json', 'dist/manifest.json');
        copyFileSync('extension/styles.css', 'dist/styles.css');
        if (existsSync('extension/icons')) {
          copyDir('extension/icons', 'dist/icons');
        }
      },
    },
  ],
});
