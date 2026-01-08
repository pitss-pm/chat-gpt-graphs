import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copyDir(src, dest) {
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

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist');
}

// Build contentScript as single IIFE bundle
console.log('Building contentScript.js...');
await build({
  configFile: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      format: {
        ascii_only: true,
      },
    },
    rollupOptions: {
      input: resolve(__dirname, 'extension/contentScript.ts'),
      output: {
        entryFileNames: 'contentScript.js',
        format: 'iife',
        name: 'ChatGPTGraphs',
        inlineDynamicImports: true,
      },
    },
  },
});

// Build background as single IIFE bundle
console.log('Building background.js...');
await build({
  configFile: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      format: {
        ascii_only: true,
      },
    },
    rollupOptions: {
      input: resolve(__dirname, 'extension/background.ts'),
      output: {
        entryFileNames: 'background.js',
        format: 'iife',
        name: 'ChatGPTGraphsBackground',
        inlineDynamicImports: true,
      },
    },
  },
});

// Copy manifest and other files
console.log('Copying manifest and assets...');
copyFileSync('extension/manifest.json', 'dist/manifest.json');
copyFileSync('extension/styles.css', 'dist/styles.css');
if (existsSync('extension/icons')) {
  copyDir('extension/icons', 'dist/icons');
}

// Force ASCII encoding
console.log('Ensuring ASCII encoding...');
execSync('node force-utf8.mjs', { cwd: __dirname, stdio: 'inherit' });

// Remove extended attributes (macOS)
try {
  execSync('xattr -c dist/*.js dist/*.json 2>/dev/null || true', { cwd: __dirname });
} catch (e) {}

console.log('Build complete!');
