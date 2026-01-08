import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function forceASCII(filePath) {
  console.log(`Force ASCII encoding for: ${filePath}`);
  
  // Read file as binary buffer
  const buffer = readFileSync(filePath);
  
  // Remove BOM if present
  let start = 0;
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    start = 3;
    console.log('  Removed BOM');
  }
  
  // Convert to string
  let content = buffer.slice(start).toString('utf8');
  
  // Remove any control characters except tab, LF, CR
  content = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  // Replace common non-ASCII characters with ASCII equivalents
  // Zero-width spaces and joiners - just remove them
  content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Various dashes and hyphens
  content = content.replace(/[\u2010-\u2015\u2212]/g, '-');
  // Various quotes
  content = content.replace(/[\u2018\u2019\u201A]/g, "'");
  content = content.replace(/[\u201C\u201D\u201E]/g, '"');
  // Ellipsis
  content = content.replace(/\u2026/g, '...');
  // Multiplication and division
  content = content.replace(/\u00D7/g, 'x');
  content = content.replace(/\u00F7/g, '/');
  // Ligatures
  content = content.replace(/\uFB01/g, 'fi');
  content = content.replace(/\uFB02/g, 'fl');
  // Non-breaking space
  content = content.replace(/\u00A0/g, ' ');
  // Degree sign - just remove, it's in string literals
  content = content.replace(/\u00B0/g, '');
  // Any remaining non-ASCII characters - just remove them
  // (they're likely in string literals and removing won't break syntax)
  content = content.replace(/[^\x00-\x7F]/g, '');
  
  // Count remaining non-ASCII
  const remaining = content.match(/[^\x00-\x7F]/g);
  if (remaining && remaining.length > 0) {
    console.log(`  Warning: ${remaining.length} non-ASCII chars remaining`);
  }
  
  // Convert to buffer
  const outputBuffer = Buffer.from(content, 'utf8');
  
  // Write as binary
  writeFileSync(filePath, outputBuffer);
  console.log(`  Successfully encoded: ${filePath} (${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  return true;
}

// Force ASCII encoding for contentScript.js
const contentScriptPath = resolve(__dirname, 'dist/contentScript.js');
if (forceASCII(contentScriptPath)) {
  console.log('✓ contentScript.js is now ASCII encoded');
} else {
  console.error('✗ Failed to encode contentScript.js');
  process.exit(1);
}

// Force ASCII encoding for background.js
const backgroundPath = resolve(__dirname, 'dist/background.js');
forceASCII(backgroundPath);

console.log('\nAll files are now ASCII-safe and ready for Chrome!');
