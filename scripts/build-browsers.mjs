/**
 * Multi-browser build script
 * Generates browser-specific extension packages
 */

import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  copyFileSync, mkdirSync, existsSync, readdirSync, 
  writeFileSync, readFileSync, rmSync
} from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Browser configurations
const browsers = {
  chrome: {
    name: 'Chrome',
    manifestVersion: 3,
    outputDir: 'dist-chrome',
  },
  firefox: {
    name: 'Firefox',
    manifestVersion: 3,
    outputDir: 'dist-firefox',
    browserSpecificSettings: {
      gecko: {
        id: 'chatgpt-graphs@extension',
        strict_min_version: '109.0'
      }
    }
  },
  edge: {
    name: 'Edge',
    manifestVersion: 3,
    outputDir: 'dist-edge',
  },
  opera: {
    name: 'Opera',
    manifestVersion: 3,
    outputDir: 'dist-opera',
  }
};

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

function generateManifest(browser, config) {
  const baseManifest = JSON.parse(
    readFileSync(resolve(rootDir, 'extension/manifest.json'), 'utf-8')
  );

  // Browser-specific modifications
  const manifest = { ...baseManifest };

  // Firefox-specific settings
  if (browser === 'firefox' && config.browserSpecificSettings) {
    manifest.browser_specific_settings = config.browserSpecificSettings;
    // Firefox doesn't support service_worker in the same way
    if (manifest.background && manifest.background.service_worker) {
      manifest.background = {
        scripts: [manifest.background.service_worker]
      };
    }
  }

  // Add browser name to description for clarity
  manifest.description = `${baseManifest.description} (${config.name})`;

  return manifest;
}

async function buildForBrowser(browser, config) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Building for ${config.name}...`);
  console.log(`${'='.repeat(50)}\n`);

  const outputDir = resolve(rootDir, config.outputDir);

  // Clean output directory
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true });
  }
  mkdirSync(outputDir, { recursive: true });

  // Build contentScript
  console.log(`Building contentScript.js for ${config.name}...`);
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: config.outputDir,
      emptyOutDir: false,
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        format: {
          ascii_only: true,
        },
      },
      rollupOptions: {
        input: resolve(rootDir, 'extension/contentScript.ts'),
        output: {
          entryFileNames: 'contentScript.js',
          format: 'iife',
          name: 'ChatGPTGraphs',
          inlineDynamicImports: true,
        },
      },
    },
  });

  // Build background script
  console.log(`Building background.js for ${config.name}...`);
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: config.outputDir,
      emptyOutDir: false,
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        format: {
          ascii_only: true,
        },
      },
      rollupOptions: {
        input: resolve(rootDir, 'extension/background.ts'),
        output: {
          entryFileNames: 'background.js',
          format: 'iife',
          name: 'ChatGPTGraphsBackground',
          inlineDynamicImports: true,
        },
      },
    },
  });

  // Generate browser-specific manifest
  const manifest = generateManifest(browser, config);
  writeFileSync(
    resolve(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // Copy styles
  copyFileSync(
    resolve(rootDir, 'extension/styles.css'),
    resolve(outputDir, 'styles.css')
  );

  // Copy icons if they exist
  const iconsDir = resolve(rootDir, 'extension/icons');
  if (existsSync(iconsDir)) {
    copyDir(iconsDir, resolve(outputDir, 'icons'));
  }

  // Force ASCII encoding
  console.log(`Ensuring ASCII encoding for ${config.name}...`);
  const contentScriptPath = resolve(outputDir, 'contentScript.js');
  if (existsSync(contentScriptPath)) {
    let content = readFileSync(contentScriptPath, 'utf-8');
    // Remove control characters and non-ASCII
    content = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
    content = content.replace(/[^\x00-\x7F]/g, '');
    writeFileSync(contentScriptPath, content, 'utf-8');
  }

  const backgroundPath = resolve(outputDir, 'background.js');
  if (existsSync(backgroundPath)) {
    let content = readFileSync(backgroundPath, 'utf-8');
    content = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
    content = content.replace(/[^\x00-\x7F]/g, '');
    writeFileSync(backgroundPath, content, 'utf-8');
  }

  console.log(`✓ ${config.name} build complete: ${config.outputDir}/`);
  
  return outputDir;
}

async function createZip(outputDir, browser, config) {
  const zipName = `chatgpt-graphs-${browser}-v${getVersion()}.zip`;
  const zipPath = resolve(rootDir, 'releases', zipName);
  
  // Create releases directory
  const releasesDir = resolve(rootDir, 'releases');
  if (!existsSync(releasesDir)) {
    mkdirSync(releasesDir, { recursive: true });
  }

  // Remove old zip if exists
  if (existsSync(zipPath)) {
    rmSync(zipPath);
  }

  // Create zip using command line
  try {
    execSync(`cd "${outputDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
    console.log(`✓ Created ${zipName}`);
  } catch (e) {
    console.warn(`⚠ Could not create zip for ${browser}. You may need to install 'zip' command.`);
  }

  return zipPath;
}

function getVersion() {
  const pkg = JSON.parse(
    readFileSync(resolve(rootDir, 'package.json'), 'utf-8')
  );
  return pkg.version;
}

// Parse command line arguments
const args = process.argv.slice(2);
const targetBrowser = args[0];
const shouldZip = args.includes('--zip');

async function main() {
  console.log('🚀 ChatGPTGraphs Multi-Browser Build');
  console.log(`Version: ${getVersion()}`);
  console.log(`Creating zip: ${shouldZip}`);
  
  const browsersTouild = targetBrowser && browsers[targetBrowser] 
    ? { [targetBrowser]: browsers[targetBrowser] }
    : browsers;

  const results = [];

  for (const [browser, config] of Object.entries(browsersTouild)) {
    try {
      const outputDir = await buildForBrowser(browser, config);
      
      if (shouldZip) {
        await createZip(outputDir, browser, config);
      }
      
      results.push({ browser, success: true });
    } catch (error) {
      console.error(`✗ Failed to build for ${config.name}:`, error.message);
      results.push({ browser, success: false, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Build Summary:');
  console.log('='.repeat(50));
  
  results.forEach(({ browser, success, error }) => {
    const status = success ? '✓' : '✗';
    console.log(`${status} ${browsers[browser].name}: ${success ? 'Success' : error}`);
  });

  const failedCount = results.filter(r => !r.success).length;
  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
