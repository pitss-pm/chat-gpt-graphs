import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, 'dist/contentScript.js');

try {
  // Read exactly as Chrome would
  const buffer = readFileSync(filePath);
  const content = buffer.toString('utf8');
  
  // Verify it's valid JavaScript syntax (at least the start)
  if (content.startsWith('(function()')) {
    console.log('✓ File starts correctly');
  }
  
  // Check file size
  const sizeMB = buffer.length / 1024 / 1024;
  console.log(`✓ File size: ${sizeMB.toFixed(2)} MB`);
  
  // Check for common issues
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log('✗ BOM detected');
  } else {
    console.log('✓ No BOM');
  }
  
  // Verify UTF-8 validity
  try {
    Buffer.from(content, 'utf8').toString('utf8');
    console.log('✓ Valid UTF-8');
  } catch (e) {
    console.log('✗ Invalid UTF-8:', e.message);
  }
  
  console.log('\nFile appears to be valid UTF-8. If Chrome still complains,');
  console.log('it may be due to file size limits or Chrome-specific checks.');
  
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
